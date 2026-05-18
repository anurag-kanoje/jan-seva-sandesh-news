import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AdSlotProps {
  slot: string;
  className?: string;
  label?: string;
  height?: string;
}

interface Ad {
  id: string;
  title: string;
  image_url: string | null;
  link_url: string | null;
  html: string | null;
}

const AdSlot = ({ slot, className, label = "विज्ञापन", height = "h-24" }: AdSlotProps) => {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("ads")
        .select("id, title, image_url, link_url, html")
        .eq("slot", slot)
        .eq("active", true)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5);
      if (!mounted || !data || data.length === 0) return;
      // randomize among top eligible
      setAd(data[Math.floor(Math.random() * data.length)] as Ad);
    })();
    return () => {
      mounted = false;
    };
  }, [slot]);

  if (ad) {
    const content = ad.image_url ? (
      <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" loading="lazy" />
    ) : ad.html ? (
      <div className="w-full h-full p-2 overflow-hidden" dangerouslySetInnerHTML={{ __html: ad.html }} />
    ) : (
      <span className="text-sm font-medium">{ad.title}</span>
    );

    const inner = (
      <div
        data-ad-slot={slot}
        data-ad-id={ad.id}
        className={cn(
          "w-full overflow-hidden rounded-md border border-border bg-card relative",
          height,
          className,
        )}
      >
        {content}
        <span className="absolute top-1 left-1 text-[10px] bg-background/80 text-muted-foreground px-1.5 py-0.5 rounded">
          {label}
        </span>
      </div>
    );

    return ad.link_url ? (
      <a href={ad.link_url} target="_blank" rel="noopener noreferrer sponsored" aria-label={ad.title}>
        {inner}
      </a>
    ) : (
      inner
    );
  }

  return (
    <div
      data-ad-slot={slot}
      className={cn(
        "w-full flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/30 px-4 text-center text-xs text-muted-foreground",
        height,
        className,
      )}
    >
      <span className="font-medium text-foreground">{label}</span>
      <span>Sponsored advertisement space</span>
    </div>
  );
};

export default AdSlot;
