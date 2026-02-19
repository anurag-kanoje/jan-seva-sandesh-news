import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Eye, CheckCircle, Clock } from "lucide-react";

const ProfilePage = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, views: 0 });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("user_id", user.id).single().then(({ data }) => {
      if (data) setFullName(data.full_name);
    });

    supabase.from("articles").select("status, views").eq("author_id", user.id).then(({ data }) => {
      if (data) {
        setStats({
          total: data.length,
          approved: data.filter((a) => a.status === "approved").length,
          pending: data.filter((a) => a.status === "pending").length,
          views: data.reduce((s, a: any) => s + a.views, 0),
        });
      }
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast({ title: "त्रुटि", description: error.message, variant: "destructive" });
    else toast({ title: "प्रोफ़ाइल अपडेट हुई" });
  };

  const dashboardType = role === "admin" ? "admin" : "writer";

  return (
    <DashboardLayout type={dashboardType as "admin" | "writer"}>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-heading font-bold">मेरी प्रोफ़ाइल</h1>

        <Card>
          <CardHeader><CardTitle>प्रोफ़ाइल जानकारी</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>ईमेल</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>पूरा नाम</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "सहेज रहे हैं..." : "अपडेट करें"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "कुल लेख", value: stats.total, icon: FileText },
            { label: "स्वीकृत", value: stats.approved, icon: CheckCircle },
            { label: "लंबित", value: stats.pending, icon: Clock },
            { label: "कुल व्यू", value: stats.views, icon: Eye },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 flex flex-col items-center gap-1">
                <s.icon className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{s.value}</span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
