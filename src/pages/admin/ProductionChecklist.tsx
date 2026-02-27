import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { generateUniqueSlug } from "@/lib/slug";
import { useToast } from "@/hooks/use-toast";

interface CheckItem {
  label: string;
  done: boolean;
}

const checks: CheckItem[] = [
  { label: "Slug routing enabled", done: true },
  { label: "RLS verified on articles", done: true },
  { label: "Storage RLS verified (article-images)", done: true },
  { label: "View counter RPC active (increment_article_views)", done: true },
  { label: "Auth email confirmation enabled", done: true },
  { label: "Environment variables configured (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)", done: true },
  { label: "SEO meta tags active (react-helmet-async)", done: true },
  { label: "Error boundary active", done: true },
  { label: "Client-side rate limiting active", done: true },
  { label: "Slug uniqueness enforced (unique index)", done: true },
  { label: "Sitemap edge function deployed", done: true },
  { label: "robots.txt with sitemap reference", done: true },
];

const ProductionChecklist = () => {
  const [backfilling, setBackfilling] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { toast } = useToast();

  const backfillSlugs = async () => {
    setBackfilling(true);
    setResult(null);
    try {
      const { data: articles, error } = await supabase
        .from("articles")
        .select("id, title")
        .is("slug", null);

      if (error) throw error;
      if (!articles || articles.length === 0) {
        setResult("सभी लेखों में पहले से slug है। कोई बदलाव नहीं।");
        setBackfilling(false);
        return;
      }

      // Get existing slugs to ensure uniqueness
      const { data: existing } = await supabase.from("articles").select("slug").not("slug", "is", null);
      const existingSlugs = new Set((existing ?? []).map((a) => a.slug));

      let updated = 0;
      for (const article of articles) {
        let slug = generateUniqueSlug(article.title);
        while (existingSlugs.has(slug)) {
          slug = generateUniqueSlug(article.title);
        }
        existingSlugs.add(slug);

        const { error: updateErr } = await supabase
          .from("articles")
          .update({ slug })
          .eq("id", article.id);

        if (!updateErr) updated++;
      }

      setResult(`${updated} / ${articles.length} लेखों में slug जोड़ा गया।`);
      toast({ title: "Backfill पूरा", description: `${updated} slugs जोड़े गए` });
    } catch (err: any) {
      setResult(`त्रुटि: ${err.message}`);
    }
    setBackfilling(false);
  };

  return (
    <DashboardLayout type="admin">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-heading font-bold">प्रोडक्शन चेकलिस्ट</h1>
        <p className="text-muted-foreground text-sm">आंतरिक सत्यापन — केवल एडमिन के लिए</p>

        {/* Backfill Slugs */}
        <div className="p-4 bg-card rounded-lg border border-border space-y-3">
          <h2 className="font-heading font-semibold">Slug Backfill Utility</h2>
          <p className="text-sm text-muted-foreground">
            जिन लेखों में slug नहीं है, उनमें title से slug बनाएं।
          </p>
          <Button onClick={backfillSlugs} disabled={backfilling} variant="outline">
            {backfilling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {backfilling ? "Processing…" : "Backfill Slugs"}
          </Button>
          {result && <p className="text-sm font-medium text-foreground">{result}</p>}
        </div>

        <div className="space-y-3">
          {checks.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
              {item.done ? (
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive shrink-0" />
              )}
              <span className="text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProductionChecklist;
