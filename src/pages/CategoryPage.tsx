import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleCardPublic, { ArticleCardSkeleton } from "@/components/ArticleCardPublic";
import Pagination from "@/components/Pagination";
import { Badge } from "@/components/ui/badge";

const PER_PAGE = 10;
const SITE_URL = "https://jss-news-foundation.lovable.app";

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const [articles, setArticles] = useState<any[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    supabase.from("categories").select("id, name").order("name").then(({ data }) => setAllCategories(data ?? []));
  }, []);

  useEffect(() => {
    if (!id) return;
    setPage(1);
    supabase.from("categories").select("name").eq("id", id).single().then(({ data }) => setCategoryName(data?.name ?? ""));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchArticles = async () => {
      setLoading(true);
      const from = (page - 1) * PER_PAGE;
      const { data, count } = await supabase
        .from("articles")
        .select("*, profiles:author_id(full_name), categories:category_id(name)", { count: "exact" })
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

  const canonical = `${SITE_URL}/category/${id}`;
  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${categoryName} - जन सेवा संदेश`,
      url: canonical,
      hasPart: articles.map((a) => ({
        "@type": "NewsArticle",
        headline: a.title,
        url: `${SITE_URL}/article/${a.slug || a.id}`,
      })),
    }),
    [articles, categoryName, canonical]
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${categoryName || "श्रेणी"} समाचार - जन सेवा संदेश`}
        description={`${categoryName} श्रेणी के नवीनतम समाचार और लेख। निष्पक्ष और विश्वसनीय रिपोर्टिंग।`}
        canonical={canonical}
        jsonLd={jsonLd}
      />
      <Header />
      <main className="container py-8">
        <Breadcrumbs items={[{ label: "होम", to: "/" }, { label: "श्रेणी" }, { label: categoryName || "..." }]} />
        <h1 className="section-title font-hindi">{categoryName || "श्रेणी"}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)
            : articles.map((a) => <ArticleCardPublic key={a.id} {...a} author_id={a.author_id} />)}
        </div>
        {!loading && articles.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            इस श्रेणी में कोई लेख नहीं। <Link to="/" className="text-accent hover:underline">होम पेज पर जाएं</Link>
          </p>
        )}
        <Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} onPageChange={setPage} />

        {allCategories.length > 1 && (
          <div className="mt-12 border-t border-border pt-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">अन्य श्रेणियाँ</h2>
            <div className="flex flex-wrap gap-2">
              {allCategories.filter((c) => c.id !== id).map((c) => (
                <Link key={c.id} to={`/category/${c.id}`}>
                  <Badge variant="outline" className="hover:bg-accent hover:text-accent-foreground">{c.name}</Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CategoryPage;
