import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleCardPublic, { ArticleCardSkeleton } from "@/components/ArticleCardPublic";
import Pagination from "@/components/Pagination";
import { User } from "lucide-react";

const PER_PAGE = 10;
const SITE_URL = "https://jss-news-foundation.lovable.app";

interface Profile {
  full_name: string;
  bio?: string | null;
  avatar_url?: string | null;
}

const AuthorPage = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!id) return;
    setPage(1);
    supabase
      .from("profiles")
      .select("full_name, bio, avatar_url")
      .eq("user_id", id)
      .single()
      .then(({ data }) => setProfile((data as any) ?? null));
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
        .eq("author_id", id)
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

  const name = profile?.full_name || "लेखक";
  const canonical = `${SITE_URL}/author/${id}`;
  const description = profile?.bio?.trim() || `${name} द्वारा लिखे गए सभी प्रकाशित लेख। जन सेवा संदेश पर पढ़ें।`;

  const jsonLd = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "Person",
        name,
        url: canonical,
        image: profile?.avatar_url || undefined,
        description: profile?.bio || undefined,
      },
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${name} - लेख`,
        url: canonical,
        hasPart: articles.map((a) => ({
          "@type": "NewsArticle",
          headline: a.title,
          url: `${SITE_URL}/article/${a.slug || a.id}`,
        })),
      },
    ],
    [name, canonical, profile, articles]
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${name} - लेखक - जन सेवा संदेश`}
        description={description.slice(0, 160)}
        canonical={canonical}
        image={profile?.avatar_url || undefined}
        jsonLd={jsonLd}
      />
      <Header />
      <main className="container py-8">
        <Breadcrumbs items={[{ label: "होम", to: "/" }, { label: "लेखक" }, { label: name }]} />
        <div className="flex items-start gap-4 mb-8 bg-card p-6 rounded-lg border border-border">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold">{name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{total} प्रकाशित लेख</p>
            {profile?.bio && (
              <p className="text-sm mt-3 text-foreground/90 whitespace-pre-line">{profile.bio}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)
            : articles.map((a) => <ArticleCardPublic key={a.id} {...a} author_id={a.author_id} />)}
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
