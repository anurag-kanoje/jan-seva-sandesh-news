import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import NewsSection from "@/components/NewsSection";
import TrendingSidebar from "@/components/TrendingSidebar";
import NGOSection from "@/components/NGOSection";
import Footer from "@/components/Footer";

// Import images
import newsGaushala from "@/assets/news-gaushala.jpg";
import newsCharity from "@/assets/news-charity.jpg";
import newsNational from "@/assets/news-national.jpg";
import newsInternational from "@/assets/news-international.jpg";
import newsLocal from "@/assets/news-local.jpg";
import newsSports from "@/assets/news-sports.jpg";

const localNews = [
  {
    title: "स्थानीय गौशाला में 100 गायों की सेवा जारी",
    excerpt: "श्री नन्देश्वर संस्थान की गौशाला में गायों की देखभाल के लिए नई सुविधाएं शुरू।",
    image: newsGaushala,
    category: "गौ सेवा",
    time: "2 घंटे पहले",
    categoryColor: "bg-green-600",
  },
  {
    title: "ग्राम पंचायत में विकास कार्यों की समीक्षा",
    excerpt: "स्थानीय प्रशासन ने गांव में सड़क और जल आपूर्ति परियोजनाओं का निरीक्षण किया।",
    image: newsLocal,
    category: "स्थानीय",
    time: "4 घंटे पहले",
    categoryColor: "bg-blue-600",
  },
  {
    title: "जरूरतमंद परिवारों को राशन वितरण",
    excerpt: "संस्थान द्वारा 500 परिवारों को मुफ्त राशन किट वितरित किए गए।",
    image: newsCharity,
    category: "जन सेवा",
    time: "6 घंटे पहले",
    categoryColor: "bg-orange-600",
  },
];

const nationalNews = [
  {
    title: "संसद में नए विधेयक पर चर्चा जारी",
    excerpt: "लोकसभा में महत्वपूर्ण विधेयक पर विपक्ष और सत्ता पक्ष के बीच बहस।",
    image: newsNational,
    category: "राजनीति",
    time: "1 घंटा पहले",
    categoryColor: "bg-red-600",
  },
  {
    title: "भारतीय क्रिकेट टीम की शानदार जीत",
    excerpt: "विश्व कप में भारत ने प्रतिद्वंद्वी टीम को 50 रनों से हराया।",
    image: newsSports,
    category: "खेल",
    time: "3 घंटे पहले",
    categoryColor: "bg-green-600",
  },
  {
    title: "राष्ट्रीय स्तर पर नई शिक्षा नीति लागू",
    excerpt: "केंद्र सरकार ने नई शिक्षा नीति के तहत कई सुधारों की घोषणा की।",
    image: newsLocal,
    category: "शिक्षा",
    time: "5 घंटे पहले",
    categoryColor: "bg-blue-600",
  },
];

const internationalNews = [
  {
    title: "विश्व नेताओं की बैठक में जलवायु पर चर्चा",
    excerpt: "संयुक्त राष्ट्र में जलवायु परिवर्तन पर महत्वपूर्ण समझौते की दिशा में कदम।",
    image: newsInternational,
    category: "अंतर्राष्ट्रीय",
    time: "30 मिनट पहले",
    categoryColor: "bg-navy",
  },
  {
    title: "वैश्विक अर्थव्यवस्था में सुधार के संकेत",
    excerpt: "प्रमुख देशों में आर्थिक विकास दर में वृद्धि देखी जा रही है।",
    image: newsNational,
    category: "व्यापार",
    time: "2 घंटे पहले",
    categoryColor: "bg-emerald-600",
  },
  {
    title: "भारत-अमेरिका संबंधों में नई प्रगति",
    excerpt: "दोनों देशों के बीच व्यापार और रक्षा समझौतों पर हस्ताक्षर।",
    image: newsInternational,
    category: "कूटनीति",
    time: "4 घंटे पहले",
    categoryColor: "bg-violet-600",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        
        {/* Main Content Area */}
        <div className="container py-12 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* News Sections */}
            <div className="lg:col-span-2">
              <NewsSection
                id="local"
                title="Local News"
                titleHindi="स्थानीय समाचार"
                news={localNews}
              />
              
              <NewsSection
                id="national"
                title="National News"
                titleHindi="राष्ट्रीय समाचार"
                news={nationalNews}
              />
              
              <NewsSection
                id="international"
                title="International News"
                titleHindi="अंतर्राष्ट्रीय समाचार"
                news={internationalNews}
              />
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <TrendingSidebar />
            </div>
          </div>
        </div>

        <NGOSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
