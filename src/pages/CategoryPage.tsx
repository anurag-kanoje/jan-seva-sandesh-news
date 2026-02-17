import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ArticleCardPublic, { ArticleCardSkeleton } from "@/components/ArticleCardPublic";
import Pagination from "@/components/Pagination";

const PER_PAGE = 10;

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const [articles, setArticles] = useState<any[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!id) return;
    supabase.from("categories").select("name").eq("id", id).single().then(({ data }) => setCategoryName(data?.name ?? ""));
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
        .eq("category_id", id)
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
      <SEOHead title={`${categoryName || "श्रेणी"} - जन सेवा संदेश`} description={`${categoryName} श्रेणी के सभी समाचार`} />
      <Header />
      <main className="container py-8">
        <h1 className="section-title font-hindi">{categoryName || "श्रेणी"}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)
            : articles.map((a) => <ArticleCardPublic key={a.id} {...a} author_id={a.user_id} />)}
        </div>
        {!loading && articles.length === 0 && (
          <p className="text-center text-muted-foreground py-12">इस श्रेणी में कोई लेख नहीं</p>
        )}
        <Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} onPageChange={setPage} />
      </main>
      <Footer />
    </div>
  );
};

export default CategoryPage;
