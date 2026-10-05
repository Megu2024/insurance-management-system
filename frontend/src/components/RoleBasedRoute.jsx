import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RoleBasedRoute = ({ allowedRoles, children }) => {
  const { role, loading } = useAuth();

  if (loading) return null;

  if (!role || !allowedRoles.includes(role)) {
    // Redirect to their default dashboard
    if (role === "CUSTOMER") return <Navigate to="/customer/dashboard" replace />;
    if (role === "AGENT") return <Navigate to="/agent/dashboard" replace />;
    if (role === "SURVEYOR") return <Navigate to="/surveyor/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleBasedRoute;
