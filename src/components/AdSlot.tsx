import { cn } from "@/lib/utils";

interface AdSlotProps {
  slot: string;
  className?: string;
  label?: string;
  height?: string;
}

/**
 * Ad placeholder slot. Hidden in production unless VITE_ENABLE_ADS is "true".
 * Replace inner markup with your ad network code (AdSense, etc.) when ready.
 */
const AdSlot = ({ slot, className, label = "विज्ञापन", height = "h-24" }: AdSlotProps) => {
  const enabled = import.meta.env.VITE_ENABLE_ADS === "true";
  if (!enabled) return null;

  return (
    <div
      data-ad-slot={slot}
      className={cn(
        "w-full flex items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-xs text-muted-foreground",
        height,
        className,
      )}
    >
      {label}
    </div>
  );
};

export default AdSlot;
