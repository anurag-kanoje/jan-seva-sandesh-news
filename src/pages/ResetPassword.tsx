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
    // detectSessionInUrl handles the recovery token automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

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
    const { error } = await supabase.auth.updateUser({ password });
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
