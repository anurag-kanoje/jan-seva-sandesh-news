import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Navigate, useParams } from "react-router-dom";

const RESERVED = new Set([
  "article", "category", "author", "search", "login", "signup",
  "forgot-password", "reset-password", "dashboard", "writer", "admin",
  "profile", "sitemap.xml", "robots.txt", "favicon.ico",
]);

const SlugRouter = () => {
  const { slug } = useParams<{ slug: string }>();
  if (!slug || RESERVED.has(slug)) return <NotFound />;
  return <ArticlePage />;
};

const LegacyArticleRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/${slug}`} replace />;
};

const POST_AUTH_PATH_KEY = "jss-post-auth-path";

const AuthRedirectHandler = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user || loading) return;
    let target: string | null = null;
    try {
      target = sessionStorage.getItem(POST_AUTH_PATH_KEY);
      if (target) sessionStorage.removeItem(POST_AUTH_PATH_KEY);
    } catch { /* noop */ }
    if (target && ["/", "/login", "/signup"].includes(location.pathname)) {
      navigate(target, { replace: true });
    }
  }, [location.pathname, loading, navigate, user]);

  return null;
};
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import ArticlePage from "./pages/ArticlePage";
import CategoryPage from "./pages/CategoryPage";
import AuthorPage from "./pages/AuthorPage";
import SearchPage from "./pages/SearchPage";
import ProfilePage from "./pages/ProfilePage";
import WriterDashboard from "./pages/writer/WriterDashboard";
import WriterArticles from "./pages/writer/WriterArticles";
import ArticleForm from "./pages/writer/ArticleForm";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminArticles from "./pages/admin/AdminArticles";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminWriters from "./pages/admin/AdminWriters";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminStats from "./pages/admin/AdminStats";
import AdminAds from "./pages/admin/AdminAds";
import ProductionChecklist from "./pages/admin/ProductionChecklist";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthRedirectHandler />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/article/:slug" element={<LegacyArticleRedirect />} />
                <Route path="/category/:id" element={<CategoryPage />} />
                <Route path="/author/:id" element={<AuthorPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Writer routes */}
                <Route path="/writer" element={<ProtectedRoute allowedRoles={["writer", "admin"]}><WriterDashboard /></ProtectedRoute>} />
                <Route path="/writer/articles" element={<ProtectedRoute allowedRoles={["writer", "admin"]}><WriterArticles /></ProtectedRoute>} />
                <Route path="/writer/new" element={<ProtectedRoute allowedRoles={["writer", "admin"]}><ArticleForm /></ProtectedRoute>} />
                <Route path="/writer/edit/:id" element={<ProtectedRoute allowedRoles={["writer", "admin"]}><ArticleForm /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute allowedRoles={["user", "writer", "admin"]}><ProfilePage /></ProtectedRoute>} />

                {/* Admin routes */}
                <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/articles" element={<ProtectedRoute allowedRoles={["admin"]}><AdminArticles /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
                <Route path="/admin/writers" element={<ProtectedRoute allowedRoles={["admin"]}><AdminWriters /></ProtectedRoute>} />
                <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCategories /></ProtectedRoute>} />
                <Route path="/admin/stats" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStats /></ProtectedRoute>} />
                <Route path="/admin/ads" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAds /></ProtectedRoute>} />
                <Route path="/admin/production-checklist" element={<ProtectedRoute allowedRoles={["admin"]}><ProductionChecklist /></ProtectedRoute>} />

                {/* Clean article URLs: /<slug> */}
                <Route path="/:slug" element={<SlugRouter />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
