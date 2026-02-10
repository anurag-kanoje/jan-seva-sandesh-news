import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.jpg";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "पासवर्ड कम से कम 6 अक्षर का होना चाहिए", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const { error } = await signUp(email, password, fullName);
    setIsLoading(false);
    if (error) {
      toast({ title: "साइन अप विफल", description: error, variant: "destructive" });
    } else {
      toast({ title: "सफल!", description: "कृपया अपना ईमेल सत्यापित करें।" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logo} alt="JSS" className="h-16 mx-auto mb-4" />
          <CardTitle className="text-2xl font-heading">साइन अप करें</CardTitle>
          <CardDescription>जन सेवा संदेश पर नया खाता बनाएं</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">पूरा नाम</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">ईमेल</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">पासवर्ड</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "खाता बना रहे हैं..." : "साइन अप"}
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
