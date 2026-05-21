import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESERVED = new Set([
  "article", "category", "author", "search", "login", "signup",
  "forgot-password", "reset-password", "dashboard", "writer", "admin",
  "profile", "sitemap.xml", "robots.txt", "favicon.ico", "api", "news",
]);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fallbackSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function isValidSlug(s: string): boolean {
  if (!s || s.length < 2 || s.length > 60) return false;
  if (!SLUG_RE.test(s)) return false;
  if (RESERVED.has(s)) return false;
  return true;
}

async function aiSlug(title: string, apiKey: string): Promise<string> {
  const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        {
          role: "system",
          content:
            "You convert news headlines (often in Hindi) into short, SEO-friendly English URL slugs. Output ONLY the slug. Rules: lowercase English letters and digits, hyphen separated, 2-5 words, max 50 chars, no diacritics, no quotes, no explanation.",
        },
        { role: "user", content: title },
      ],
    }),
  });
  if (!ai.ok) return "";
  const data = await ai.json();
  const raw = (data.choices?.[0]?.message?.content ?? "").trim().toLowerCase();
  return fallbackSlug(raw);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { title } = await req.json();
    if (!title || typeof title !== "string") {
      return new Response(JSON.stringify({ error: "title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    let slug = "";
    let wasFallback = false;

    if (apiKey) {
      for (let attempt = 0; attempt < 2 && !isValidSlug(slug); attempt++) {
        slug = await aiSlug(title, apiKey);
      }
    }

    if (!isValidSlug(slug)) {
      slug = fallbackSlug(title);
      wasFallback = true;
    }
    if (!isValidSlug(slug)) {
      slug = `news-${Math.random().toString(36).slice(2, 6)}`;
      wasFallback = true;
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let candidate = slug;
    for (let i = 2; i < 50; i++) {
      const { data } = await supabase
        .from("articles")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();
      if (!data) break;
      candidate = `${slug}-${i}`;
    }
    // final guard: if we somehow still collide, suffix random
    {
      const { data } = await supabase
        .from("articles")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();
      if (data) candidate = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    return new Response(JSON.stringify({ slug: candidate, wasFallback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
