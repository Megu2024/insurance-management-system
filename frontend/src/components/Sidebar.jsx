import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  ClipboardCheck,
  UserCheck,
  Building2,
  Search,
  Car,
  Home,
  Briefcase,
  Layers,
  FileCheck,
  HeartPulse,
  UserPlus,
  ShieldCheck,
  UserCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const Sidebar = () => {
  const { role, user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon-wrapper">
          <ShieldCheck size={26} className="logo-shield-icon" />
        </div>
        <div className="logo-text-wrapper">
          <h2 className="logo-brand">SureGuard</h2>
          <span className="logo-sub">Insurance System</span>
        </div>
      </div>

      <div className="user-role-badge-sidebar">
        <span className="role-indicator-dot"></span>
        <span className="user-role-text">{role || "GUEST"} PORTAL</span>
      </div>

      <nav className="sidebar-nav">
        {/* ================= ADMIN NAVIGATION ================= */}
        {role === "ADMIN" && (
          <>
            <div className="nav-section-label">CORE</div>
            <NavLink to="/dashboard" end>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/admin/approvals">
              <UserCheck size={18} />
              <span>Pending Approvals</span>
            </NavLink>

            <div className="nav-section-label">OPERATIONS</div>
            <NavLink to="/customers">
              <Users size={18} />
              <span>Customers</span>
            </NavLink>
            <NavLink to="/policies">
              <FileText size={18} />
              <span>Policies</span>
            </NavLink>
            <NavLink to="/payments">
              <CreditCard size={18} />
              <span>Payments</span>
            </NavLink>
            <NavLink to="/claims">
              <ClipboardCheck size={18} />
              <span>Claims</span>
            </NavLink>

            <div className="nav-section-label">NETWORK & TEAMS</div>
            <NavLink to="/agents">
              <UserPlus size={18} />
              <span>Agents</span>
            </NavLink>
            <NavLink to="/surveyors">
              <Search size={18} />
              <span>Surveyors</span>
            </NavLink>
            <NavLink to="/branches">
              <Building2 size={18} />
              <span>Branches</span>
            </NavLink>
            <NavLink to="/hospitals">
              <HeartPulse size={18} />
              <span>Hospitals</span>
            </NavLink>

            <div className="nav-section-label">ASSETS & RECORDS</div>
            <NavLink to="/vehicles">
              <Car size={18} />
              <span>Vehicles</span>
            </NavLink>
            <NavLink to="/properties">
              <Home size={18} />
              <span>Properties</span>
            </NavLink>
            <NavLink to="/businesses">
              <Briefcase size={18} />
              <span>Businesses</span>
            </NavLink>
            <NavLink to="/nominees">
              <Users size={18} />
              <span>Nominees</span>
            </NavLink>
            <NavLink to="/documents">
              <FileCheck size={18} />
              <span>Documents</span>
            </NavLink>

            <div className="nav-section-label">SYSTEM CONFIG</div>
            <NavLink to="/policy-types">
              <Layers size={18} />
              <span>Policy Types</span>
            </NavLink>
            <NavLink to="/admin/users">
              <Users size={18} />
              <span>User Accounts</span>
            </NavLink>
          </>
        )}

        {/* ================= CUSTOMER NAVIGATION ================= */}
        {role === "CUSTOMER" && (
          <>
            <div className="nav-section-label">MY ACCOUNT</div>
            <NavLink to="/customer/dashboard" end>
              <LayoutDashboard size={18} />
              <span>Overview</span>
            </NavLink>
            <NavLink to="/policies">
              <FileText size={18} />
              <span>My Policies</span>
            </NavLink>
            <NavLink to="/claims">
              <ClipboardCheck size={18} />
              <span>My Claims</span>
            </NavLink>
            <NavLink to="/payments">
              <CreditCard size={18} />
              <span>Payment History</span>
            </NavLink>
            <NavLink to="/nominees">
              <Users size={18} />
              <span>My Nominees</span>
            </NavLink>
            <NavLink to="/documents">
              <FileCheck size={18} />
              <span>My Documents</span>
            </NavLink>
            <NavLink to="/profile">
              <UserCircle size={18} />
              <span>My Profile</span>
            </NavLink>
          </>
        )}

        {/* ================= AGENT NAVIGATION ================= */}
        {role === "AGENT" && (
          <>
            <div className="nav-section-label">AGENT CONSOLE</div>
            <NavLink to="/agent/dashboard" end>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/policies">
              <FileText size={18} />
              <span>Handled Policies</span>
            </NavLink>
            <NavLink to="/customers">
              <Users size={18} />
              <span>Assigned Clients</span>
            </NavLink>
            <NavLink to="/claims">
              <ClipboardCheck size={18} />
              <span>Client Claims</span>
            </NavLink>
            <NavLink to="/payments">
              <CreditCard size={18} />
              <span>Premium Records</span>
            </NavLink>
            <NavLink to="/profile">
              <UserCircle size={18} />
              <span>Agent Profile</span>
            </NavLink>
          </>
        )}

        {/* ================= SURVEYOR NAVIGATION ================= */}
        {role === "SURVEYOR" && (
          <>
            <div className="nav-section-label">SURVEYOR CONSOLE</div>
            <NavLink to="/surveyor/dashboard" end>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/claims">
              <ClipboardCheck size={18} />
              <span>Assigned Claims</span>
            </NavLink>
            <NavLink to="/profile">
              <UserCircle size={18} />
              <span>Surveyor Profile</span>
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;