import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600",
  "Access-Control-Allow-Origin": "*",
};

const SITE_URL = Deno.env.get("SITE_URL") || "https://jss-news-foundation.lovable.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const [{ data: articles }, { data: categories }, { data: authors }] = await Promise.all([
    supabase
      .from("articles")
      .select("slug, updated_at, author_id")
      .eq("status", "approved")
      .not("slug", "is", null)
      .order("updated_at", { ascending: false })
      .limit(2000),
    supabase
      .from("categories")
      .select("id, updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("user_id, updated_at")
      .eq("is_active", true),
  ]);

  const now = new Date().toISOString();
  const urls = [
    `<url><loc>${SITE_URL}/</loc><lastmod>${now}</lastmod><changefreq>hourly</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${SITE_URL}/search</loc><changefreq>weekly</changefreq><priority>0.4</priority></url>`,
    ...(categories ?? []).map(
      (c) =>
        `<url><loc>${SITE_URL}/category/${c.id}</loc><lastmod>${c.updated_at}</lastmod><changefreq>daily</changefreq><priority>0.7</priority></url>`
    ),
    ...(authors ?? []).map(
      (a) =>
        `<url><loc>${SITE_URL}/author/${a.user_id}</loc><lastmod>${a.updated_at}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>`
    ),
    ...(articles ?? []).map(
      (a) =>
        `<url><loc>${SITE_URL}/article/${a.slug}</loc><lastmod>${a.updated_at}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, { headers: corsHeaders });
});
