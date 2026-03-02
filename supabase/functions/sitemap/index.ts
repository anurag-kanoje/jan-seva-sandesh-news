import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600",
};

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const siteUrl = Deno.env.get("SITE_URL") || "https://jss-news-foundation.lovable.app";

  const { data: articles } = await supabase
    .from("articles")
    .select("slug, updated_at")
    .eq("status", "approved")
    .not("slug", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1000);

  const { data: categories } = await supabase
    .from("categories")
    .select("id, updated_at")
    .order("updated_at", { ascending: false });

  const urls = [
    `<url><loc>${siteUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ...(categories ?? []).map(
      (c) =>
        `<url><loc>${siteUrl}/category/${c.id}</loc><lastmod>${c.updated_at}</lastmod><changefreq>daily</changefreq><priority>0.7</priority></url>`
    ),
    ...(articles ?? []).map(
      (a) =>
        `<url><loc>${siteUrl}/article/${a.slug}</loc><lastmod>${a.updated_at}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, { headers: corsHeaders });
});
