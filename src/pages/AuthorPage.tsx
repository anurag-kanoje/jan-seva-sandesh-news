import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ArticleCardPublic, { ArticleCardSkeleton } from "@/components/ArticleCardPublic";
import Pagination from "@/components/Pagination";
import { User } from "lucide-react";

const PER_PAGE = 10;

const AuthorPage = () => {
  const { id } = useParams<{ id: string }>();
  const [authorName, setAuthorName] = useState("");
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!id) return;
    supabase.from("profiles").select("full_name").eq("user_id", id).single().then(({ data }) => setAuthorName(data?.full_name ?? ""));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchArticles = async () => {
      setLoading(true);
      const from = (page - 1) * PER_PAGE;
      const { data, count } = await supabase
        .from("articles")
        .select("*, profiles:user_id(full_name), categories:category_id(name)", { count: "exact" })
        .eq("status", "approved")
        .eq("user_id", id)
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
    fetchArticles();
  }, [id, page]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${authorName || "लेखक"} - जन सेवा संदेश`} />
      <Header />
      <main className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold">{authorName || "लेखक"}</h1>
            <p className="text-sm text-muted-foreground">{total} प्रकाशित लेख</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)
            : articles.map((a) => <ArticleCardPublic key={a.id} {...a} author_id={a.user_id} />)}
        </div>
        {!loading && articles.length === 0 && (
          <p className="text-center text-muted-foreground py-12">इस लेखक के कोई प्रकाशित लेख नहीं</p>
        )}
        <Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} onPageChange={setPage} />
      </main>
      <Footer />
    </div>
  );
};

export default AuthorPage;
