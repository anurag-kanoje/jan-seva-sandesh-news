import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "writer") return <Navigate to="/writer" replace />;
  return <Navigate to="/" replace />;
};

export default Dashboard;
