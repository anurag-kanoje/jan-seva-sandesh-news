import NewsCard from "./NewsCard";

interface NewsSectionProps {
  id: string;
  title: string;
  titleHindi: string;
  news: {
    title: string;
    excerpt: string;
    image: string;
    category: string;
    time: string;
    categoryColor?: string;
  }[];
}

const NewsSection = ({ id, title, titleHindi, news }: NewsSectionProps) => {
  return (
    <section id={id} className="py-12">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="section-title font-hindi">{titleHindi}</h2>
            <p className="text-muted-foreground text-sm -mt-4">{title}</p>
          </div>
          <a href="#" className="text-accent hover:underline text-sm font-medium">
            सभी देखें →
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item, index) => (
            <NewsCard 
              key={index}
              {...item}
              isLarge={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
