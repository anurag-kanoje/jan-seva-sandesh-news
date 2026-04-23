import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import PasswordField from "@/components/PasswordField";
import logo from "@/assets/logo.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({ title: "कृपया ईमेल और पासवर्ड दर्ज करें", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        toast({ title: "लॉगिन विफल", description: error, variant: "destructive" });
      } else {
        toast({ title: "सफलतापूर्वक लॉगिन हुआ" });
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      toast({ title: "नेटवर्क त्रुटि", description: "कृपया इंटरनेट कनेक्शन जांचें", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logo} alt="JSS" className="h-16 mx-auto mb-4" loading="lazy" />
          <CardTitle className="text-2xl font-heading">लॉगिन करें</CardTitle>
          <CardDescription>जन सेवा संदेश डैशबोर्ड में प्रवेश करें</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ईमेल</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">पासवर्ड</Label>
              <PasswordField id="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "लॉगिन हो रहा है..." : "लॉगिन"}
            </Button>
            <p className="text-sm text-muted-foreground">
              खाता नहीं है?{" "}
              <Link to="/signup" className="text-accent hover:underline">साइन अप करें</Link>
            </p>
            <Link to="/" className="text-sm text-muted-foreground hover:text-accent">← होम पेज पर वापस जाएं</Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
