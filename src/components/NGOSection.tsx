import { Heart, Users, Leaf, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: Leaf,
    title: "गौ सेवा",
    description: "गौशाला में सैकड़ों गायों की देखभाल और सेवा",
    color: "bg-green-500/10 text-green-600",
  },
  {
    icon: Users,
    title: "जन सेवा",
    description: "जरूरतमंद लोगों की सहायता और सामाजिक कल्याण",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: HandHeart,
    title: "राशन वितरण",
    description: "गरीब परिवारों को मुफ्त राशन और आवश्यक सामग्री",
    color: "bg-orange-500/10 text-orange-600",
  },
  {
    icon: Heart,
    title: "स्वास्थ्य सेवा",
    description: "निःशुल्क स्वास्थ्य शिविर और चिकित्सा सहायता",
    color: "bg-red-500/10 text-red-600",
  },
];

const NGOSection = () => {
  return (
    <section id="ngo" className="py-16 bg-muted">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-4 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium mb-4">
            हमारी संस्था
          </span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4 font-hindi">
            श्री नन्देश्वर शिक्षा एवं जनसेवा संस्थान
          </h2>
          <p className="text-muted-foreground font-body">
            समाज सेवा और गौ सेवा के प्रति समर्पित, हम निस्वार्थ भाव से जरूरतमंदों की सहायता करते हैं।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-xl ${service.color} flex items-center justify-center mb-4`}>
                <service.icon className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-bold text-lg text-card-foreground mb-2 font-hindi">
                {service.title}
              </h3>
              <p className="text-muted-foreground text-sm font-body">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-primary to-navy-light rounded-2xl p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-white mb-4">
            हमारे साथ जुड़ें
          </h3>
          <p className="text-white/80 max-w-xl mx-auto mb-6 font-body">
            आप भी इस नेक काम में हमारा साथ दे सकते हैं। दान या स्वयंसेवक के रूप में जुड़ें।
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="bg-accent hover:bg-saffron-dark text-accent-foreground px-8">
              दान करें
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white/10">
              स्वयंसेवक बनें
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NGOSection;
