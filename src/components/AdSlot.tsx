import { cn } from "@/lib/utils";

interface AdSlotProps {
  slot: string;
  className?: string;
  label?: string;
  height?: string;
}

const AdSlot = ({ slot, className, label = "विज्ञापन", height = "h-24" }: AdSlotProps) => {
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
