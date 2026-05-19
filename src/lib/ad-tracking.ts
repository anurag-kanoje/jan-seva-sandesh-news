import { supabase } from "@/integrations/supabase/client";

const seen = new Set<string>();

export async function trackAdEvent(adId: string, slot: string, eventType: "impression" | "click") {
  // De-dupe impressions per page-view per ad
  const key = `${adId}:${eventType}`;
  if (eventType === "impression" && seen.has(key)) return;
  seen.add(key);

  try {
    await supabase.from("ad_events").insert({ ad_id: adId, slot, event_type: eventType });
  } catch {
    // Swallow tracking errors
  }
}
