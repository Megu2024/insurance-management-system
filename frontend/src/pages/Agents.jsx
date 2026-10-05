import { useState, useEffect } from "react";
import { Plus, Eye, Edit, Trash2, Building2, ShieldCheck, Users } from "lucide-react";
import {
  getAgents,
  getAgentById,
  getAgentPolicies,
  getAgentCustomers,
  createAgent,
  updateAgent,
  deleteAgent
} from "../services/agentService";
import { getBranches } from "../services/branchService";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import FormInput from "../components/FormInput";
import SelectInput from "../components/SelectInput";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import StatusBadge from "../components/StatusBadge";

const Agents = () => {
  const { role } = useAuth();
  const isAdmin = role === "ADMIN";

  const [agents, setAgents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Selected agent for view/edit/delete
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentPolicies, setAgentPolicies] = useState([]);
  const [agentCustomers, setAgentCustomers] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form State
  const initialForm = {
    agent_name: "",
    email: "",
    mobile_no: "",
    license_no: "",
    branch_id: ""
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchAgentsList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAgents({ search, branch_id: branchFilter });
      setAgents(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch agents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentsList();
  }, [search, branchFilter]);

  useEffect(() => {
    getBranches()
      .then((data) => setBranches(data))
      .catch(console.error);
  }, []);

  // View Agent Details & Portfolio
  const handleView = async (agent) => {
    setSelectedAgent(agent);
    setIsViewOpen(true);
    setDetailsLoading(true);
    try {
      const [policies, clients] = await Promise.all([
        getAgentPolicies(agent.agent_id),
        getAgentCustomers(agent.agent_id)
      ]);
      setAgentPolicies(policies);
      setAgentCustomers(clients);
    } catch (err) {
      console.error("Error fetching agent portfolio:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenEdit = (agent) => {
    setSelectedAgent(agent);
    setFormData({
      agent_name: agent.agent_name || "",
      email: agent.email || "",
      mobile_no: agent.mobile_no || "",
      license_no: agent.license_no || "",
      branch_id: agent.branch_id || ""
    });
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createAgent(formData);
      setIsCreateOpen(false);
      setFormData(initialForm);
      fetchAgentsList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create agent.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updateAgent(selectedAgent.agent_id, formData);
      setIsEditOpen(false);
      fetchAgentsList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update agent.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAgent) return;
    setActionLoading(true);
    try {
      await deleteAgent(selectedAgent.agent_id);
      setIsDeleteOpen(false);
      fetchAgentsList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete agent.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: "Agent ID", accessor: "agent_id", sortable: true, style: { width: "90px" }, render: (val) => <span className="font-mono">#{val}</span> },
    { header: "Agent Name", accessor: "agent_name", render: (val, row) => (
      <div>
        <div style={{ fontWeight: 600, color: "#0f172a" }}>{val}</div>
        <div style={{ fontSize: "12px", color: "#64748b" }}>{row.email}</div>
      </div>
    )},
    { header: "Mobile", accessor: "mobile_no" },
    { header: "License No", accessor: "license_no", render: (val) => <span className="font-mono">{val || "—"}</span> },
    { header: "Branch Office", accessor: "branch_name_1", render: (val, row) => val ? `${val} (${row.branch_city || ""})` : <span style={{ color: "#94a3b8" }}>Unassigned</span> },
    { header: "Policies Sold", accessor: "total_policies", render: (val) => <span className="font-mono font-medium">{val || 0}</span> }
  ];

  return (
    <div className="agents-page">
      <PageHeader
        title="Insurance Agents Directory"
        description="Management of licensed sales agents, branch allocations, and portfolio production"
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
              <span>Register New Agent</span>
            </button>
          )
        }
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by agent name, email, or license..."
        />

        <div className="filter-group">
          <select
            className="filter-select"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.branch_id} value={b.branch_id}>
                {b.branch_name_1} ({b.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={agents}
        keyField="agent_id"
        loading={loading}
        emptyMessage="No agents registered."
        actions={(row) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleView(row)}
              title="View Agent Performance & Portfolio"
            >
              <Eye size={15} />
            </button>
            {isAdmin && (
              <>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleOpenEdit(row)}
                  title="Edit Agent"
                >
                  <Edit size={15} />
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ color: "#dc2626" }}
                  onClick={() => {
                    setSelectedAgent(row);
                    setIsDeleteOpen(true);
                  }}
                  title="Delete Agent"
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        )}
      />

      {/* ================= VIEW AGENT MODAL ================= */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Agent Details: ${selectedAgent?.agent_name || ""}`}
        maxWidth="760px"
      >
        {selectedAgent && (
          <div>
            <div className="detail-card">
              <h4 className="detail-card-title">Agent Profile & License</h4>
              <div className="grid-2">
                <div className="detail-row"><span className="detail-label">Agent ID:</span><span className="detail-value font-mono">#{selectedAgent.agent_id}</span></div>
                <div className="detail-row"><span className="detail-label">Full Name:</span><span className="detail-value font-medium">{selectedAgent.agent_name}</span></div>
                <div className="detail-row"><span className="detail-label">Email:</span><span className="detail-value">{selectedAgent.email}</span></div>
                <div className="detail-row"><span className="detail-label">Mobile:</span><span className="detail-value">{selectedAgent.mobile_no || "—"}</span></div>
                <div className="detail-row"><span className="detail-label">License Number:</span><span className="detail-value font-mono">{selectedAgent.license_no || "—"}</span></div>
                <div className="detail-row"><span className="detail-label">Branch Office:</span><span className="detail-value">{selectedAgent.branch_name_1 || "Unassigned"}</span></div>
              </div>
            </div>

            {/* Managed Policies */}
            <div className="detail-card">
              <h4 className="detail-card-title">Policies Handled by Agent ({agentPolicies.length})</h4>
              {detailsLoading ? (
                <LoadingSpinner text="Fetching policies..." size={20} />
              ) : agentPolicies.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "13.5px" }}>No policies issued by this agent yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="dash-table">
                    <thead>
                      <tr><th>Policy No</th><th>Customer</th><th>Plan</th><th>Coverage</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {agentPolicies.map((p) => (
                        <tr key={p.policy_id}>
                          <td className="font-mono">{p.policy_no}</td>
                          <td>{p.customer_name}</td>
                          <td>{p.policy_name}</td>
                          <td>₹{parseFloat(p.sum_coverage || 0).toLocaleString("en-IN")}</td>
                          <td><StatusBadge status={p.policy_status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Handled Clients */}
            <div className="detail-card">
              <h4 className="detail-card-title">Assigned Clients ({agentCustomers.length})</h4>
              {agentCustomers.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "13.5px" }}>No customers linked to this agent.</p>
              ) : (
                <div className="table-responsive">
                  <table className="dash-table">
                    <thead>
                      <tr><th>Client Name</th><th>Email</th><th>Mobile</th><th>City</th></tr>
                    </thead>
                    <tbody>
                      {agentCustomers.map((c) => (
                        <tr key={c.customer_id}>
                          <td>{c.first_name} {c.last_name}</td>
                          <td>{c.email}</td>
                          <td>{c.mobile_no || "—"}</td>
                          <td>{c.city || "—"}</td>
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

      {/* ================= CREATE AGENT MODAL ================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Insurance Agent"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateSubmit}>
          <FormInput
            label="Agent Full Name"
            name="agent_name"
            value={formData.agent_name}
            onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
            required
          />

          <div className="grid-2">
            <FormInput
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <FormInput
              label="Mobile Number"
              name="mobile_no"
              value={formData.mobile_no}
              onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="License Number"
              name="license_no"
              value={formData.license_no}
              onChange={(e) => setFormData({ ...formData, license_no: e.target.value })}
            />
            <SelectInput
              label="Assigned Branch"
              name="branch_id"
              value={formData.branch_id}
              onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
              options={branches.map((b) => ({
                value: b.branch_id,
                label: `${b.branch_name_1} (${b.city})`
              }))}
              placeholder="Select Branch Office"
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
              {actionLoading ? "Registering..." : "Create Agent"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= EDIT AGENT MODAL ================= */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Agent Details"
        maxWidth="600px"
      >
        <form onSubmit={handleEditSubmit}>
          <FormInput
            label="Agent Full Name"
            name="agent_name"
            value={formData.agent_name}
            onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
            required
          />

          <div className="grid-2">
            <FormInput
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <FormInput
              label="Mobile Number"
              name="mobile_no"
              value={formData.mobile_no}
              onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="License Number"
              name="license_no"
              value={formData.license_no}
              onChange={(e) => setFormData({ ...formData, license_no: e.target.value })}
            />
            <SelectInput
              label="Assigned Branch"
              name="branch_id"
              value={formData.branch_id}
              onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
              options={branches.map((b) => ({
                value: b.branch_id,
                label: `${b.branch_name_1} (${b.city})`
              }))}
              placeholder="Select Branch Office"
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
        title="Delete Agent"
        message={`Are you sure you want to delete agent ${selectedAgent?.agent_name}?`}
        confirmText="Confirm Deletion"
        isDanger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default Agents;
