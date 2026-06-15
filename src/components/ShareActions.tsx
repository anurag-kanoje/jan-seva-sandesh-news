import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Facebook, Link2, MessageCircle, Share2, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ShareActionsProps {
  title: string;
  url?: string;
}

// Always share the clean, published article URL — never the backend function URL or preview origin.
const PUBLIC_SITE = "https://jss-news-foundation.lovable.app";

const ShareActions = ({ title, url }: ShareActionsProps) => {
  const { toast } = useToast();
  const location = useLocation();

  const slug = useMemo(() => {
    try {
      const path = url ? new URL(url).pathname : location.pathname;
      return path.replace(/^\/+/, "").split("/")[0];
    } catch {
      return location.pathname.replace(/^\/+/, "").split("/")[0];
    }
  }, [url, location.pathname]);

  const shareUrl = slug ? `${PUBLIC_SITE}/${slug}` : PUBLIC_SITE;
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
    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl });
        return;
      }
    } catch { /* user cancelled */ }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "लिंक कॉपी हुआ", description: shareUrl });
    } catch {
      toast({ title: "लिंक कॉपी नहीं हो सका", variant: "destructive" });
    }
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
        {typeof navigator !== "undefined" && navigator.share ? <Share2 className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
        {typeof navigator !== "undefined" && navigator.share ? "शेयर" : "लिंक कॉपी"}
      </Button>
    </div>
  );
};

export default ShareActions;
