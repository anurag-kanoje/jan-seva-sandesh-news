import { TrendingUp, ArrowRight } from "lucide-react";

const trendingNews = [
  {
    id: 1,
    title: "गौशाला में 50 नई गायों का स्वागत",
    time: "2 घंटे पहले",
    views: "1.2K",
  },
  {
    id: 2,
    title: "जरूरतमंद परिवारों को राशन वितरण",
    time: "4 घंटे पहले",
    views: "980",
  },
  {
    id: 3,
    title: "स्थानीय स्कूल में शिक्षा सहायता कार्यक्रम",
    time: "6 घंटे पहले",
    views: "756",
  },
  {
    id: 4,
    title: "वृद्धाश्रम में सेवा अभियान",
    time: "8 घंटे पहले",
    views: "654",
  },
  {
    id: 5,
    title: "स्वच्छता अभियान में युवाओं की भागीदारी",
    time: "10 घंटे पहले",
    views: "543",
  },
];

const TrendingSidebar = () => {
  return (
    <aside className="bg-card rounded-xl shadow-lg p-6 sticky top-32">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-accent" />
        <h3 className="font-heading font-bold text-lg text-card-foreground">ट्रेंडिंग समाचार</h3>
      </div>
      
      <div className="space-y-4">
        {trendingNews.map((item, index) => (
          <a
            key={item.id}
            href="#"
            className="flex gap-4 group cursor-pointer"
          >
            <span className="text-3xl font-heading font-bold text-accent/30 group-hover:text-accent transition-colors">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex-1">
              <h4 className="font-medium text-card-foreground group-hover:text-accent transition-colors line-clamp-2 text-sm font-hindi">
                {item.title}
              </h4>
              <div className="flex items-center gap-3 text-muted-foreground text-xs mt-1">
                <span>{item.time}</span>
                <span>•</span>
                <span>{item.views} दर्शक</span>
              </div>
            </div>
          </a>
        ))}
      </div>
      
      <a
        href="#"
        className="flex items-center justify-center gap-2 mt-6 py-3 bg-muted hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors text-sm font-medium"
      >
        सभी ट्रेंडिंग <ArrowRight className="w-4 h-4" />
      </a>
    </aside>
  );
};

export default TrendingSidebar;
