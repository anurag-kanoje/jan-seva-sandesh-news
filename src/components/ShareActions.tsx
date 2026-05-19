import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Facebook, Link2, MessageCircle, Share2, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ShareActionsProps {
  title: string;
  url?: string;
}

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

const ShareActions = ({ title, url }: ShareActionsProps) => {
  const { toast } = useToast();
  const location = useLocation();

  // Extract slug from current path (clean URL like /my-slug)
  const slug = (url ? new URL(url).pathname : location.pathname).replace(/^\/+/, "").split("/")[0];

  // Prerendered share URL — returns HTML with OG tags for crawlers,
  // then redirects browsers to the real article page.
  const shareUrl = useMemo(() => {
    if (PROJECT_ID && slug) {
      return `https://${PROJECT_ID}.supabase.co/functions/v1/share/${slug}`;
    }
    return url || (typeof window !== "undefined" ? window.location.href : "");
  }, [slug, url]);

  const directUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const links = useMemo(
    () => [
      { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
      { label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
      { label: "X", icon: Twitter, href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    ],
    [encodedTitle, encodedUrl],
  );

  const nativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title, url: shareUrl });
      return;
    }
    await navigator.clipboard.writeText(directUrl);
    toast({ title: "लिंक कॉपी हुआ" });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-3">
      <span className="text-sm font-medium text-card-foreground">शेयर करें:</span>
      {links.map((item) => (
        <Button key={item.label} asChild variant="outline" size="sm">
          <a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={`${item.label} पर शेयर करें`}>
            <item.icon className="w-4 h-4" /> {item.label}
          </a>
        </Button>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={nativeShare}>
        {navigator.share ? <Share2 className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
        {navigator.share ? "शेयर" : "लिंक"}
      </Button>
    </div>
  );
};

export default ShareActions;
