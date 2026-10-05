import { useState, useEffect } from "react";
import { Plus, Eye, Edit, Trash2, Search, Filter, Shield, AlertTriangle } from "lucide-react";
import {
  getCustomers,
  getCustomerById,
  getCustomerPolicies,
  getCustomerDocuments,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from "../services/customerService";
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

const Customers = () => {
  const { role } = useAuth();
  const isAdmin = role === "ADMIN";
  const isAgent = role === "AGENT";

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [forceDelete, setForceDelete] = useState(true);
  const [preserveLogin, setPreserveLogin] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");

  // Selected customer for view / edit / delete
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerPolicies, setCustomerPolicies] = useState([]);
  const [customerDocuments, setCustomerDocuments] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form state
  const initialForm = {
    first_name: "",
    last_name: "",
    email: "",
    mobile_no: "",
    aadhaar_no: "",
    pan_no: "",
    dob: "",
    gender: "Male",
    address: "",
    city: "",
    state: "",
    pincode: "",
    occupation: "",
    annual_income: "",
    customer_status: "ACTIVE"
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchCustomersList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCustomers({ search, status: statusFilter });
      setCustomers(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch customer records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersList();
  }, [search, statusFilter]);

  // View Customer Details
  const handleView = async (customer) => {
    setSelectedCustomer(customer);
    setIsViewOpen(true);
    setDetailsLoading(true);
    try {
      const [policies, docs] = await Promise.all([
        getCustomerPolicies(customer.customer_id),
        getCustomerDocuments(customer.customer_id)
      ]);
      setCustomerPolicies(policies);
      setCustomerDocuments(docs.documents || []);
    } catch (err) {
      console.error("Error fetching customer related info:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Open Edit
  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      first_name: customer.first_name || "",
      last_name: customer.last_name || "",
      email: customer.email || "",
      mobile_no: customer.mobile_no || "",
      aadhaar_no: customer.aadhaar_no || "",
      pan_no: customer.pan_no || "",
      dob: customer.dob ? customer.dob.split("T")[0] : "",
      gender: customer.gender || "Male",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      pincode: customer.pincode || "",
      occupation: customer.occupation || "",
      annual_income: customer.annual_income || "",
      customer_status: customer.customer_status || "ACTIVE"
    });
    setIsEditOpen(true);
  };

  // Submit Create
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createCustomer(formData);
      setIsCreateOpen(false);
      setFormData(initialForm);
      fetchCustomersList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create customer.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updateCustomer(selectedCustomer.customer_id, formData);
      setIsEditOpen(false);
      fetchCustomersList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update customer.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Delete or Force Purge
  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return;
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await deleteCustomer(selectedCustomer.customer_id, {
        force: forceDelete,
        preserveLogin: preserveLogin
      });
      setIsDeleteOpen(false);
      setSelectedCustomer(null);
      setSuccessMsg(res.message);
      fetchCustomersList();
    } catch (err) {
      setIsDeleteOpen(false);
      setError(err.response?.data?.error || "Failed to delete customer.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: "ID", accessor: "customer_id", sortable: true, style: { width: "70px" } },
    {
      header: "Customer Name",
      accessor: "first_name",
      render: (_, row) => (
        <div>
          <span style={{ fontWeight: 600, color: "#0f172a" }}>
            {row.first_name} {row.last_name}
          </span>
          <div style={{ fontSize: "12px", color: "#64748b" }}>{row.email}</div>
        </div>
      )
    },
    { header: "Mobile", accessor: "mobile_no" },
    { header: "City", accessor: "city" },
    {
      header: "Annual Income",
      accessor: "annual_income",
      render: (val) => (val ? `₹${parseFloat(val).toLocaleString("en-IN")}` : "—")
    },
    {
      header: "Status",
      accessor: "customer_status",
      render: (val) => <StatusBadge status={val} />
    }
  ];

  return (
    <div className="customers-page">
      <PageHeader
        title="Customer Directory"
        description="Comprehensive repository of registered policyholders"
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
              <span>Add Customer</span>
            </button>
          )
        }
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

      {successMsg && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#ecfdf5",
            border: "1px solid #10b981",
            color: "#065f46",
            fontSize: "14px",
            fontWeight: 500
          }}
        >
          <span>✅ {successMsg}</span>
          <button
            type="button"
            onClick={() => setSuccessMsg("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#065f46",
              fontWeight: 700,
              fontSize: "16px"
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email, mobile, or city..."
        />

        <div className="filter-group">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Main Customers DataTable */}
      <DataTable
        columns={columns}
        data={customers}
        keyField="customer_id"
        loading={loading}
        emptyMessage="No customer records match your filter criteria."
        actions={(row) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleView(row)}
              title="View Customer Details"
            >
              <Eye size={15} />
            </button>
            {(isAdmin || isAgent) && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => handleOpenEdit(row)}
                title="Edit Customer"
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
                  setSelectedCustomer(row);
                  setForceDelete(true);
                  setPreserveLogin(true);
                  setIsDeleteOpen(true);
                }}
                title="Delete Customer"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      />

      {/* ================= VIEW CUSTOMER DETAILS MODAL ================= */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Customer Profile & Portfolio"
        maxWidth="760px"
      >
        {selectedCustomer && (
          <div>
            <div className="detail-card">
              <h4 className="detail-card-title">Personal & Contact Information</h4>
              <div className="grid-2">
                <div className="detail-row">
                  <span className="detail-label">Full Name:</span>
                  <span className="detail-value font-medium">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Customer ID:</span>
                  <span className="detail-value font-mono">#{selectedCustomer.customer_id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedCustomer.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Mobile:</span>
                  <span className="detail-value">{selectedCustomer.mobile_no || "—"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">City, State:</span>
                  <span className="detail-value">
                    {[selectedCustomer.city, selectedCustomer.state].filter(Boolean).join(", ") || "—"}
                    {selectedCustomer.pincode ? ` (${selectedCustomer.pincode})` : ""}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Occupation:</span>
                  <span className="detail-value">{selectedCustomer.occupation || "—"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Annual Income / Salary:</span>
                  <span className="detail-value">
                    ₹{parseFloat(selectedCustomer.annual_income || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value"><StatusBadge status={selectedCustomer.customer_status} /></span>
                </div>
              </div>
            </div>

            {/* Enrolled Policies */}
            <div className="detail-card">
              <h4 className="detail-card-title">Associated Policies ({customerPolicies.length})</h4>
              {detailsLoading ? (
                <LoadingSpinner text="Fetching policies..." size={20} />
              ) : customerPolicies.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "13.5px" }}>No policies registered for this customer.</p>
              ) : (
                <div className="table-responsive">
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Policy No</th>
                        <th>Plan Name</th>
                        <th>Coverage</th>
                        <th>Premium</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerPolicies.map((p) => (
                        <tr key={p.policy_id}>
                          <td className="font-mono">{p.policy_no}</td>
                          <td>{p.policy_name}</td>
                          <td>₹{parseFloat(p.sum_coverage || 0).toLocaleString("en-IN")}</td>
                          <td>₹{parseFloat(p.premium_amt || 0).toLocaleString("en-IN")} ({p.payment_freq})</td>
                          <td><StatusBadge status={p.policy_status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="detail-card">
              <h4 className="detail-card-title">Uploaded Verification Documents ({customerDocuments.length})</h4>
              {detailsLoading ? (
                <LoadingSpinner text="Fetching documents..." size={20} />
              ) : customerDocuments.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "13.5px" }}>No documents uploaded yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Doc Type</th>
                        <th>Attached File</th>
                        <th>Verification Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerDocuments.map((d) => (
                        <tr key={d.document_id}>
                          <td>{d.doc_type}</td>
                          <td>{d.file_name || "—"}</td>
                          <td><StatusBadge status={d.verification_status} /></td>
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

      {/* ================= CREATE CUSTOMER MODAL ================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Customer"
        maxWidth="680px"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="grid-2">
            <FormInput
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
            <FormInput
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="Email"
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
              label="Occupation"
              name="occupation"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
            />
            <FormInput
              label="Annual Income / Salary (₹)"
              name="annual_income"
              type="number"
              min="0"
              value={formData.annual_income}
              onChange={(e) => setFormData({ ...formData, annual_income: e.target.value })}
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
              {actionLoading ? "Saving..." : "Create Customer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= EDIT CUSTOMER MODAL ================= */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Customer Information"
        maxWidth="680px"
      >
        <form onSubmit={handleEditSubmit}>
          <div className="grid-2">
            <FormInput
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
            <FormInput
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="Email"
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
              label="City"
              name="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <FormInput
              label="Occupation"
              name="occupation"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="Annual Income / Salary (₹)"
              name="annual_income"
              type="number"
              min="0"
              value={formData.annual_income}
              onChange={(e) => setFormData({ ...formData, annual_income: e.target.value })}
            />
            <SelectInput
              label="Customer Status"
              name="customer_status"
              value={formData.customer_status}
              onChange={(e) => setFormData({ ...formData, customer_status: e.target.value })}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" }
              ]}
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

      {/* ================= DELETE CONFIRM / PURGE MODAL ================= */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Purge / Delete Customer Records"
        maxWidth="520px"
        footer={
          <div className="dialog-footer-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsDeleteOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`btn ${preserveLogin ? "btn-primary" : "btn-danger"}`}
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
              style={
                preserveLogin
                  ? { backgroundColor: "#d97706", borderColor: "#d97706", color: "#fff" }
                  : {}
              }
            >
              {actionLoading
                ? "Processing..."
                : preserveLogin
                  ? "Purge Records (Keep Login Active)"
                  : "Delete Customer Completely"}
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
              background: "#fef3c7",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #f59e0b"
            }}
          >
            <AlertTriangle size={24} color="#d97706" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div style={{ fontWeight: 600, color: "#92400e", fontSize: "14px" }}>
                Target: {selectedCustomer?.first_name} {selectedCustomer?.last_name} ({selectedCustomer?.email})
              </div>
              <div style={{ fontSize: "12px", color: "#b45309", marginTop: "4px" }}>
                This customer may have active policies, payments, claims, nominees, or documents.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "6px",
                background: forceDelete ? "#fffbeb" : "transparent"
              }}
            >
              <input
                type="checkbox"
                checked={forceDelete}
                onChange={(e) => setForceDelete(e.target.checked)}
                style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#d97706" }}
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>
                  Forcefully cascade-delete all linked records
                </span>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                  Cleans up all associated policies, claims, premium payments, hospital records, nominees, assets, and documents in one transaction.
                </p>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "6px",
                background: preserveLogin ? "#eff6ff" : "transparent",
                border: preserveLogin ? "1px solid #bfdbfe" : "1px solid transparent"
              }}
            >
              <input
                type="checkbox"
                checked={preserveLogin}
                onChange={(e) => setPreserveLogin(e.target.checked)}
                style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#2563eb" }}
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: "13px", color: preserveLogin ? "#1d4ed8" : "#0f172a" }}>
                  Keep customer login active (Reset account to clean slate)
                </span>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                  The customer will still be able to log in with their email and password, but all their previous policy records and history will be cleared.
                </p>
              </div>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Customers;