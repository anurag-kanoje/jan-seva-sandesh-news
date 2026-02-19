import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, FolderOpen, Eye, Clock, CheckCircle } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ articles: 0, pending: 0, approved: 0, writers: 0, categories: 0, totalViews: 0 });

  useEffect(() => {
    const fetch = async () => {
      const [articles, roles, cats] = await Promise.all([
        supabase.from("articles").select("status, views"),
        supabase.from("user_roles").select("id").eq("role", "writer"),
        supabase.from("categories").select("id"),
      ]);
      const data = articles.data ?? [];
      setStats({
        articles: data.length,
        pending: data.filter((a) => a.status === "pending").length,
        approved: data.filter((a) => a.status === "approved").length,
        writers: roles.data?.length ?? 0,
        categories: cats.data?.length ?? 0,
        totalViews: data.reduce((s, a: any) => s + a.views, 0),
      });
    };
    fetch();
  }, []);

  const cards = [
    { label: "कुल लेख", value: stats.articles, icon: FileText },
    { label: "लंबित अनुमोदन", value: stats.pending, icon: Clock },
    { label: "प्रकाशित", value: stats.approved, icon: CheckCircle },
    { label: "लेखक", value: stats.writers, icon: Users },
    { label: "श्रेणियां", value: stats.categories, icon: FolderOpen },
    { label: "कुल व्यू", value: stats.totalViews, icon: Eye },
  ];

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold">एडमिन डैशबोर्ड</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((c) => (
            <Card key={c.label}>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{c.label}</CardTitle></CardHeader>
              <CardContent className="flex items-center gap-2">
                <c.icon className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{c.value}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
