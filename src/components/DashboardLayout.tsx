import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Users, FolderOpen, BarChart3, LogOut, Home, PenLine, User } from "lucide-react";
import logo from "@/assets/logo.jpg";

const adminLinks = [
  { to: "/admin", icon: LayoutDashboard, label: "डैशबोर्ड" },
  { to: "/admin/articles", icon: FileText, label: "लेख प्रबंधन" },
  { to: "/admin/users", icon: Users, label: "उपयोगकर्ता" },
  { to: "/admin/categories", icon: FolderOpen, label: "श्रेणियां" },
  { to: "/admin/stats", icon: BarChart3, label: "आंकड़े" },
];

const writerLinks = [
  { to: "/writer", icon: LayoutDashboard, label: "डैशबोर्ड" },
  { to: "/writer/new", icon: PenLine, label: "नया लेख" },
  { to: "/writer/articles", icon: FileText, label: "मेरे लेख" },
  { to: "/profile", icon: User, label: "प्रोफ़ाइल" },
];

const userLinks = [
  { to: "/profile", icon: User, label: "मेरा पैनल" },
];

interface DashboardLayoutProps {
  children: ReactNode;
  type: "admin" | "writer" | "user";
}

const DashboardLayout = ({ children, type }: DashboardLayoutProps) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const links = type === "admin" ? adminLinks : type === "writer" ? writerLinks : userLinks;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 border-b border-border">
          <Link to="/">
            <img src={logo} alt="JSS" className="h-10 object-contain" />
          </Link>
          <p className="text-xs text-muted-foreground mt-1">
            {type === "admin" ? "एडमिन पैनल" : type === "writer" ? "लेखक पैनल" : "उपयोगकर्ता पैनल"}
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-foreground hover:bg-muted">
            <Home className="w-4 h-4" /> होम पेज
          </Link>
          <button onClick={signOut} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-destructive hover:bg-destructive/10 w-full">
            <LogOut className="w-4 h-4" /> लॉगआउट
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-card border-b border-border p-3 flex items-center justify-between">
          <Link to="/"><img src={logo} alt="JSS" className="h-8" /></Link>
          <div className="flex gap-2">
            <Link to="/"><Button variant="ghost" size="icon"><Home className="w-4 h-4" /></Button></Link>
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="md:hidden bg-card border-b border-border flex overflow-x-auto px-2 py-1 gap-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs whitespace-nowrap ${
                  isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                }`}
              >
                <link.icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
