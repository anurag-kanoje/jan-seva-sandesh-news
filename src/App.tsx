import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import WriterDashboard from "./pages/writer/WriterDashboard";
import WriterArticles from "./pages/writer/WriterArticles";
import ArticleForm from "./pages/writer/ArticleForm";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminArticles from "./pages/admin/AdminArticles";
import AdminWriters from "./pages/admin/AdminWriters";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminStats from "./pages/admin/AdminStats";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Writer routes */}
            <Route path="/writer" element={<ProtectedRoute allowedRoles={["writer", "admin"]}><WriterDashboard /></ProtectedRoute>} />
            <Route path="/writer/articles" element={<ProtectedRoute allowedRoles={["writer", "admin"]}><WriterArticles /></ProtectedRoute>} />
            <Route path="/writer/new" element={<ProtectedRoute allowedRoles={["writer", "admin"]}><ArticleForm /></ProtectedRoute>} />
            <Route path="/writer/edit/:id" element={<ProtectedRoute allowedRoles={["writer", "admin"]}><ArticleForm /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/articles" element={<ProtectedRoute allowedRoles={["admin"]}><AdminArticles /></ProtectedRoute>} />
            <Route path="/admin/writers" element={<ProtectedRoute allowedRoles={["admin"]}><AdminWriters /></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCategories /></ProtectedRoute>} />
            <Route path="/admin/stats" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStats /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
