import { createContext, useContext, useCallback, useEffect, useState, ReactNode, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import type { Session, User } from "@supabase/supabase-js";

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
const POST_AUTH_PATH_KEY = "jss-post-auth-path";

const AUTH_SYNC_RETRY_DELAYS = [0, 120, 300, 700, 1200, 2000];

const notifyAuthTabs = (event: string) => {
  const payload = { event, ts: Date.now() };
  try {
    localStorage.setItem(SYNC_KEY, JSON.stringify(payload));
  } catch { /* noop */ }
  return payload;
};

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const normalizeEmailForAuth = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
    .trim()
    .toLowerCase();

const stripInvisiblePasswordChars = (value: string) =>
  value.replace(/[\u200B-\u200D\uFEFF]/g, "");

const getPasswordAttempts = (value: string) => {
  const stripped = stripInvisiblePasswordChars(value);
  const legacyNormalized = stripped.normalize("NFKC");
  const trimmed = stripped.trim();
  return Array.from(new Set([value, stripped, trimmed, legacyNormalized].filter(Boolean)));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const fetchRole = useCallback(async (userId: string) => {
    setRoleLoading(true);
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const roles = (data ?? []).map((item) => item.role as AppRole);
      setRole(roles.includes("admin") ? "admin" : roles.includes("writer") ? "writer" : "user");
    } catch {
      setRole("user");
    } finally {
      setRoleLoading(false);
    }
  }, []);

  const applySession = useCallback((session: Session | null) => {
    const u = session?.user ?? null;
    setUser(u);
    if (u) {
      window.setTimeout(() => fetchRole(u.id), 0);
    } else {
      setRole(null);
      setRoleLoading(false);
    }
    setLoading(false);
  }, [fetchRole]);

  const hydrateSession = useCallback(async ({ applyNull = true, expectedUserId }: { applyNull?: boolean; expectedUserId?: string } = {}) => {
    let lastSession: Session | null = null;

    for (const wait of AUTH_SYNC_RETRY_DELAYS) {
      if (wait > 0) await delay(wait);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        lastSession = session ?? null;
        if (!expectedUserId || session?.user?.id === expectedUserId) {
          if (session || applyNull) applySession(session ?? null);
          return session ?? null;
        }
      } catch {
        lastSession = null;
      }
    }

    if (lastSession || applyNull) applySession(lastSession);
    return lastSession;
  }, [applySession]);

  useEffect(() => {
    let cancelled = false;

    const safeApplySession = (session: Session | null) => {
      if (!cancelled) applySession(session);
    };

    // Pull session from storage with retries. Mobile browsers often deliver the
    // storage/broadcast event before the auth token is readable in background tabs.
    const safeHydrateSession = async ({ applyNull = true }: { applyNull?: boolean } = {}) => {
      let lastSession: Session | null = null;
      for (const wait of AUTH_SYNC_RETRY_DELAYS) {
        if (wait > 0) await delay(wait);
        if (cancelled) return null;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          lastSession = session ?? null;
          if (session) {
            safeApplySession(session);
            return session;
          }
        } catch {
          lastSession = null;
        }
      }
      if (applyNull) safeApplySession(lastSession);
      return lastSession;
    };

    // Source of truth: supabase auth state changes (fires on login, logout, token refresh, and storage-driven changes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      safeApplySession(session);
      // Notify other tabs after the auth client has settled.
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        const payload = notifyAuthTabs(event);
        try { channelRef.current?.postMessage(payload); } catch { /* noop */ }
      }
    });

    // Initial hydration
    void safeHydrateSession({ applyNull: true });

    // Cross-tab sync via storage (fires in OTHER tabs only — perfect for sync)
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      // Our explicit sync ping
      if (e.key === SYNC_KEY) {
        let event = "";
        try { event = JSON.parse(e.newValue || "{}").event || ""; } catch { /* noop */ }
        void safeHydrateSession({ applyNull: event === "SIGNED_OUT" });
        return;
      }
      // Direct supabase token key changes (sb-<ref>-auth-token)
      if (e.key.startsWith("sb-") && e.key.endsWith("-auth-token")) {
        void safeHydrateSession({ applyNull: e.newValue === null });
      }
    };
    window.addEventListener("storage", onStorage);

    // BroadcastChannel fast-path
    try {
      const ch = new BroadcastChannel(CHANNEL_NAME);
      ch.onmessage = (message) => {
        const event = message.data?.event;
        void safeHydrateSession({ applyNull: event === "SIGNED_OUT" });
      };
      channelRef.current = ch;
    } catch { /* noop */ }

    // Refresh when mobile browser tabs/webviews resume from background or bfcache.
    const onVisibility = () => {
      if (document.visibilityState === "visible") void safeHydrateSession({ applyNull: true });
    };
    const onFocus = () => void safeHydrateSession({ applyNull: true });
    const onPageShow = () => void safeHydrateSession({ applyNull: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("online", onFocus);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("online", onFocus);
      try { channelRef.current?.close(); } catch { /* noop */ }
      channelRef.current = null;
    };
  }, [applySession]);

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = normalizeEmailForAuth(email);

    const { data: current } = await supabase.auth.getSession();
    if (current.session?.user?.email?.toLowerCase() === normalizedEmail) {
      return { error: null };
    }

    let lastError: string | null = null;
    for (const passwordAttempt of getPasswordAttempts(password)) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: passwordAttempt,
      });
      if (!error) {
        if (data.session) {
          applySession(data.session);
          const readableSession = await hydrateSession({ applyNull: false, expectedUserId: data.session.user.id });
          if (!readableSession && data.session.access_token && data.session.refresh_token) {
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });
            await hydrateSession({ applyNull: false, expectedUserId: data.session.user.id });
          }
          await fetchRole(data.session.user.id);
        } else {
          await hydrateSession({ applyNull: false });
        }
        return { error: null };
      }
      lastError = error.message;
      if (!error.message.includes("Invalid login credentials")) {
        return { error: error.message };
      }
    }

    if (lastError) {
      if (lastError.includes("Invalid login credentials")) {
        return { error: "ईमेल या पासवर्ड मेल नहीं खा रहा है। कृपया पासवर्ड दिखाकर जांचें या पासवर्ड रीसेट करें।" };
      }
      return { error: lastError };
    }
    return { error: "कृपया पासवर्ड दर्ज करें।" };
  };

  const signInWithGoogle = async () => {
    try { sessionStorage.setItem(POST_AUTH_PATH_KEY, "/dashboard"); } catch { /* noop */ }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
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
      password: stripInvisiblePasswordChars(password),
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
