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
      if (mounted) setReady(true);
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

    const establishRecoverySession = async () => {
      const { hashParams, searchParams } = readUrlParams();
      const tokenHash = searchParams.get("token_hash") || hashParams.get("token_hash");
      const type = searchParams.get("type") || hashParams.get("type");
      const accessToken = hashParams.get("access_token") || searchParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") || searchParams.get("refresh_token");

      if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        if (error) markFailed(error.message);
        else markReady();
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) markFailed(error.message);
        else markReady();
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) markFailed(error.message);
      else if (data.session) markReady();
      else markFailed("इस पेज पर मान्य रीसेट सेशन नहीं मिला। कृपया ईमेल से नया लिंक खोलें।");
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
    const updatePromise = supabase.auth.updateUser({ password: cleanPassword });
    const timeoutPromise = new Promise<{ error: Error }>((resolve) =>
      window.setTimeout(() => resolve({ error: new Error("पासवर्ड बदलने में समय लग रहा है। कृपया लिंक दोबारा खोलकर फिर कोशिश करें।") }), 15000),
    );
    const { error } = await Promise.race([updatePromise, timeoutPromise]);
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
