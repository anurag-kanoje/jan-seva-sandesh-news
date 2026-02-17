import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Trash2, ExternalLink } from "lucide-react";

interface Article {
  id: string;
  title: string;
  status: string;
  views_count: number;
  created_at: string;
  user_id: string;
  profiles?: { full_name: string } | null;
  categories?: { name: string } | null;
}

const AdminArticles = () => {
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => {
    setLoading(true);
    let query = supabase
      .from("articles")
      .select("id, title, status, views_count, created_at, user_id, profiles:user_id(full_name), categories:category_id(name)")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setArticles((data as unknown as Article[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("articles").update({ status }).eq("id", id);
    if (error) toast({ title: "त्रुटि", description: error.message, variant: "destructive" });
    else { toast({ title: status === "approved" ? "लेख स्वीकृत" : "लेख अस्वीकृत" }); fetchArticles(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) toast({ title: "त्रुटि", description: error.message, variant: "destructive" });
    else { toast({ title: "लेख हटाया" }); fetchArticles(); }
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-green-600">स्वीकृत</Badge>;
    if (status === "rejected") return <Badge variant="destructive">अस्वीकृत</Badge>;
    return <Badge className="bg-yellow-600">लंबित</Badge>;
  };

  return (
    <DashboardLayout type="admin">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-heading font-bold">लेख प्रबंधन</h1>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="फ़िल्टर" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">सभी</SelectItem>
              <SelectItem value="pending">लंबित</SelectItem>
              <SelectItem value="approved">स्वीकृत</SelectItem>
              <SelectItem value="rejected">अस्वीकृत</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="bg-card rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>शीर्षक</TableHead>
                <TableHead>लेखक</TableHead>
                <TableHead>श्रेणी</TableHead>
                <TableHead>स्थिति</TableHead>
                <TableHead>व्यू</TableHead>
                <TableHead>दिनांक</TableHead>
                <TableHead>कार्रवाई</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">लोड हो रहा है...</TableCell></TableRow>
              ) : articles.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">कोई लेख नहीं</TableCell></TableRow>
              ) : (
                articles.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium max-w-[180px] truncate">{a.title}</TableCell>
                    <TableCell className="text-sm">{(a.profiles as any)?.full_name || "—"}</TableCell>
                    <TableCell className="text-sm">{(a.categories as any)?.name || "—"}</TableCell>
                    <TableCell>{statusBadge(a.status)}</TableCell>
                    <TableCell>{a.views_count}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(a.created_at).toLocaleDateString("hi-IN")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link to={`/article/${a.id}`} target="_blank">
                          <Button variant="ghost" size="icon" title="देखें"><ExternalLink className="w-4 h-4" /></Button>
                        </Link>
                        {a.status !== "approved" && (
                          <Button variant="ghost" size="icon" onClick={() => updateStatus(a.id, "approved")} title="स्वीकृत">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        {a.status !== "rejected" && (
                          <Button variant="ghost" size="icon" onClick={() => updateStatus(a.id, "rejected")} title="अस्वीकृत">
                            <XCircle className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminArticles;
