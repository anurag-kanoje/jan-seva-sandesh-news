import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Trash2, ExternalLink, Search } from "lucide-react";

interface Article {
  id: string;
  title: string;
  status: string;
  views: number;
  created_at: string;
  author_id: string;
  slug?: string;
  profiles?: { full_name: string } | null;
  categories?: { name: string } | null;
}

const PER_PAGE = 10;

const AdminArticles = () => {
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [filter, setFilter] = useState("pending");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.from("categories").select("id, name").order("name").then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [filter, categoryFilter, debounced]);

  const fetchArticles = async () => {
    setLoading(true);
    const from = (page - 1) * PER_PAGE;
    let query = supabase
      .from("articles")
      .select("id, title, status, views, created_at, author_id, slug, profiles:author_id(full_name), categories:category_id(name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + PER_PAGE - 1);

    if (filter !== "all") query = query.eq("status", filter);
    if (categoryFilter !== "all") query = query.eq("category_id", categoryFilter);
    if (debounced) query = query.ilike("title", `%${debounced}%`);

    const { data, count } = await query;
    setArticles((data as unknown as Article[]) ?? []);
    setTotal(count ?? 0);
    setSelected(new Set());
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); /* eslint-disable-next-line */ }, [filter, categoryFilter, debounced, page]);

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

  const bulkAction = async (action: "approved" | "rejected" | "delete") => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const { error } =
      action === "delete"
        ? await supabase.from("articles").delete().in("id", ids)
        : await supabase.from("articles").update({ status: action }).in("id", ids);
    if (error) toast({ title: "त्रुटि", description: error.message, variant: "destructive" });
    else {
      toast({ title: `${ids.length} लेख ${action === "delete" ? "हटाए गए" : action === "approved" ? "स्वीकृत" : "अस्वीकृत"}` });
      fetchArticles();
    }
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(articles.map((a) => a.id)) : new Set());
  };
  const toggleOne = (id: string, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(id) : next.delete(id);
    setSelected(next);
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PER_PAGE)), [total]);

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-green-600">स्वीकृत</Badge>;
    if (status === "rejected") return <Badge variant="destructive">अस्वीकृत</Badge>;
    return <Badge className="bg-yellow-600">लंबित</Badge>;
  };

  return (
    <DashboardLayout type="admin">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-heading font-bold">मॉडरेशन क्यू</h1>
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="शीर्षक खोजें"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-56"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="श्रेणी" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">सभी श्रेणियाँ</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="स्थिति" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">सभी</SelectItem>
                <SelectItem value="pending">लंबित</SelectItem>
                <SelectItem value="approved">स्वीकृत</SelectItem>
                <SelectItem value="rejected">अस्वीकृत</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex gap-2 items-center bg-muted/40 p-2 rounded">
            <span className="text-sm">{selected.size} चयनित</span>
            <Button size="sm" variant="outline" onClick={() => bulkAction("approved")}>सभी स्वीकृत</Button>
            <Button size="sm" variant="outline" onClick={() => bulkAction("rejected")}>सभी अस्वीकृत</Button>
            <Button size="sm" variant="destructive" onClick={() => bulkAction("delete")}>हटाएँ</Button>
          </div>
        )}

        <div className="bg-card rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={articles.length > 0 && selected.size === articles.length}
                    onCheckedChange={(c) => toggleAll(Boolean(c))}
                  />
                </TableHead>
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
                <TableRow><TableCell colSpan={8} className="text-center py-8">लोड हो रहा है...</TableCell></TableRow>
              ) : articles.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">कोई लेख नहीं</TableCell></TableRow>
              ) : (
                articles.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Checkbox checked={selected.has(a.id)} onCheckedChange={(c) => toggleOne(a.id, Boolean(c))} />
                    </TableCell>
                    <TableCell className="font-medium max-w-[220px] truncate">{a.title}</TableCell>
                    <TableCell className="text-sm">
                      {a.author_id ? (
                        <Link to={`/author/${a.author_id}`} className="hover:text-accent">
                          {(a.profiles as any)?.full_name || "—"}
                        </Link>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{(a.categories as any)?.name || "—"}</TableCell>
                    <TableCell>{statusBadge(a.status)}</TableCell>
                    <TableCell>{a.views}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(a.created_at).toLocaleDateString("hi-IN")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link to={`/${a.slug || a.id}`} target="_blank">
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

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">कुल {total}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>पिछला</Button>
            <span className="text-sm self-center">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>अगला</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminArticles;
