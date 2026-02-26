import { Link } from "react-router-dom";
import { Clock, Eye, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ArticleCardPublicProps {
  id: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  category_name: string | null;
  author_name: string | null;
  author_id: string;
  slug: string | null;
  created_at: string;
  views: number;
  isLarge?: boolean;
}

const ArticleCardPublic = ({
  id, title, excerpt, image_url, category_name, author_name, author_id, slug, created_at, views, isLarge = false,
}: ArticleCardPublicProps) => {
  const timeAgo = new Date(created_at).toLocaleDateString("hi-IN", { day: "numeric", month: "short", year: "numeric" });
  const articleUrl = slug ? `/article/${slug}` : `/article/${id}`;

  return (
    <Link to={articleUrl} className={`news-card group ${isLarge ? "md:col-span-2" : ""}`}>
      <div className={`relative overflow-hidden ${isLarge ? "h-64 md:h-80" : "h-48"}`}>
        {image_url ? (
          <img src={image_url} alt={title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-4xl font-heading">JSS</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {category_name && (
          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs">{category_name}</Badge>
        )}
      </div>
      <div className="p-4">
        <h3 className={`font-heading font-bold text-card-foreground group-hover:text-accent transition-colors line-clamp-2 mb-2 ${isLarge ? "text-xl md:text-2xl" : "text-lg"}`}>
          {title}
        </h3>
        {excerpt && <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{excerpt}</p>}
        <div className="flex items-center gap-3 text-muted-foreground text-xs flex-wrap">
          <Link to={`/author/${author_id}`} className="flex items-center gap-1 hover:text-accent" onClick={(e) => e.stopPropagation()}>
            <User className="w-3 h-3" /> {author_name || "अज्ञात"}
          </Link>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo}</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{views}</span>
        </div>
      </div>
    </Link>
  );
};

export const ArticleCardSkeleton = () => (
  <div className="news-card">
    <Skeleton className="h-48 w-full rounded-b-none" />
    <div className="p-4 space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

export default ArticleCardPublic;
