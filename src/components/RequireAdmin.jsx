import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui";

/**
 * UI gate only: nothing behind it is loaded without a valid admin session, and every API call is
 * checked again on the server (admin-api), so bypassing this component in the browser gives no data.
 */
export function RequireAdmin({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "checking") return <div className="grid min-h-full place-items-center"><Spinner label="Checking your session…" /></div>;
  if (status !== "signed-in") return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}
