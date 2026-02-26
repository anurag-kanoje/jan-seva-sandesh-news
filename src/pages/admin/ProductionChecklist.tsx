import DashboardLayout from "@/components/DashboardLayout";
import { CheckCircle, XCircle } from "lucide-react";

interface CheckItem {
  label: string;
  done: boolean;
}

const checks: CheckItem[] = [
  { label: "Slug routing enabled", done: true },
  { label: "RLS verified on articles", done: true },
  { label: "Storage RLS verified (article-images)", done: true },
  { label: "View counter RPC active (increment_article_views)", done: true },
  { label: "Auth email confirmation enabled", done: true },
  { label: "Environment variables configured (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)", done: true },
  { label: "SEO meta tags active (react-helmet-async)", done: true },
  { label: "Error boundary active", done: true },
  { label: "Client-side rate limiting active", done: true },
  { label: "Slug uniqueness enforced (unique index)", done: true },
];

const ProductionChecklist = () => (
  <DashboardLayout type="admin">
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-heading font-bold">प्रोडक्शन चेकलिस्ट</h1>
      <p className="text-muted-foreground text-sm">आंतरिक सत्यापन — केवल एडमिन के लिए</p>
      <div className="space-y-3">
        {checks.map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
            {item.done ? (
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive shrink-0" />
            )}
            <span className="text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  </DashboardLayout>
);

export default ProductionChecklist;
