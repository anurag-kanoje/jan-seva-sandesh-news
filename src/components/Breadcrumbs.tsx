import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export interface Crumb {
  label: string;
  to?: string;
}

const Breadcrumbs = ({ items }: { items: Crumb[] }) => (
  <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-4 flex items-center flex-wrap gap-1">
    {items.map((c, i) => (
      <span key={i} className="flex items-center gap-1">
        {i > 0 && <ChevronLeft className="w-3 h-3 rotate-180" />}
        {c.to ? (
          <Link to={c.to} className="hover:text-accent">{c.label}</Link>
        ) : (
          <span className="text-foreground">{c.label}</span>
        )}
      </span>
    ))}
  </nav>
);

export default Breadcrumbs;
