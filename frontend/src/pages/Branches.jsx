import { useState, useEffect } from "react";
import { Plus, Eye, Edit, Trash2, Building2, Users, CheckCircle2 } from "lucide-react";
import {
  getBranches,
  getBranchById,
  getBranchAgents,
  createBranch,
  updateBranch,
  deleteBranch
} from "../services/branchService";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import FormInput from "../components/FormInput";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";

const Branches = () => {
  const { role } = useAuth();
  const isAdmin = role === "ADMIN";

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchAgents, setBranchAgents] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const initialForm = {
    branch_name_1: "",
    city: "",
    state: "",
    phone: "",
    manager_name: ""
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchBranchesList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getBranches({ search });
      setBranches(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch branch offices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchesList();
  }, [search]);

  const handleView = async (branch) => {
    setSelectedBranch(branch);
    setIsViewOpen(true);
    setDetailsLoading(true);
    try {
      const agents = await getBranchAgents(branch.branch_id);
      setBranchAgents(agents);
    } catch (err) {
      console.error("Error fetching branch agents:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenEdit = (branch) => {
    setSelectedBranch(branch);
    setFormData({
      branch_name_1: branch.branch_name_1 || "",
      city: branch.city || "",
      state: branch.state || "",
      phone: branch.phone || "",
      manager_name: branch.manager_name || ""
    });
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createBranch(formData);
      setIsCreateOpen(false);
      setFormData(initialForm);
      fetchBranchesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create branch.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updateBranch(selectedBranch.branch_id, formData);
      setIsEditOpen(false);
      fetchBranchesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update branch.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBranch) return;
    setActionLoading(true);
    try {
      const res = await deleteBranch(selectedBranch.branch_id);
      setIsDeleteOpen(false);
      setSuccessMsg(res?.message || `Branch "${selectedBranch.branch_name_1}" deleted successfully.`);
      setTimeout(() => setSuccessMsg(""), 4000);
      fetchBranchesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete branch.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: "Branch ID", accessor: "branch_id", sortable: true, style: { width: "90px" }, render: (val) => <span className="font-mono">#{val}</span> },
    { header: "Branch Office Name", accessor: "branch_name_1", render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { header: "City & State", accessor: "city", render: (_, row) => `${row.city || ""}, ${row.state || ""}` },
    { header: "Manager Name", accessor: "manager_name", render: (val) => val || "—" },
    { header: "Contact Phone", accessor: "phone", render: (val) => val || "—" },
    { header: "Staff Agents", accessor: "agent_count", render: (val) => <span className="font-mono font-medium">{val || 0}</span> }
  ];

  return (
    <div className="branches-page">
      <PageHeader
        title="Branch Office Network"
        description="Physical branch locations, regional managers, and assigned agent rosters"
        actions={
          isAdmin && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setFormData(initialForm);
                setIsCreateOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Open New Branch</span>
            </button>
          )
        }
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

      {successMsg && (
        <div
          className="status-badge badge-success"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "14px"
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by branch name, city, or manager..."
        />
      </div>

      <DataTable
        columns={columns}
        data={branches}
        keyField="branch_id"
        loading={loading}
        emptyMessage="No branch records found."
        actions={(row) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleView(row)}
              title="View Branch Details & Agents"
            >
              <Eye size={15} />
            </button>
            {isAdmin && (
              <>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleOpenEdit(row)}
                  title="Edit Branch"
                >
                  <Edit size={15} />
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ color: "#dc2626" }}
                  onClick={() => {
                    setSelectedBranch(row);
                    setIsDeleteOpen(true);
                  }}
                  title="Delete Branch"
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        )}
      />

      {/* ================= VIEW BRANCH MODAL ================= */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Branch: ${selectedBranch?.branch_name_1 || ""}`}
        maxWidth="720px"
      >
        {selectedBranch && (
          <div>
            <div className="detail-card">
              <h4 className="detail-card-title">Branch Overview</h4>
              <div className="grid-2">
                <div className="detail-row"><span className="detail-label">Branch ID:</span><span className="detail-value font-mono">#{selectedBranch.branch_id}</span></div>
                <div className="detail-row"><span className="detail-label">Branch Name:</span><span className="detail-value font-medium">{selectedBranch.branch_name_1}</span></div>
                <div className="detail-row"><span className="detail-label">City, State:</span><span className="detail-value">{selectedBranch.city || "—"}, {selectedBranch.state || "—"}</span></div>
                <div className="detail-row"><span className="detail-label">Manager:</span><span className="detail-value">{selectedBranch.manager_name || "—"}</span></div>
                <div className="detail-row"><span className="detail-label">Phone:</span><span className="detail-value">{selectedBranch.phone || "—"}</span></div>
              </div>
            </div>

            {/* Agents at Branch */}
            <div className="detail-card">
              <h4 className="detail-card-title">Stationed Agents ({branchAgents.length})</h4>
              {detailsLoading ? (
                <LoadingSpinner text="Fetching agents..." size={20} />
              ) : branchAgents.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "13.5px" }}>No agents assigned to this branch yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="dash-table">
                    <thead>
                      <tr><th>Agent ID</th><th>Name</th><th>Email</th><th>Mobile</th><th>License</th></tr>
                    </thead>
                    <tbody>
                      {branchAgents.map((a) => (
                        <tr key={a.agent_id}>
                          <td className="font-mono">#{a.agent_id}</td>
                          <td>{a.agent_name}</td>
                          <td>{a.email}</td>
                          <td>{a.mobile_no || "—"}</td>
                          <td className="font-mono">{a.license_no || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ================= CREATE BRANCH MODAL ================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Open New Branch Office"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateSubmit}>
          <FormInput
            label="Branch Name"
            name="branch_name_1"
            value={formData.branch_name_1}
            onChange={(e) => setFormData({ ...formData, branch_name_1: e.target.value })}
            placeholder="e.g. South Mumbai Regional Branch"
            required
          />

          <div className="grid-2">
            <FormInput
              label="City"
              name="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <FormInput
              label="State"
              name="state"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="Branch Phone"
              name="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <FormInput
              label="Manager Name"
              name="manager_name"
              value={formData.manager_name}
              onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? "Creating..." : "Save Branch"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= EDIT BRANCH MODAL ================= */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Branch Office Details"
        maxWidth="600px"
      >
        <form onSubmit={handleEditSubmit}>
          <FormInput
            label="Branch Name"
            name="branch_name_1"
            value={formData.branch_name_1}
            onChange={(e) => setFormData({ ...formData, branch_name_1: e.target.value })}
            required
          />

          <div className="grid-2">
            <FormInput
              label="City"
              name="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <FormInput
              label="State"
              name="state"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="Branch Phone"
              name="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <FormInput
              label="Manager Name"
              name="manager_name"
              value={formData.manager_name}
              onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
            />
          </div>

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
              {actionLoading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= DELETE CONFIRM DIALOG ================= */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Branch"
        message={`Are you sure you want to delete branch ${selectedBranch?.branch_name_1}? Assigned agents will be unlinked.`}
        confirmText="Confirm Deletion"
        isDanger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default Branches;
