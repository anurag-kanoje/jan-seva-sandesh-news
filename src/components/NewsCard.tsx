import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NewsCardProps {
  title: string;
  excerpt: string;
  image: string;
  category: string;
  time: string;
  isLarge?: boolean;
  categoryColor?: string;
}

const NewsCard = ({ 
  title, 
  excerpt, 
  image, 
  category, 
  time, 
  isLarge = false,
  categoryColor = "bg-accent"
}: NewsCardProps) => {
  return (
    <article className={`news-card group cursor-pointer ${isLarge ? "md:col-span-2" : ""}`}>
      <div className={`relative overflow-hidden ${isLarge ? "h-64 md:h-80" : "h-48"}`}>
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Badge className={`absolute top-3 left-3 ${categoryColor} text-white text-xs`}>
          {category}
        </Badge>
      </div>
      <div className="p-4">
        <h3 className={`font-heading font-bold text-card-foreground group-hover:text-accent transition-colors line-clamp-2 mb-2 ${isLarge ? "text-xl md:text-2xl" : "text-lg"}`}>
          {title}
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-3 font-body">
          {excerpt}
        </p>
        <div className="flex items-center text-muted-foreground text-xs">
          <Clock className="w-3 h-3 mr-1" />
          {time}
        </div>
      </div>
    </article>
  );
};

export default NewsCard;
