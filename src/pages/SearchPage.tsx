import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ArticleCardPublic, { ArticleCardSkeleton } from "@/components/ArticleCardPublic";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const PER_PAGE = 10;

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [query, setQuery] = useState(q);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setQuery(q);
    setPage(1);
  }, [q]);

  useEffect(() => {
    if (!q.trim()) { setArticles([]); setTotal(0); return; }
    const fetchResults = async () => {
      setLoading(true);
      const from = (page - 1) * PER_PAGE;
      const searchTerm = `%${q.trim()}%`;
      const { data, count } = await supabase
        .from("articles")
        .select("*, profiles:user_id(full_name), categories:category_id(name)", { count: "exact" })
        .eq("status", "approved")
        .or(`title.ilike.${searchTerm},excerpt.ilike.${searchTerm},content.ilike.${searchTerm}`)
        .order("created_at", { ascending: false })
        .range(from, from + PER_PAGE - 1);

      setArticles(
        (data ?? []).map((a: any) => ({
          ...a,
          category_name: a.categories?.name ?? null,
          author_name: a.profiles?.full_name ?? null,
        }))
      );
      setTotal(count ?? 0);
      setLoading(false);
    };
    fetchResults();
  }, [q, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={q ? `"${q}" - खोज परिणाम` : "खोजें - जन सेवा संदेश"} />
      <Header />
      <main className="container py-8">
        <h1 className="section-title font-hindi">समाचार खोजें</h1>
        <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-xl">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="समाचार खोजें..." className="flex-1" />
          <Button type="submit"><Search className="w-4 h-4 mr-1" /> खोजें</Button>
        </form>
        {q && <p className="text-sm text-muted-foreground mb-4">"{q}" के लिए {total} परिणाम</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)
            : articles.map((a) => <ArticleCardPublic key={a.id} {...a} author_id={a.user_id} />)}
        </div>
        {!loading && q && articles.length === 0 && (
          <p className="text-center text-muted-foreground py-12">कोई परिणाम नहीं मिला</p>
        )}
        <Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} onPageChange={setPage} />
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
