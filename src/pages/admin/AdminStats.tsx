import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminStats = () => {
  const [topArticles, setTopArticles] = useState<{ title: string; views: number; status: string }[]>([]);

  useEffect(() => {
    supabase
      .from("articles")
      .select("title, views, status")
      .order("views", { ascending: false })
      .limit(10)
      .then(({ data }) => setTopArticles(data ?? []));
  }, []);

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold">प्लेटफ़ॉर्म आंकड़े</h1>
        <Card>
          <CardHeader><CardTitle>सबसे ज़्यादा पढ़े गए लेख</CardTitle></CardHeader>
          <CardContent>
            {topArticles.length === 0 ? (
              <p className="text-muted-foreground">कोई डेटा नहीं</p>
            ) : (
              <ol className="space-y-2">
                {topArticles.map((a, i) => (
                  <li key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <span className="text-sm">
                      <span className="font-bold mr-2">{i + 1}.</span>
                      {a.title}
                    </span>
                    <span className="text-sm font-mono text-muted-foreground">{a.views} व्यू</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminStats;
