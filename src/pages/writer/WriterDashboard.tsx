import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, XCircle, Eye, PenLine } from "lucide-react";

const WriterDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, views: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { data } = await supabase
        .from("articles")
        .select("status, views_count")
        .eq("user_id", user.id);
      if (data) {
        setStats({
          total: data.length,
          pending: data.filter((a) => a.status === "pending").length,
          approved: data.filter((a) => a.status === "approved").length,
          rejected: data.filter((a) => a.status === "rejected").length,
          views: data.reduce((sum, a) => sum + a.views_count, 0),
        });
      }
    };
    fetchStats();
  }, [user]);

  const statCards = [
    { label: "कुल लेख", value: stats.total, icon: FileText, color: "text-primary" },
    { label: "लंबित", value: stats.pending, icon: Clock, color: "text-yellow-600" },
    { label: "स्वीकृत", value: stats.approved, icon: CheckCircle, color: "text-green-600" },
    { label: "अस्वीकृत", value: stats.rejected, icon: XCircle, color: "text-destructive" },
    { label: "कुल व्यू", value: stats.views, icon: Eye, color: "text-accent" },
  ];

  return (
    <DashboardLayout type="writer">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold">लेखक डैशबोर्ड</h1>
          <Link to="/writer/new">
            <Button><PenLine className="w-4 h-4 mr-2" /> नया लेख लिखें</Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <span className="text-2xl font-bold">{s.value}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WriterDashboard;
