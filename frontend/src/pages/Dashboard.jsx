import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  FileText,
  CreditCard,
  ClipboardCheck,
  Building2,
  Search,
  UserPlus,
  TrendingUp,
  AlertCircle,
  Clock,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getDashboardStats } from "../services/dashboardService";
import StatCard from "../components/StatCard";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { formatDate } from "../utils/dateUtils";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, role } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const stats = await getDashboardStats();
      setData(stats);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard statistics from PostgreSQL backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Connecting to PostgreSQL and loading statistics..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onDismiss={() => setError("")} />;
  }

  const stats = data?.stats || {};

  const displayName =
    (user?.name && !user.name.includes("@")) ? user.name :
    (user?.details?.first_name ? `${user.details.first_name} ${user.details.last_name || ""}`.trim() : null) ||
    user?.details?.agent_name ||
    user?.details?.surveyor_name ||
    (role === "ADMIN" ? "System Administrator" : user?.name || user?.username || "User");

  return (
    <div className="dashboard-page">
      <PageHeader
        title={`Welcome, ${displayName}!`}
        description={`SureGuard Insurance Management System • ${role} Console`}
        badge={`${role} PORTAL`}
        actions={
          role === "ADMIN" && stats.pendingApprovals > 0 ? (
            <Link to="/admin/approvals" className="btn btn-warning" style={{ backgroundColor: "#fef3c7", color: "#92400e", borderColor: "#fde68a" }}>
              <Clock size={16} />
              <span>{stats.pendingApprovals} Approvals Pending</span>
            </Link>
          ) : null
        }
      />

      {/* ===================================================================
          1. ADMIN DASHBOARD
          =================================================================== */}
      {role === "ADMIN" && (
        <>
          {/* Main Stat Cards Grid */}
          <div className="stats-grid-container">
            <StatCard
              title="Total Customers"
              value={stats.totalCustomers ?? 0}
              icon={<Users size={24} />}
              subtitle="Registered clients"
              color="primary"
            />
            <StatCard
              title="Active Policies"
              value={stats.activePolicies ?? 0}
              icon={<ShieldCheck size={24} />}
              subtitle={`${stats.totalPolicies ?? 0} total policies issued`}
              color="success"
            />
            <StatCard
              title="Pending Claims"
              value={stats.pendingClaims ?? 0}
              icon={<Clock size={24} />}
              subtitle={`${stats.totalClaims ?? 0} total claims lodged`}
              color="warning"
            />
            <StatCard
              title="Total Revenue"
              value={`₹${(stats.totalRevenue || 0).toLocaleString("en-IN")}`}
              icon={<TrendingUp size={24} />}
              subtitle={`${stats.totalPremiumPayments ?? 0} premium payments`}
              color="purple"
            />
          </div>

          {/* Secondary Stats Grid */}
          <div className="stats-grid-secondary">
            <StatCard
              title="Licensed Agents"
              value={stats.totalAgents ?? 0}
              icon={<UserPlus size={20} />}
              color="primary"
            />
            <StatCard
              title="Surveyors"
              value={stats.totalSurveyors ?? 0}
              icon={<Search size={20} />}
              color="primary"
            />
            <StatCard
              title="Branches"
              value={stats.totalBranches ?? 0}
              icon={<Building2 size={20} />}
              color="primary"
            />
            <StatCard
              title="Claims Settled"
              value={`₹${(stats.totalSettledClaims || 0).toLocaleString("en-IN")}`}
              icon={<ClipboardCheck size={20} />}
              color="success"
            />
          </div>

          {/* Recent Activities Section */}
          <div className="dashboard-tables-grid">
            {/* Recent Policies */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>Recent Policies</h3>
                <Link to="/policies" className="card-link">
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              <div className="table-responsive">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Policy No</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Premium</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recentPolicies || []).map((p) => (
                      <tr key={p.policy_id}>
                        <td className="font-mono font-medium">{p.policy_no}</td>
                        <td>{p.customer_name}</td>
                        <td>{p.policy_name}</td>
                        <td>₹{parseFloat(p.premium_amt || 0).toLocaleString("en-IN")}</td>
                        <td><StatusBadge status={p.policy_status} /></td>
                      </tr>
                    ))}
                    {(data?.recentPolicies || []).length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">No recent policies</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Claims */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>Recent Claims</h3>
                <Link to="/claims" className="card-link">
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              <div className="table-responsive">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Claim ID</th>
                      <th>Policy No</th>
                      <th>Claim Amount</th>
                      <th>Approved</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recentClaims || []).map((c) => (
                      <tr key={c.claim_id}>
                        <td className="font-mono">#{c.claim_id}</td>
                        <td className="font-mono">{c.policy_no}</td>
                        <td>₹{parseFloat(c.claim_amount || 0).toLocaleString("en-IN")}</td>
                        <td>₹{parseFloat(c.approve_amt || 0).toLocaleString("en-IN")}</td>
                        <td><StatusBadge status={c.claim_status} /></td>
                      </tr>
                    ))}
                    {(data?.recentClaims || []).length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">No recent claims</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===================================================================
          2. CUSTOMER DASHBOARD
          =================================================================== */}
      {role === "CUSTOMER" && (
        <>
          <div className="stats-grid-container">
            <StatCard
              title="Active Policies"
              value={stats.activePolicies ?? 0}
              icon={<ShieldCheck size={24} />}
              subtitle={`${stats.totalPolicies ?? 0} total enrolled policies`}
              color="success"
            />
            <StatCard
              title="Total Claims"
              value={stats.totalClaims ?? 0}
              icon={<ClipboardCheck size={24} />}
              subtitle={`${stats.pendingClaims ?? 0} pending resolution`}
              color="primary"
            />
            <StatCard
              title="Premium Paid"
              value={`₹${(stats.totalPremiumPaid || 0).toLocaleString("en-IN")}`}
              icon={<CreditCard size={24} />}
              subtitle={`${stats.totalPayments ?? 0} payment receipts`}
              color="purple"
            />
            <StatCard
              title="Nominees"
              value={stats.totalNominees ?? 0}
              icon={<Users size={24} />}
              subtitle={`${stats.totalDocuments ?? 0} verified documents`}
              color="primary"
            />
          </div>

          <div className="dashboard-tables-grid">
            {/* Customer's Policies */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>My Policies</h3>
                <Link to="/policies" className="card-link">View All <ArrowRight size={14} /></Link>
              </div>
              <div className="table-responsive">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Policy No</th>
                      <th>Plan</th>
                      <th>Premium</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recentPolicies || []).map((p) => (
                      <tr key={p.policy_id}>
                        <td className="font-mono">{p.policy_no}</td>
                        <td>{p.policy_name}</td>
                        <td>₹{parseFloat(p.premium_amt || 0).toLocaleString("en-IN")}</td>
                        <td><StatusBadge status={p.policy_status} /></td>
                      </tr>
                    ))}
                    {(data?.recentPolicies || []).length === 0 && (
                      <tr><td colSpan="4" className="text-center py-4 text-muted">No policies registered yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer's Claims */}
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>My Claims Status</h3>
                <Link to="/claims" className="card-link">View All <ArrowRight size={14} /></Link>
              </div>
              <div className="table-responsive">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Policy No</th>
                      <th>Claim Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recentClaims || []).map((c) => (
                      <tr key={c.claim_id}>
                        <td className="font-mono">{c.policy_no}</td>
                        <td>{formatDate(c.claim_date)}</td>
                        <td>₹{parseFloat(c.claim_amount || 0).toLocaleString("en-IN")}</td>
                        <td><StatusBadge status={c.claim_status} /></td>
                      </tr>
                    ))}
                    {(data?.recentClaims || []).length === 0 && (
                      <tr><td colSpan="4" className="text-center py-4 text-muted">No claims filed</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===================================================================
          3. AGENT DASHBOARD
          =================================================================== */}
      {role === "AGENT" && (
        <>
          <div className="stats-grid-container">
            <StatCard
              title="Handled Policies"
              value={stats.totalAssignedPolicies ?? 0}
              icon={<ShieldCheck size={24} />}
              subtitle={`${stats.activePolicies ?? 0} currently active`}
              color="primary"
            />
            <StatCard
              title="Assigned Clients"
              value={stats.assignedCustomers ?? 0}
              icon={<Users size={24} />}
              subtitle="Registered policyholders"
              color="success"
            />
            <StatCard
              title="Client Claims"
              value={stats.totalClaims ?? 0}
              icon={<ClipboardCheck size={24} />}
              subtitle={`${stats.pendingClaims ?? 0} pending settlement`}
              color="warning"
            />
            <StatCard
              title="Payments Processed"
              value={stats.totalPayments ?? 0}
              icon={<CreditCard size={24} />}
              subtitle="Linked premium collections"
              color="purple"
            />
          </div>

          <div className="dashboard-tables-grid">
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>Policies Managed by You</h3>
                <Link to="/policies" className="card-link">View All <ArrowRight size={14} /></Link>
              </div>
              <div className="table-responsive">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Policy No</th>
                      <th>Client Name</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recentPolicies || []).map((p) => (
                      <tr key={p.policy_id}>
                        <td className="font-mono">{p.policy_no}</td>
                        <td>{p.customer_name}</td>
                        <td>{p.policy_name}</td>
                        <td><StatusBadge status={p.policy_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card-header">
                <h3>Client Claims</h3>
                <Link to="/claims" className="card-link">View All <ArrowRight size={14} /></Link>
              </div>
              <div className="table-responsive">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Policy No</th>
                      <th>Customer</th>
                      <th>Claim Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recentClaims || []).map((c) => (
                      <tr key={c.claim_id}>
                        <td className="font-mono">{c.policy_no}</td>
                        <td>{c.customer_name}</td>
                        <td>₹{parseFloat(c.claim_amount || 0).toLocaleString("en-IN")}</td>
                        <td><StatusBadge status={c.claim_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===================================================================
          4. SURVEYOR DASHBOARD
          =================================================================== */}
      {role === "SURVEYOR" && (
        <>
          <div className="stats-grid-container">
            <StatCard
              title="Assigned Claims"
              value={stats.totalAssignedClaims ?? 0}
              icon={<Search size={24} />}
              subtitle="Assigned for inspection"
              color="primary"
            />
            <StatCard
              title="Pending Inspection"
              value={stats.pendingInspection ?? 0}
              icon={<Clock size={24} />}
              subtitle="Requires damage evaluation"
              color="warning"
            />
            <StatCard
              title="Approved Claims"
              value={stats.approvedClaims ?? 0}
              icon={<ClipboardCheck size={24} />}
              subtitle="Inspection complete"
              color="success"
            />
            <StatCard
              title="Approved Sum"
              value={`₹${(stats.totalApprovedAmt || 0).toLocaleString("en-IN")}`}
              icon={<TrendingUp size={24} />}
              subtitle="Recommended settlement"
              color="purple"
            />
          </div>

          <div className="dash-card" style={{ marginTop: "24px" }}>
            <div className="dash-card-header">
              <h3>Claims Requiring Your Inspection</h3>
              <Link to="/claims" className="card-link">Open Claims Console <ArrowRight size={14} /></Link>
            </div>
            <div className="table-responsive">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Policy No</th>
                    <th>Policyholder</th>
                    <th>Claim Date</th>
                    <th>Claimed Amount</th>
                    <th>Approved Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.assignedClaims || []).map((c) => (
                    <tr key={c.claim_id}>
                      <td className="font-mono">#{c.claim_id}</td>
                      <td className="font-mono">{c.policy_no}</td>
                      <td>{c.customer_name} ({c.customer_mobile || "—"})</td>
                      <td>{formatDate(c.claim_date)}</td>
                      <td>₹{parseFloat(c.claim_amount || 0).toLocaleString("en-IN")}</td>
                      <td>₹{parseFloat(c.approve_amt || 0).toLocaleString("en-IN")}</td>
                      <td><StatusBadge status={c.claim_status} /></td>
                    </tr>
                  ))}
                  {(data?.assignedClaims || []).length === 0 && (
                    <tr><td colSpan="7" className="text-center py-4 text-muted">No claims assigned to you yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;