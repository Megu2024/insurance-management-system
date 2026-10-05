import { useState, useEffect } from "react";
import { Plus, Eye, Edit, Trash2, ShieldCheck, Car, Home, Briefcase, Users, CreditCard, AlertCircle } from "lucide-react";
import {
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy
} from "../services/policyService";
import { getCustomers } from "../services/customerService";
import { getPolicyTypes } from "../services/policyTypeService";
import { getAgents } from "../services/agentService";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import FormInput from "../components/FormInput";
import SelectInput from "../components/SelectInput";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatDate } from "../utils/dateUtils";

const Policies = () => {
  const { role, user } = useAuth();
  const isAdmin = role === "ADMIN";
  const isAgent = role === "AGENT";
  const isCustomer = role === "CUSTOMER";

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Dropdown reference lists
  const [customers, setCustomers] = useState([]);
  const [policyTypes, setPolicyTypes] = useState([]);
  const [agents, setAgents] = useState([]);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  // Form State
  const initialForm = {
    customer_id: "",
    policy_type_id: "",
    agent_id: "",
    policy_no: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    premium_amt: "",
    sum_coverage: "",
    payment_freq: "Monthly",
    policy_status: "ACTIVE"
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchPoliciesList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPolicies({ search, status: statusFilter });
      setPolicies(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch policies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoliciesList();
  }, [search, statusFilter]);

  // Load dropdown metadata if admin/agent
  useEffect(() => {
    if (isAdmin || isAgent) {
      Promise.all([getCustomers(), getPolicyTypes(), getAgents()])
        .then(([cList, ptList, aList]) => {
          setCustomers(cList);
          setPolicyTypes(ptList);
          setAgents(aList);
        })
        .catch(console.error);
    }
  }, [isAdmin, isAgent]);

  // View Policy Details
  const handleView = async (pol) => {
    setActionLoading(true);
    try {
      const detailed = await getPolicyById(pol.policy_id);
      setSelectedPolicy(detailed);
      setIsViewOpen(true);
    } catch (err) {
      console.error(err);
      setError("Failed to load policy details.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit
  const handleOpenEdit = (pol) => {
    setSelectedPolicy(pol);
    setFormData({
      customer_id: pol.customer_id,
      policy_type_id: pol.policy_type_id,
      agent_id: pol.agent_id || "",
      policy_no: pol.policy_no,
      start_date: pol.start_date ? pol.start_date.split("T")[0] : "",
      end_date: pol.end_date ? pol.end_date.split("T")[0] : "",
      premium_amt: pol.premium_amt,
      sum_coverage: pol.sum_coverage,
      payment_freq: pol.payment_freq || "Monthly",
      policy_status: pol.policy_status || "ACTIVE"
    });
    setIsEditOpen(true);
  };

  // Submit Create
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...formData,
        customer_id: isCustomer ? user.customer_id : formData.customer_id,
        agent_id: isAgent ? user.agent_id : formData.agent_id
      };
      await createPolicy(payload);
      setIsCreateOpen(false);
      setFormData(initialForm);
      fetchPoliciesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create policy.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updatePolicy(selectedPolicy.policy_id, formData);
      setIsEditOpen(false);
      fetchPoliciesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update policy.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Delete
  const handleDeleteConfirm = async () => {
    if (!selectedPolicy) return;
    setActionLoading(true);
    try {
      await deletePolicy(selectedPolicy.policy_id);
      setIsDeleteOpen(false);
      fetchPoliciesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete policy.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: "Policy No", accessor: "policy_no", sortable: true, style: { width: "120px" }, render: (val) => <span className="font-mono font-medium">{val}</span> },
    { header: "Plan / Category", accessor: "policy_name", render: (_, row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{row.policy_name}</div>
        <div style={{ fontSize: "12px", color: "#64748b" }}>{row.category}</div>
      </div>
    )},
    { header: "Policyholder", accessor: "customer_name" },
    { header: "Coverage (₹)", accessor: "sum_coverage", render: (val) => `₹${parseFloat(val || 0).toLocaleString("en-IN")}` },
    { header: "Premium (₹)", accessor: "premium_amt", render: (_, row) => (
      <div>
        <div style={{ fontWeight: 500 }}>₹{parseFloat(row.premium_amt || 0).toLocaleString("en-IN")}</div>
        <div style={{ fontSize: "11px", color: "#64748b" }}>{row.payment_freq}</div>
      </div>
    )},
    { header: "Agent", accessor: "agent_name", render: (val) => val || "Direct / Online" },
    { header: "Status", accessor: "policy_status", render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="policies-page">
      <PageHeader
        title={isCustomer ? "My Insurance Policies" : "Policy Portfolio"}
        description="Comprehensive lifecycle management of issued insurance policies"
        actions={
          (isAdmin || isAgent) && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setFormData(initialForm);
                setIsCreateOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Issue New Policy</span>
            </button>
          )
        }
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by policy no, plan, or customer..."
        />

        <div className="filter-group">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={policies}
        keyField="policy_id"
        loading={loading}
        emptyMessage="No policies found."
        actions={(row) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleView(row)}
              title="View Full Policy Details"
            >
              <Eye size={15} />
            </button>
            {(isAdmin || isAgent) && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => handleOpenEdit(row)}
                title="Edit Policy"
              >
                <Edit size={15} />
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: "#dc2626" }}
                onClick={() => {
                  setSelectedPolicy(row);
                  setIsDeleteOpen(true);
                }}
                title="Delete Policy"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      />

      {/* ================= VIEW POLICY DETAILS MODAL ================= */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Policy Details: ${selectedPolicy?.policy_no || ""}`}
        maxWidth="800px"
      >
        {selectedPolicy && (
          <div>
            <div className="detail-card">
              <h4 className="detail-card-title">Policy & Plan Overview</h4>
              <div className="grid-2">
                <div className="detail-row">
                  <span className="detail-label">Policy Number:</span>
                  <span className="detail-value font-mono font-medium">{selectedPolicy.policy_no}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value"><StatusBadge status={selectedPolicy.policy_status} /></span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Plan Name:</span>
                  <span className="detail-value font-medium">{selectedPolicy.policy_name} ({selectedPolicy.category})</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Policyholder:</span>
                  <span className="detail-value">{selectedPolicy.customer_name} ({selectedPolicy.customer_email})</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Sum Coverage:</span>
                  <span className="detail-value font-medium">₹{parseFloat(selectedPolicy.sum_coverage || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Premium Amount:</span>
                  <span className="detail-value">₹{parseFloat(selectedPolicy.premium_amt || 0).toLocaleString("en-IN")} ({selectedPolicy.payment_freq})</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Validity Period:</span>
                  <span className="detail-value">
                    {formatDate(selectedPolicy.start_date)} to{" "}
                    {formatDate(selectedPolicy.end_date)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Servicing Agent:</span>
                  <span className="detail-value">{selectedPolicy.agent_name || "Direct Channel"}</span>
                </div>
              </div>
            </div>

            {/* Linked Insured Asset */}
            <div className="detail-card">
              <h4 className="detail-card-title">Insured Asset Information</h4>
              {selectedPolicy.vehicle ? (
                <div className="grid-2">
                  <div className="detail-row"><span className="detail-label">Asset:</span><span className="detail-value">🚗 Motor Vehicle</span></div>
                  <div className="detail-row"><span className="detail-label">Reg Number:</span><span className="detail-value font-mono">{selectedPolicy.vehicle.reg_no}</span></div>
                  <div className="detail-row"><span className="detail-label">Make & Model:</span><span className="detail-value">{selectedPolicy.vehicle.manufacturer} {selectedPolicy.vehicle.model}</span></div>
                  <div className="detail-row"><span className="detail-label">Engine No:</span><span className="detail-value font-mono">{selectedPolicy.vehicle.engine_no || "—"}</span></div>
                </div>
              ) : selectedPolicy.property ? (
                <div className="grid-2">
                  <div className="detail-row"><span className="detail-label">Asset:</span><span className="detail-value">🏠 Property / Real Estate</span></div>
                  <div className="detail-row"><span className="detail-label">Type:</span><span className="detail-value">{selectedPolicy.property.property_type}</span></div>
                  <div className="detail-row"><span className="detail-label">Address:</span><span className="detail-value">{selectedPolicy.property.address}, {selectedPolicy.property.city}</span></div>
                  <div className="detail-row"><span className="detail-label">Market Value:</span><span className="detail-value">₹{parseFloat(selectedPolicy.property.market_value || 0).toLocaleString("en-IN")}</span></div>
                </div>
              ) : selectedPolicy.business ? (
                <div className="grid-2">
                  <div className="detail-row"><span className="detail-label">Asset:</span><span className="detail-value">🏢 Commercial Business</span></div>
                  <div className="detail-row"><span className="detail-label">Business Name:</span><span className="detail-value">{selectedPolicy.business.business_name}</span></div>
                  <div className="detail-row"><span className="detail-label">Industry:</span><span className="detail-value">{selectedPolicy.business.industry_type}</span></div>
                  <div className="detail-row"><span className="detail-label">GST No:</span><span className="detail-value font-mono">{selectedPolicy.business.gst_no}</span></div>
                </div>
              ) : (
                <p style={{ color: "#64748b", fontSize: "13.5px" }}>No specific asset attached to this policy (e.g. Life or Health policy).</p>
              )}
            </div>

            {/* Linked Nominees */}
            <div className="detail-card">
              <h4 className="detail-card-title">Policy Nominees ({(selectedPolicy.nominees || []).length})</h4>
              {(selectedPolicy.nominees || []).length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "13.5px" }}>No nominees designated for this policy.</p>
              ) : (
                <div className="table-responsive">
                  <table className="dash-table">
                    <thead>
                      <tr><th>Nominee Name</th><th>Relationship</th><th>Mobile</th></tr>
                    </thead>
                    <tbody>
                      {selectedPolicy.nominees.map((n) => (
                        <tr key={n.nominee_id}>
                          <td>{n.nominee_name}</td>
                          <td>{n.relationship}</td>
                          <td>{n.mobile_no || "—"}</td>
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

      {/* ================= CREATE POLICY MODAL ================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Issue New Insurance Policy"
        maxWidth="720px"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="grid-2">
            {!isCustomer && (
              <SelectInput
                label="Customer / Policyholder"
                name="customer_id"
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                options={customers.map((c) => ({
                  value: c.customer_id,
                  label: `${c.first_name} ${c.last_name} (${c.email})`
                }))}
                required
              />
            )}

            <SelectInput
              label="Policy Plan & Type"
              name="policy_type_id"
              value={formData.policy_type_id}
              onChange={(e) => setFormData({ ...formData, policy_type_id: e.target.value })}
              options={policyTypes.map((pt) => ({
                value: pt.policy_type_id,
                label: `${pt.policy_name} [${pt.category}]`
              }))}
              required
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="Custom Policy Number (Optional)"
              name="policy_no"
              placeholder="Leave blank to auto-generate"
              value={formData.policy_no}
              onChange={(e) => setFormData({ ...formData, policy_no: e.target.value })}
            />
            {!isAgent && (
              <SelectInput
                label="Servicing Agent"
                name="agent_id"
                value={formData.agent_id}
                onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                options={agents.map((a) => ({
                  value: a.agent_id,
                  label: `${a.agent_name} (${a.license_no || "Licensed"})`
                }))}
                placeholder="Direct / Online Policy (No Agent)"
              />
            )}
          </div>

          <div className="grid-2">
            <FormInput
              label="Sum Coverage Amount (₹)"
              name="sum_coverage"
              type="number"
              min="0"
              placeholder="e.g. 500000"
              value={formData.sum_coverage}
              onChange={(e) => setFormData({ ...formData, sum_coverage: e.target.value })}
              required
            />
            <FormInput
              label="Premium Amount (₹)"
              name="premium_amt"
              type="number"
              min="0"
              placeholder="e.g. 12000"
              value={formData.premium_amt}
              onChange={(e) => setFormData({ ...formData, premium_amt: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <SelectInput
              label="Payment Frequency"
              name="payment_freq"
              value={formData.payment_freq}
              onChange={(e) => setFormData({ ...formData, payment_freq: e.target.value })}
              options={[
                { value: "Monthly", label: "Monthly" },
                { value: "Quarterly", label: "Quarterly" },
                { value: "Semi-Annual", label: "Semi-Annual" },
                { value: "Annual", label: "Annual" }
              ]}
            />
            <SelectInput
              label="Initial Status"
              name="policy_status"
              value={formData.policy_status}
              onChange={(e) => setFormData({ ...formData, policy_status: e.target.value })}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "PENDING", label: "Pending" }
              ]}
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="Start Date"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
            <FormInput
              label="End Date"
              name="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
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
              {actionLoading ? "Issuing..." : "Create Policy"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= EDIT POLICY MODAL ================= */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Policy Details"
        maxWidth="720px"
      >
        <form onSubmit={handleEditSubmit}>
          <div className="grid-2">
            <FormInput
              label="Policy Number"
              name="policy_no"
              value={formData.policy_no}
              onChange={(e) => setFormData({ ...formData, policy_no: e.target.value })}
              required
            />
            <SelectInput
              label="Policy Status"
              name="policy_status"
              value={formData.policy_status}
              onChange={(e) => setFormData({ ...formData, policy_status: e.target.value })}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "EXPIRED", label: "Expired" },
                { value: "CANCELLED", label: "Cancelled" },
                { value: "TERMINATED", label: "Terminated" }
              ]}
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="Sum Coverage Amount (₹)"
              name="sum_coverage"
              type="number"
              min="0"
              value={formData.sum_coverage}
              onChange={(e) => setFormData({ ...formData, sum_coverage: e.target.value })}
              required
            />
            <FormInput
              label="Premium Amount (₹)"
              name="premium_amt"
              type="number"
              min="0"
              value={formData.premium_amt}
              onChange={(e) => setFormData({ ...formData, premium_amt: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="Start Date"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
            <FormInput
              label="End Date"
              name="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <SelectInput
              label="Payment Frequency"
              name="payment_freq"
              value={formData.payment_freq}
              onChange={(e) => setFormData({ ...formData, payment_freq: e.target.value })}
              options={[
                { value: "Monthly", label: "Monthly" },
                { value: "Quarterly", label: "Quarterly" },
                { value: "Semi-Annual", label: "Semi-Annual" },
                { value: "Annual", label: "Annual" }
              ]}
            />
            <SelectInput
              label="Servicing Agent"
              name="agent_id"
              value={formData.agent_id}
              onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
              options={agents.map((a) => ({
                value: a.agent_id,
                label: `${a.agent_name} (${a.license_no || "Licensed"})`
              }))}
              placeholder="None (Direct Channel)"
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
              {actionLoading ? "Saving..." : "Update Policy"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= DELETE CONFIRM DIALOG ================= */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Cancel / Delete Policy"
        message={`Are you sure you want to permanently remove policy ${selectedPolicy?.policy_no}? Any linked claims and payments may be affected.`}
        confirmText="Confirm Deletion"
        isDanger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default Policies;
