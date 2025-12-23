import { MapPin, Phone, Mail, Facebook, Twitter, Youtube, Instagram } from "lucide-react";
import logo from "@/assets/logo.jpg";

const Footer = () => {
  return (
    <footer id="contact" className="bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <img src={logo} alt="JSS Logo" className="h-16 mb-4 bg-white rounded-lg p-2" />
            <p className="text-primary-foreground/80 text-sm mb-4 font-body">
              जन सेवा संदेश - सच्चाई की आवाज़। स्थानीय से वैश्विक स्तर तक निष्पक्ष समाचार।
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-accent rounded-full flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-accent rounded-full flex items-center justify-center transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-accent rounded-full flex items-center justify-center transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-accent rounded-full flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-4">त्वरित लिंक</h4>
            <ul className="space-y-2">
              {["होम", "स्थानीय समाचार", "राष्ट्रीय समाचार", "अंतर्राष्ट्रीय", "NGO गतिविधियां", "हमारे बारे में"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors text-sm font-hindi">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-4">समाचार श्रेणियां</h4>
            <ul className="space-y-2">
              {["राजनीति", "खेल", "व्यापार", "मनोरंजन", "प्रौद्योगिकी", "स्वास्थ्य"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors text-sm font-hindi">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-4">संपर्क करें</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 mt-1 shrink-0 text-accent" />
                <span className="text-primary-foreground/70 font-hindi">
                  श्री नन्देश्वर शिक्षा एवं जनसेवा संस्थान, मुख्य कार्यालय
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 shrink-0 text-accent" />
                <a href="tel:+918103282074" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  +91 81032 82074
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 shrink-0 text-accent" />
                <a href="mailto:shreenandeshwar4@gmail.com" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  shreenandeshwar4@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/60 text-sm text-center md:text-left">
            © 2025 JSS - जन सेवा संदेश। सर्वाधिकार सुरक्षित।
          </p>
          <div className="flex gap-4 text-sm">
            <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">गोपनीयता नीति</a>
            <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">नियम व शर्तें</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
