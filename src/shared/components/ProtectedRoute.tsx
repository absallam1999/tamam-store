import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { PageLoader } from "@shared/components/PageLoader";

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentLanguage } = useLanguage();
  const location = useLocation();

  if (isLoading) {
    return (
      <PageLoader
        message={
          currentLanguage === "ar"
            ? "جاري التحقق من الجلسة..."
            : "Verifying session..."
        }
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};