import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, PenLine, Eye } from "lucide-react";

interface Article {
  id: string;
  title: string;
  status: string;
  views: number;
  created_at: string;
  category_id: string | null;
}

const statusBadge = (status: string) => {
  if (status === "approved") return <Badge className="bg-green-600">स्वीकृत</Badge>;
  if (status === "rejected") return <Badge variant="destructive">अस्वीकृत</Badge>;
  return <Badge className="bg-yellow-600">लंबित</Badge>;
};

const WriterArticles = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);

  const fetchArticles = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("articles")
      .select("id, title, status, views, created_at, category_id")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });
    setArticles(data ?? []);
  };

  useEffect(() => { fetchArticles(); }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) {
      toast({ title: "हटाने में त्रुटि", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "लेख हटा दिया गया" });
      fetchArticles();
    }
  };

  return (
    <DashboardLayout type="writer">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold">मेरे लेख</h1>
          <Link to="/writer/new"><Button><PenLine className="w-4 h-4 mr-2" /> नया लेख</Button></Link>
        </div>
        <div className="bg-card rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>शीर्षक</TableHead>
                <TableHead>स्थिति</TableHead>
                <TableHead>व्यू</TableHead>
                <TableHead>दिनांक</TableHead>
                <TableHead>कार्रवाई</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">कोई लेख नहीं</TableCell></TableRow>
              )}
              {articles.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{a.title}</TableCell>
                  <TableCell>{statusBadge(a.status)}</TableCell>
                  <TableCell><Eye className="w-3 h-3 inline mr-1" />{a.views}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(a.created_at).toLocaleDateString("hi-IN")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link to={`/writer/edit/${a.id}`}>
                        <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WriterArticles;
