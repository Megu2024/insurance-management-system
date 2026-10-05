import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, UserCircle, Shield, Bell } from "lucide-react";
import "./Navbar.css";

const Navbar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName =
    (user?.name && !user.name.includes("@")) ? user.name :
    (user?.details?.first_name ? `${user.details.first_name} ${user.details.last_name || ""}`.trim() : null) ||
    user?.details?.agent_name ||
    user?.details?.surveyor_name ||
    (role === "ADMIN" ? "System Administrator" : user?.name || user?.username || "User");

  const avatarInitial = displayName && !displayName.includes("@")
    ? displayName.charAt(0).toUpperCase()
    : (user?.details?.first_name ? user.details.first_name.charAt(0).toUpperCase() : "U");

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <span className="navbar-tagline">Insurance Management System</span>
      </div>

      <div className="navbar-right">
        {user ? (
          <div className="navbar-user-section">
            <Link to="/profile" className="navbar-profile-link" title="View Profile">
              <div className="navbar-avatar">
                {avatarInitial}
              </div>
              <div className="navbar-user-info">
                <span className="navbar-user-name">{displayName}</span>
                <span className="navbar-user-role">{role}</span>
              </div>
            </Link>

            <button
              type="button"
              className="navbar-logout-btn"
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="navbar-auth-links">
            <Link to="/login" className="btn btn-primary btn-sm">
              Sign In
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;