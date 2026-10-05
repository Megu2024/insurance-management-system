import { useState, useEffect } from "react";
import { Users, Trash2, Edit, Check, X, Shield, Lock } from "lucide-react";
import { getUsers, updateUserStatus, deleteUser } from "../services/userService";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import SelectInput from "../components/SelectInput";
import ErrorMessage from "../components/ErrorMessage";
import { formatDate } from "../utils/dateUtils";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [newStatus, setNewStatus] = useState("APPROVED");

  const fetchUsersList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getUsers({ search, role: roleFilter, status: statusFilter });
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch system users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, [search, roleFilter, statusFilter]);

  const handleOpenEdit = (u) => {
    setSelectedUser(u);
    setNewStatus(u.status);
    setIsEditOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updateUserStatus(selectedUser.user_id, newStatus);
      setIsEditOpen(false);
      fetchUsersList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update user status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await deleteUser(selectedUser.user_id);
      setIsDeleteOpen(false);
      fetchUsersList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete user account.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: "User ID", accessor: "user_id", sortable: true, style: { width: "80px" }, render: (val) => <span className="font-mono">#{val}</span> },
    { header: "Account Name / Email", accessor: "email", render: (val, row) => (
      <div>
        <div style={{ fontWeight: 600, color: "#0f172a" }}>{row.full_name || row.username}</div>
        <div style={{ fontSize: "12px", color: "#64748b" }}>{val}</div>
      </div>
    )},
    { header: "Assigned Role", accessor: "role", render: (val) => (
      <span style={{ fontWeight: 600, color: val === "ADMIN" ? "#7c3aed" : val === "CUSTOMER" ? "#059669" : val === "AGENT" ? "#2563eb" : "#d97706" }}>
        {val}
      </span>
    )},
    { header: "Account Status", accessor: "status", render: (val) => <StatusBadge status={val} /> },
    { header: "Linked Identity", render: (_, row) => (
      <div style={{ fontSize: "12px", color: "#64748b" }}>
        {row.customer_id ? `Customer #${row.customer_id}` : row.agent_id ? `Agent #${row.agent_id}` : row.surveyor_id ? `Surveyor #${row.surveyor_id}` : "System Admin"}
      </div>
    )},
    { header: "Created Date", accessor: "created_at", render: (val) => formatDate(val) }
  ];

  return (
    <div className="users-page">
      <PageHeader
        title="System User Accounts"
        description="Comprehensive authentication accounts, role enforcement, and login status management"
        badge="ADMIN PRIVILEGED"
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by email, username, or full name..."
        />

        <div className="filter-group">
          <select
            className="filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="CUSTOMER">CUSTOMER</option>
            <option value="AGENT">AGENT</option>
            <option value="SURVEYOR">SURVEYOR</option>
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="APPROVED">Approved / Active</option>
            <option value="PENDING">Pending Approval</option>
            <option value="REJECTED">Rejected / Blocked</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        keyField="user_id"
        loading={loading}
        emptyMessage="No user accounts match your filters."
        actions={(row) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleOpenEdit(row)}
              title="Edit Account Status"
            >
              <Edit size={15} />
            </button>
            {row.role !== "ADMIN" && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: "#dc2626" }}
                onClick={() => {
                  setSelectedUser(row);
                  setIsDeleteOpen(true);
                }}
                title="Delete Account"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      />

      {/* ================= EDIT STATUS MODAL ================= */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Manage Account Lifecycle Status"
        maxWidth="500px"
      >
        <form onSubmit={handleStatusSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontSize: "14px", color: "#64748b" }}>User Account:</span>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a" }}>
              {selectedUser?.full_name} ({selectedUser?.email})
            </div>
            <div style={{ fontSize: "13px", color: "#2563eb", marginTop: "2px" }}>
              Role: {selectedUser?.role}
            </div>
          </div>

          <SelectInput
            label="Account Status"
            name="newStatus"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            options={[
              { value: "APPROVED", label: "APPROVED / ACTIVE (Permit Login)" },
              { value: "PENDING", label: "PENDING (Under Verification)" },
              { value: "REJECTED", label: "REJECTED / SUSPENDED (Block Login)" }
            ]}
            required
          />

          <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? "Updating..." : "Save Status"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= DELETE CONFIRM DIALOG ================= */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete authentication login credentials for ${selectedUser?.email}?`}
        confirmText="Confirm Account Deletion"
        isDanger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default UserManagement;
