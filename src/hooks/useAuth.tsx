import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import type { User } from "@supabase/supabase-js";

type AppRole = "admin" | "writer" | "user" | null;

interface AuthContextType {
  user: User | null;
  role: AppRole;
  loading: boolean;
  roleLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null; needsVerification: boolean }>;
  resendVerification: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SYNC_KEY = "jss-auth-sync";
const CHANNEL_NAME = "jss-auth";

const normalizeEmailForAuth = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
    .trim()
    .toLowerCase();

const normalizePasswordForAuth = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const fetchRole = async (userId: string) => {
    setRoleLoading(true);
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      setRole(data?.role ?? "user");
    } catch {
      setRole("user");
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const applySession = (session: any) => {
      if (cancelled) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        setTimeout(() => fetchRole(u.id), 0);
      } else {
        setRole(null);
        setRoleLoading(false);
      }
      setLoading(false);
    };

    // Pull session from storage (with small delay to let supabase finish writing on the other tab)
    const resyncFromStorage = (delay = 0) => {
      const run = () =>
        supabase.auth.getSession().then(({ data: { session } }) => applySession(session));
      if (delay > 0) setTimeout(run, delay);
      else run();
    };

    // Source of truth: supabase auth state changes (fires on login, logout, token refresh, and storage-driven changes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      applySession(session);
      // Notify other tabs after the auth client has settled.
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        try {
          localStorage.setItem(SYNC_KEY, JSON.stringify({ event, ts: Date.now() }));
        } catch { /* noop */ }
        try { channelRef.current?.postMessage({ event, ts: Date.now() }); } catch { /* noop */ }
      }
    });

    // Initial hydration
    supabase.auth.getSession()
      .then(({ data: { session } }) => applySession(session))
      .catch(() => applySession(null));

    // Cross-tab sync via storage (fires in OTHER tabs only — perfect for sync)
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      // Our explicit sync ping
      if (e.key === SYNC_KEY) {
        resyncFromStorage(150);
        return;
      }
      // Direct supabase token key changes (sb-<ref>-auth-token)
      if (e.key.startsWith("sb-") && e.key.endsWith("-auth-token")) {
        resyncFromStorage(150);
      }
    };
    window.addEventListener("storage", onStorage);

    // BroadcastChannel fast-path
    try {
      const ch = new BroadcastChannel(CHANNEL_NAME);
      ch.onmessage = () => resyncFromStorage(150);
      channelRef.current = ch;
    } catch { /* noop */ }

    // Refresh when tab regains focus
    const onVisibility = () => {
      if (document.visibilityState === "visible") resyncFromStorage(0);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      try { channelRef.current?.close(); } catch { /* noop */ }
      channelRef.current = null;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = normalizeEmailForAuth(email);
    const normalizedPassword = normalizePasswordForAuth(password);

    const { data: current } = await supabase.auth.getSession();
    if (current.session?.user?.email?.toLowerCase() === normalizedEmail) {
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { error: "ईमेल या पासवर्ड मेल नहीं खा रहा है। कृपया पासवर्ड दिखाकर जांचें या पासवर्ड रीसेट करें।" };
      }
      return { error: error.message };
    }
    return { error: null };
  };

  const signInWithGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result.error) {
      return { error: "Google लॉगिन शुरू नहीं हो पाया। कृपया थोड़ी देर बाद फिर कोशिश करें।" };
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = window.location.origin;
    const normalizedEmail = normalizeEmailForAuth(email);
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: normalizePasswordForAuth(password),
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });
    if (error) {
      if (error.message.toLowerCase().includes("weak") || error.message.toLowerCase().includes("pwned")) {
        return {
          error: "यह पासवर्ड बहुत कमजोर है। कम से कम 8 अक्षर रखें और बड़े अक्षर, छोटे अक्षर, संख्या व विशेष चिन्ह का उपयोग करें।",
          needsVerification: false,
        };
      }
      if (error.message.includes("already registered")) {
        return { error: "यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें।", needsVerification: false };
      }
      return { error: error.message, needsVerification: false };
    }
    const needsVerification = !!(data.user && !data.user.email_confirmed_at && !data.session);
    return { error: null, needsVerification };
  };

  const resendVerification = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizeEmailForAuth(email),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      return { error: "वेरिफिकेशन ईमेल दोबारा भेजने में दिक्कत आई। कृपया थोड़ी देर बाद फिर कोशिश करें।" };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will broadcast SIGNED_OUT to other tabs.
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, roleLoading, signIn, signInWithGoogle, signUp, resendVerification, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
