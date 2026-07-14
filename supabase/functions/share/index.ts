import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = Deno.env.get("SITE_URL") || "https://jss-news-foundation.lovable.app";

const LEGACY_ARTICLE_SLUGS: Record<string, string> = {
  "प्राइवेट-स्कूलों-की-rte-गैर-सहयोग-पर-सवाल-शिक्षा-अधिकार-कानून-पर-टकराव-क्यों-22-अप्रैल-से-जारी-मामला-6r1cm":
    "rte-private-schools-education-row",
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const cleanTitle = (s: string) => s.replace(/^#+\s*/, "").trim();

Deno.serve(async (req) => {
  const url = new URL(req.url);
  // path: /share/<slug> OR /functions/v1/share/<slug>
  const parts = url.pathname.split("/").filter(Boolean);
  const requestedSlug = decodeURIComponent(parts[parts.length - 1] || "");
  const slug = LEGACY_ARTICLE_SLUGS[requestedSlug] || requestedSlug;

  if (!slug || slug === "share") {
    return Response.redirect(SITE_URL, 302);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: article } = await supabase
    .from("articles")
    .select("title, excerpt, image_url, created_at, slug, status")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();

  if (!article) {
    return Response.redirect(SITE_URL, 302);
  }

  const target = `${SITE_URL}/${article.slug || slug}`;
  const title = cleanTitle(article?.title || "जन सेवा संदेश");
  const desc = title.slice(0, 200);
  const img = article?.image_url || "";

  const html = `<!doctype html>
<html lang="hi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${target}" />
<meta property="og:site_name" content="जन सेवा संदेश" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${target}" />
${img ? `<meta property="og:image" content="${esc(img)}" />` : ""}
<meta property="og:locale" content="hi_IN" />
<meta name="twitter:card" content="${img ? "summary_large_image" : "summary"}" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
${img ? `<meta name="twitter:image" content="${esc(img)}" />` : ""}
<meta http-equiv="refresh" content="0; url=${target}" />
<script>window.location.replace(${JSON.stringify(target)});</script>
</head>
<body>
<p>Redirecting to <a href="${target}">${esc(title)}</a>...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
