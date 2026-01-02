import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AppRoutes } from "../../types";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-emerald-950 rounded-xl mb-4" />
          <div className="h-4 w-24 bg-stone-200 rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={AppRoutes.LOGIN} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
