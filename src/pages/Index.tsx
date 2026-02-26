import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ArticleCardPublic, { ArticleCardSkeleton } from "@/components/ArticleCardPublic";
import Pagination from "@/components/Pagination";
import NGOSection from "@/components/NGOSection";
import { TrendingUp, ArrowRight } from "lucide-react";

const PER_PAGE = 10;

const Index = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    supabase.from("categories").select("id, name").order("name").then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      const from = (page - 1) * PER_PAGE;
      const { data, count } = await supabase
        .from("articles")
        .select("*, profiles:author_id(full_name), categories:category_id(name)", { count: "exact" })
        .eq("status", "approved")
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
  }, [page]);

  useEffect(() => {
    supabase
      .from("articles")
      .select("id, title, views, created_at, slug")
      .eq("status", "approved")
      .order("views", { ascending: false })
      .limit(5)
      .then(({ data }) => setTrending(data ?? []));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead />
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-12 md:py-16">
          <div className="container">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold leading-tight mb-4">
              जनसेवा संदेश: सच्चाई की आवाज़
            </h1>
            <p className="text-primary-foreground/90 text-lg md:text-xl mb-6 max-w-2xl">
              श्री नन्देश्वर शिक्षा एवं जनसेवा संस्थान के साथ मिलकर, स्थानीय से वैश्विक स्तर तक निष्पक्ष पत्रकारिता।
            </p>
          </div>
        </section>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="container -mt-5 relative z-10">
            <div className="flex flex-wrap justify-center gap-2 bg-card rounded-xl shadow-lg p-4 max-w-3xl mx-auto">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/category/${cat.id}`} className="px-4 py-2 bg-muted hover:bg-accent hover:text-accent-foreground rounded-full text-sm font-medium transition-all font-hindi">
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="container py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="section-title font-hindi">ताज़ा समाचार</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)
                  : articles.map((a, i) => (
                    <ArticleCardPublic key={a.id} {...a} author_id={a.author_id} isLarge={i === 0} />
                  ))}
              </div>
              {!loading && articles.length === 0 && (
                <p className="text-center text-muted-foreground py-12">अभी कोई प्रकाशित समाचार नहीं है</p>
              )}
              <Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} onPageChange={setPage} />
            </div>

            {/* Trending Sidebar */}
            <aside className="bg-card rounded-xl shadow-lg p-6 sticky top-32 h-fit">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-accent" />
                <h3 className="font-heading font-bold text-lg text-card-foreground">ट्रेंडिंग</h3>
              </div>
              <div className="space-y-4">
                {trending.map((item, i) => (
                  <Link key={item.id} to={`/article/${item.slug || item.id}`} className="flex gap-4 group">
                    <span className="text-3xl font-heading font-bold text-accent/30 group-hover:text-accent transition-colors">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-medium text-card-foreground group-hover:text-accent transition-colors line-clamp-2 text-sm">
                        {item.title}
                      </h4>
                      <span className="text-xs text-muted-foreground">{item.views} व्यू</span>
                    </div>
                  </Link>
                ))}
                {trending.length === 0 && <p className="text-sm text-muted-foreground">कोई ट्रेंडिंग नहीं</p>}
              </div>
            </aside>
          </div>
        </div>

        <NGOSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
