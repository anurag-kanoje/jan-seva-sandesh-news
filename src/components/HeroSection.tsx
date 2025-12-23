import { Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import background from "@/assets/background.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[500px] md:min-h-[600px] flex items-end">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${background})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="container relative z-10 py-12 md:py-16">
        <div className="max-w-3xl animate-fade-in-up">
          <Badge className="bg-accent text-accent-foreground mb-4 text-sm px-4 py-1">
            मुख्य समाचार
          </Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white leading-tight mb-4">
            जनसेवा संदेश: स्थानीय से वैश्विक स्तर तक सच्चाई की आवाज़
          </h1>
          <p className="text-white/90 text-lg md:text-xl mb-6 font-body leading-relaxed">
            श्री नन्देश्वर शिक्षा एवं जनसेवा संस्थान के साथ मिलकर, हम समाज सेवा और निष्पक्ष पत्रकारिता के लिए प्रतिबद्ध हैं।
          </p>
          <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              आज, 23 दिसंबर 2025
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              5,234 दर्शक
            </span>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 z-20">
        <div className="container">
          <div className="flex flex-wrap justify-center gap-3 bg-card rounded-xl shadow-lg p-4 max-w-3xl mx-auto">
            {["स्थानीय", "राष्ट्रीय", "अंतर्राष्ट्रीय", "NGO सेवा", "राजनीति", "खेल"].map((cat, i) => (
              <a
                key={cat}
                href="#"
                className="px-4 py-2 bg-muted hover:bg-accent hover:text-accent-foreground rounded-full text-sm font-medium transition-all duration-300 font-hindi"
              >
                {cat}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
