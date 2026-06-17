import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import PasswordField from "@/components/PasswordField";
import logo from "@/assets/logo.jpg";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const markReady = () => {
      if (!mounted) return;
      setReady(true);
    };

    const markFailed = (message = "रीसेट लिंक अमान्य या एक्सपायर हो गया है। कृपया नया लिंक भेजें।") => {
      if (!mounted) return;
      setReady(false);
      toast({ title: "लिंक सत्यापित नहीं हुआ", description: message, variant: "destructive" });
    };

    const readUrlParams = () => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const searchParams = new URLSearchParams(window.location.search);
      return { hashParams, searchParams };
    };

    const waitForRecoveredSession = async () => {
      const deadline = Date.now() + 8000;
      while (mounted && Date.now() < deadline) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          markReady();
          return true;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }
      return false;
    };

    const establishRecoverySession = async () => {
      const { hashParams, searchParams } = readUrlParams();
      const tokenHash = searchParams.get("token_hash") || hashParams.get("token_hash");
      const type = searchParams.get("type") || hashParams.get("type");
      const code = searchParams.get("code") || hashParams.get("code");
      const accessToken = hashParams.get("access_token") || searchParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") || searchParams.get("refresh_token");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) markFailed(error.message);
        else if (!(await waitForRecoveredSession())) markFailed("रीसेट सेशन तैयार नहीं हुआ। कृपया ईमेल से लिंक दोबारा खोलें।");
        return;
      }

      if (tokenHash && type === "recovery") {
        const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        if (error) markFailed(error.message);
        else if (data.session) {
          await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
          markReady();
        } else if (!(await waitForRecoveredSession())) markFailed("रीसेट सेशन तैयार नहीं हुआ। कृपया ईमेल से लिंक दोबारा खोलें।");
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) markFailed(error.message);
        else markReady();
        return;
      }

      if (!(await waitForRecoveredSession())) {
        markFailed("इस पेज पर मान्य रीसेट सेशन नहीं मिला। कृपया ईमेल से नया लिंक खोलें।");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });

    establishRecoverySession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "पासवर्ड कम से कम 8 अक्षर का होना चाहिए", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "दोनों पासवर्ड मेल नहीं खाते", variant: "destructive" });
      return;
    }
    setLoading(true);
    const cleanPassword = password.replace(/[\u200B-\u200D\uFEFF]/g, "");
    const timeoutPromise = new Promise<"timeout">((resolve) => window.setTimeout(() => resolve("timeout"), 12000));
    const updateResult = await Promise.race([supabase.auth.updateUser({ password: cleanPassword }), timeoutPromise]);

    let error = updateResult === "timeout" ? new Error("पासवर्ड बदलने में समय लग रहा है।") : updateResult.error;
    if (error) {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (accessToken) {
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/user`, {
            method: "PUT",
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ password: cleanPassword }),
          });
          error = response.ok ? null : new Error((await response.json().catch(() => null))?.msg || "पासवर्ड अपडेट नहीं हो पाया।");
        } catch (fallbackError) {
          error = fallbackError instanceof Error ? fallbackError : new Error("पासवर्ड अपडेट नहीं हो पाया।");
        }
      }
    }
    setLoading(false);
    if (error) {
      toast({ title: "त्रुटि", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "पासवर्ड बदल दिया गया", description: "अब लॉगिन करें।" });
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logo} alt="JSS" className="h-16 mx-auto mb-4" loading="lazy" />
          <CardTitle className="text-2xl font-heading">नया पासवर्ड सेट करें</CardTitle>
          <CardDescription>
            {ready ? "नीचे अपना नया पासवर्ड दर्ज करें" : "लिंक सत्यापित कर रहे हैं..."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">नया पासवर्ड</Label>
              <PasswordField id="password" value={password} onChange={(e) => setPassword(e.target.value)} required allowGenerate onGenerate={(p) => { setPassword(p); setConfirm(p); }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">पासवर्ड दोबारा दर्ज करें</Label>
              <PasswordField id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading || !ready}>
              {loading ? "अपडेट हो रहा है..." : "पासवर्ड बदलें"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
