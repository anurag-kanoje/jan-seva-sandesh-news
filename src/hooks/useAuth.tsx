import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);

  const resetAuthState = async () => {
    await supabase.auth.signOut({ scope: "local" });
    setUser(null);
    setRole(null);
    setRoleLoading(false);
    setLoading(false);
  };

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
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          // Use setTimeout to avoid potential deadlock with Supabase internals
          setTimeout(() => fetchRole(currentUser.id), 0);
        } else {
          setRole(null);
          setRoleLoading(false);
        }
        setLoading(false);
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        await resetAuthState();
        return;
      }
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchRole(currentUser.id).then(() => setLoading(false));
      } else {
        setRoleLoading(false);
        setLoading(false);
      }
    }).catch(resetAuthState);

    // Cross-tab session sync — listen for storage changes (signin/signout in other tabs)
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.includes("supabase.auth.token") || e.key.includes("-auth-token")) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          const u = session?.user ?? null;
          setUser(u);
          if (u) fetchRole(u.id);
          else {
            setRole(null);
            setRoleLoading(false);
          }
        });
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { error: "ईमेल या पासवर्ड गलत है।" };
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
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
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      return { error: "वेरिफिकेशन ईमेल दोबारा भेजने में दिक्कत आई। कृपया थोड़ी देर बाद फिर कोशिश करें।" };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await resetAuthState();
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
