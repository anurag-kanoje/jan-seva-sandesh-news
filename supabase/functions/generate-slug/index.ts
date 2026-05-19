import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function fallbackSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
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

    if (apiKey) {
      const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
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

      if (ai.ok) {
        const data = await ai.json();
        const raw = (data.choices?.[0]?.message?.content ?? "").trim();
        slug = fallbackSlug(raw);
      }
    }

    if (!slug) slug = fallbackSlug(title) || "news";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Ensure uniqueness
    let candidate = slug;
    let i = 2;
    while (true) {
      const { data } = await supabase
        .from("articles")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();
      if (!data) break;
      candidate = `${slug}-${i++}`;
      if (i > 50) {
        candidate = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
        break;
      }
    }

    return new Response(JSON.stringify({ slug: candidate }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
