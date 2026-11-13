import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

export function ProtectedRoute({ roles }: { roles?: string[] }) {
  const { status, user } = useAuth();
  const location = useLocation();

  const unauthorized = status === "authenticated" && !!user && !!roles && !roles.includes(user.role);

  useEffect(() => {
    if (unauthorized) {
      toast.error("You don’t have access to that area");
    }
  }, [unauthorized, location.pathname]);

  if (status === "loading") {
    return (
      <div className="grid min-h-[40vh] place-items-center text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  if (!user) {
    const to = roles?.includes("PATIENT") ? "/start" : "/login";
    return <Navigate to={to} replace state={{ from: location }} />;
  }

  if (unauthorized) {
    const fallback = user.role === "PATIENT" ? "/patient" : "/admin";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
