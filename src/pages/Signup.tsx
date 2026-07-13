import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import PasswordField from "@/components/PasswordField";
import { Separator } from "@/components/ui/separator";
import { Chrome } from "lucide-react";
import logo from "@/assets/logo.jpg";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signIn, signInWithGoogle, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "").trim().toLowerCase();
    if (!fullName.trim()) {
      toast({ title: "कृपया अपना नाम दर्ज करें", variant: "destructive" });
      return;
    }
    if (!cleanEmail) {
      toast({ title: "कृपया सही ईमेल दर्ज करें", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "पासवर्ड कम से कम 6 अक्षर का होना चाहिए", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signUp(cleanEmail, password, fullName.trim());
      if (error) {
        toast({ title: "साइन अप विफल", description: error, variant: "destructive" });
        return;
      }
      // Auto-confirm enabled — try immediate login
      const { error: signInErr } = await signIn(cleanEmail, password);
      if (signInErr) {
        toast({ title: "खाता बन गया!", description: "अब लॉगिन करें।" });
        navigate("/login", { replace: true });
      } else {
        toast({ title: "स्वागत है!", description: "आप सफलतापूर्वक लॉगिन हो गए हैं।" });
        navigate("/dashboard", { replace: true });
      }
    } catch {
      toast({ title: "नेटवर्क त्रुटि", description: "कृपया इंटरनेट कनेक्शन जांचें", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    setIsLoading(false);
    if (error) toast({ title: "Google साइन अप विफल", description: error, variant: "destructive" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logo} alt="JSS" className="h-16 mx-auto mb-4" loading="lazy" />
          <CardTitle className="text-2xl font-heading">साइन अप करें</CardTitle>
          <CardDescription>जन सेवा संदेश पर नया खाता बनाएं</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">पूरा नाम</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">ईमेल</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">पासवर्ड</Label>
              <PasswordField
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                allowGenerate
                onGenerate={setPassword}
              />
              <p className="text-xs text-muted-foreground">कम से कम 6 अक्षर का पासवर्ड चुनें।</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "खाता बना रहे हैं..." : "साइन अप"}
            </Button>
            <div className="flex items-center gap-3 w-full text-xs text-muted-foreground">
              <Separator className="flex-1" /> या <Separator className="flex-1" />
            </div>
            <Button type="button" variant="outline" className="w-full" disabled={isLoading} onClick={handleGoogleLogin}>
              <Chrome className="w-4 h-4" /> Google से जारी रखें
            </Button>
            <p className="text-sm text-muted-foreground">
              पहले से खाता है?{" "}
              <Link to="/login" className="text-accent hover:underline">लॉगिन करें</Link>
            </p>
            <Link to="/" className="text-sm text-muted-foreground hover:text-accent">← होम पेज पर वापस जाएं</Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Signup;
