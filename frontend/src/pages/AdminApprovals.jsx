import { useState, useEffect } from "react";
import { Check, X, Eye, UserCheck, ShieldAlert, Clock, Building2, Search, CheckCircle2 } from "lucide-react";
import { getPendingApprovals, approveUser, rejectUser } from "../services/userService";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatDate } from "../utils/dateUtils";

const AdminApprovals = () => {
  const [approvals, setApprovals] = useState([]);
  const [activeTab, setActiveTab] = useState("AGENT"); // 'AGENT' | 'SURVEYOR'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ type: "approve", user: null });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPendingApprovals();
      setApprovals(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch pending applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const filteredApprovals = approvals.filter((a) => a.role === activeTab);

  const handleOpenConfirm = (actionType, userRecord) => {
    setConfirmAction({ type: actionType, user: userRecord });
    setIsConfirmOpen(true);
  };

  const handleActionExecute = async () => {
    if (!confirmAction.user) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === "approve") {
        await approveUser(confirmAction.user.user_id);
        setSuccessMsg(`Approved ${confirmAction.user.role.toLowerCase()} application for ${confirmAction.user.agent_name || confirmAction.user.surveyor_name || confirmAction.user.email}.`);
      } else {
        await rejectUser(confirmAction.user.user_id);
        setSuccessMsg(`Rejected ${confirmAction.user.role.toLowerCase()} application for ${confirmAction.user.agent_name || confirmAction.user.surveyor_name || confirmAction.user.email}.`);
      }
      setIsConfirmOpen(false);
      fetchPending();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${confirmAction.type} application.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleView = (userRecord) => {
    setSelectedUser(userRecord);
    setIsViewOpen(true);
  };

  const agentColumns = [
    { header: "Applicant", accessor: "agent_name", render: (val, row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{val}</div>
        <div style={{ fontSize: "12px", color: "#64748b" }}>{row.email}</div>
      </div>
    )},
    { header: "License No", accessor: "agent_license", render: (val) => <span className="font-mono">{val || "—"}</span> },
    { header: "Contact", accessor: "agent_mobile" },
    { header: "Assigned Branch", accessor: "branch_name_1", render: (val, row) => val ? `${val} (${row.branch_city || ""})` : "Unassigned" },
    { header: "Application Date", accessor: "created_at", render: (val) => formatDate(val) },
    { header: "Status", accessor: "status", render: (val) => <StatusBadge status={val} /> }
  ];

  const surveyorColumns = [
    { header: "Applicant", accessor: "surveyor_name", render: (val, row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{val}</div>
        <div style={{ fontSize: "12px", color: "#64748b" }}>{row.email}</div>
      </div>
    )},
    { header: "License No", accessor: "surveyor_license", render: (val) => <span className="font-mono">{val || "—"}</span> },
    { header: "Phone", accessor: "surveyor_phone" },
    { header: "Experience", accessor: "surveyor_experience", render: (val) => `${val || 0} years` },
    { header: "Application Date", accessor: "created_at", render: (val) => formatDate(val) },
    { header: "Status", accessor: "status", render: (val) => <StatusBadge status={val} /> }
  ];

  const pendingAgentsCount = approvals.filter((a) => a.role === "AGENT").length;
  const pendingSurveyorsCount = approvals.filter((a) => a.role === "SURVEYOR").length;

  return (
    <div className="admin-approvals-page">
      <PageHeader
        title="Agent & Surveyor Approvals"
        description="Review pending account applications from prospective agents and claim surveyors"
        badge="SECURITY GATEWAY"
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

      {successMsg && (
        <div className="status-badge badge-success" style={{ display: "flex", gap: "8px", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "13.5px" }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="auth-tabs" style={{ maxWidth: "420px", marginBottom: "20px" }}>
        <button
          type="button"
          className={`auth-tab ${activeTab === "AGENT" ? "active" : ""}`}
          onClick={() => setActiveTab("AGENT")}
        >
          Pending Agents ({pendingAgentsCount})
        </button>
        <button
          type="button"
          className={`auth-tab ${activeTab === "SURVEYOR" ? "active" : ""}`}
          onClick={() => setActiveTab("SURVEYOR")}
        >
          Pending Surveyors ({pendingSurveyorsCount})
        </button>
      </div>

      <DataTable
        columns={activeTab === "AGENT" ? agentColumns : surveyorColumns}
        data={filteredApprovals}
        keyField="user_id"
        loading={loading}
        emptyMessage={`No pending ${activeTab.toLowerCase()} applications to review.`}
        actions={(row) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleView(row)}
              title="Inspect Application"
            >
              <Eye size={15} />
            </button>
            <button
              type="button"
              className="btn btn-success btn-sm"
              onClick={() => handleOpenConfirm("approve", row)}
              title="Approve Application"
            >
              <Check size={15} />
              <span>Approve</span>
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => handleOpenConfirm("reject", row)}
              title="Reject Application"
            >
              <X size={15} />
              <span>Reject</span>
            </button>
          </div>
        )}
      />

      {/* ================= VIEW APPLICATION DETAILS MODAL ================= */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Application Credentials & Verification Details"
        maxWidth="640px"
      >
        {selectedUser && (
          <div>
            <div className="detail-card">
              <h4 className="detail-card-title">{selectedUser.role} Application Details</h4>
              <div className="grid-2">
                <div className="detail-row"><span className="detail-label">Full Name:</span><span className="detail-value font-medium">{selectedUser.agent_name || selectedUser.surveyor_name}</span></div>
                <div className="detail-row"><span className="detail-label">Account Role:</span><span className="detail-value">{selectedUser.role}</span></div>
                <div className="detail-row"><span className="detail-label">Email:</span><span className="detail-value">{selectedUser.email}</span></div>
                <div className="detail-row"><span className="detail-label">Phone:</span><span className="detail-value">{selectedUser.agent_mobile || selectedUser.surveyor_phone || "—"}</span></div>
                <div className="detail-row"><span className="detail-label">License Number:</span><span className="detail-value font-mono">{selectedUser.agent_license || selectedUser.surveyor_license || "—"}</span></div>
                {selectedUser.role === "AGENT" ? (
                  <div className="detail-row"><span className="detail-label">Assigned Branch:</span><span className="detail-value">{selectedUser.branch_name_1 || "Unassigned"} ({selectedUser.branch_city || ""})</span></div>
                ) : (
                  <div className="detail-row"><span className="detail-label">Experience:</span><span className="detail-value">{selectedUser.surveyor_experience || 0} years</span></div>
                )}
                <div className="detail-row"><span className="detail-label">Submission Date:</span><span className="detail-value">{new Date(selectedUser.created_at).toLocaleString()}</span></div>
                <div className="detail-row"><span className="detail-label">Status:</span><span className="detail-value"><StatusBadge status={selectedUser.status} /></span></div>
              </div>
            </div>

            <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsViewOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  setIsViewOpen(false);
                  handleOpenConfirm("reject", selectedUser);
                }}
              >
                Reject Application
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={() => {
                  setIsViewOpen(false);
                  handleOpenConfirm("approve", selectedUser);
                }}
              >
                Approve & Activate Account
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= CONFIRM APPROVE / REJECT DIALOG ================= */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleActionExecute}
        title={confirmAction.type === "approve" ? "Approve User Application" : "Reject User Application"}
        message={
          confirmAction.type === "approve"
            ? `Are you sure you want to approve ${confirmAction.user?.agent_name || confirmAction.user?.surveyor_name || confirmAction.user?.email}? Once approved, they will immediately be able to log in.`
            : `Are you sure you want to reject the application for ${confirmAction.user?.agent_name || confirmAction.user?.surveyor_name || confirmAction.user?.email}? They will be blocked from accessing the system.`
        }
        confirmText={confirmAction.type === "approve" ? "Approve Account" : "Reject Account"}
        isDanger={confirmAction.type === "reject"}
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminApprovals;
