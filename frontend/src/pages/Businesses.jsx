import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Briefcase } from "lucide-react";
import {
  getBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness
} from "../services/assetService";
import { getPolicies } from "../services/policyService";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import FormInput from "../components/FormInput";
import SelectInput from "../components/SelectInput";
import ErrorMessage from "../components/ErrorMessage";

const Businesses = () => {
  const { role } = useAuth();
  const isAdmin = role === "ADMIN";
  const isAgent = role === "AGENT";

  const [businesses, setBusinesses] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  const initialForm = {
    policy_id: "",
    business_name: "",
    industry_type: "Information Technology",
    address: "",
    gst_no: "",
    annual_turnover: "",
    employee_count: ""
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchBusinessesList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getBusinesses({ search });
      setBusinesses(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch insured businesses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessesList();
  }, [search]);

  useEffect(() => {
    getPolicies()
      .then((data) => setPolicies(data))
      .catch(console.error);
  }, []);

  const handleOpenEdit = (b) => {
    setSelectedBusiness(b);
    setFormData({
      policy_id: b.policy_id,
      business_name: b.business_name || "",
      industry_type: b.industry_type || "Information Technology",
      address: b.address || "",
      gst_no: b.gst_no || "",
      annual_turnover: b.annual_turnover || "",
      employee_count: b.employee_count || ""
    });
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createBusiness(formData);
      setIsCreateOpen(false);
      setFormData(initialForm);
      fetchBusinessesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to register business asset. (1:1 policy constraint applies)");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updateBusiness(selectedBusiness.business_id, formData);
      setIsEditOpen(false);
      fetchBusinessesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update business record.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBusiness) return;
    setActionLoading(true);
    try {
      await deleteBusiness(selectedBusiness.business_id);
      setIsDeleteOpen(false);
      fetchBusinessesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete business record.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: "ID", accessor: "business_id", sortable: true, style: { width: "70px" }, render: (val) => <span className="font-mono">#{val}</span> },
    { header: "Enterprise Name", accessor: "business_name", render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { header: "Industry Sector", accessor: "industry_type" },
    { header: "GST Number", accessor: "gst_no", render: (val) => <span className="font-mono">{val || "—"}</span> },
    { header: "Annual Turnover (₹)", accessor: "annual_turnover", render: (val) => `₹${parseFloat(val || 0).toLocaleString("en-IN")}` },
    { header: "Employees", accessor: "employee_count", render: (val) => val || "—" },
    { header: "Covered Policy", accessor: "policy_no", render: (val, row) => (
      <div>
        <span className="font-mono font-medium">{val}</span>
        {row.customer_name && <div style={{ fontSize: "12px", color: "#64748b" }}>({row.customer_name})</div>}
      </div>
    )}
  ];

  return (
    <div className="businesses-page">
      <PageHeader
        title="Insured Commercial Enterprises"
        description="Commercial liability and corporate business assets linked to commercial policies"
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
              <span>Register Business Asset</span>
            </button>
          )
        }
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by business name, industry, GST, or policy..."
        />
      </div>

      <DataTable
        columns={columns}
        data={businesses}
        keyField="business_id"
        loading={loading}
        emptyMessage="No commercial business records found."
        actions={(row) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleOpenEdit(row)}
              title="Edit Business Details"
            >
              <Edit size={15} />
            </button>
            {isAdmin && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: "#dc2626" }}
                onClick={() => {
                  setSelectedBusiness(row);
                  setIsDeleteOpen(true);
                }}
                title="Delete Business Record"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      />

      {/* ================= REGISTER BUSINESS MODAL ================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Insured Commercial Enterprise"
        maxWidth="640px"
      >
        <form onSubmit={handleCreateSubmit}>
          <SelectInput
            label="Covered Policy"
            name="policy_id"
            value={formData.policy_id}
            onChange={(e) => setFormData({ ...formData, policy_id: e.target.value })}
            options={policies.map((p) => ({
              value: p.policy_id,
              label: `${p.policy_no} - ${p.customer_name} (${p.policy_name})`
            }))}
            required
            helperText="Commercial policies maintain a strict 1:1 asset linkage"
          />

          <div className="grid-2">
            <FormInput
              label="Business / Enterprise Name"
              name="business_name"
              placeholder="e.g. Apex Logistical Solutions Ltd"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              required
            />
            <SelectInput
              label="Industry Sector"
              name="industry_type"
              value={formData.industry_type}
              onChange={(e) => setFormData({ ...formData, industry_type: e.target.value })}
              options={[
                { value: "Information Technology", label: "Information Technology" },
                { value: "Manufacturing & Heavy Engineering", label: "Manufacturing & Heavy Engineering" },
                { value: "Retail & Consumer Goods", label: "Retail & Consumer Goods" },
                { value: "Healthcare & Pharmaceuticals", label: "Healthcare & Pharmaceuticals" },
                { value: "Logistics & Supply Chain", label: "Logistics & Supply Chain" },
                { value: "Financial & Banking Services", label: "Financial & Banking Services" }
              ]}
              required
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="GST Identification Number (GSTIN)"
              name="gst_no"
              placeholder="e.g. 27ABCDE1234F1Z5"
              value={formData.gst_no}
              onChange={(e) => setFormData({ ...formData, gst_no: e.target.value })}
            />
            <FormInput
              label="Total Employees"
              name="employee_count"
              type="number"
              min="1"
              value={formData.employee_count}
              onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
            />
          </div>

          <FormInput
            label="Registered Headquarters / Facility Address"
            name="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <FormInput
            label="Annual Turnover (₹)"
            name="annual_turnover"
            type="number"
            min="0"
            placeholder="e.g. 25000000"
            value={formData.annual_turnover}
            onChange={(e) => setFormData({ ...formData, annual_turnover: e.target.value })}
          />

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
              {actionLoading ? "Registering..." : "Save Business"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= EDIT BUSINESS MODAL ================= */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Business Record"
        maxWidth="640px"
      >
        <form onSubmit={handleEditSubmit}>
          <div className="grid-2">
            <FormInput
              label="Business Name"
              name="business_name"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              required
            />
            <SelectInput
              label="Industry Sector"
              name="industry_type"
              value={formData.industry_type}
              onChange={(e) => setFormData({ ...formData, industry_type: e.target.value })}
              options={[
                { value: "Information Technology", label: "Information Technology" },
                { value: "Manufacturing & Heavy Engineering", label: "Manufacturing & Heavy Engineering" },
                { value: "Retail & Consumer Goods", label: "Retail & Consumer Goods" },
                { value: "Healthcare & Pharmaceuticals", label: "Healthcare & Pharmaceuticals" },
                { value: "Logistics & Supply Chain", label: "Logistics & Supply Chain" },
                { value: "Financial & Banking Services", label: "Financial & Banking Services" }
              ]}
              required
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="GST Identification Number"
              name="gst_no"
              value={formData.gst_no}
              onChange={(e) => setFormData({ ...formData, gst_no: e.target.value })}
            />
            <FormInput
              label="Employees"
              name="employee_count"
              type="number"
              min="1"
              value={formData.employee_count}
              onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
            />
          </div>

          <FormInput
            label="Facility Address"
            name="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <FormInput
            label="Annual Turnover (₹)"
            name="annual_turnover"
            type="number"
            min="0"
            value={formData.annual_turnover}
            onChange={(e) => setFormData({ ...formData, annual_turnover: e.target.value })}
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
        title="Delete Business Record"
        message={`Are you sure you want to remove commercial entity ${selectedBusiness?.business_name}?`}
        confirmText="Confirm Deletion"
        isDanger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default Businesses;
