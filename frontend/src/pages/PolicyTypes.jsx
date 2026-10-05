import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Layers } from "lucide-react";
import {
  getPolicyTypes,
  createPolicyType,
  updatePolicyType,
  deletePolicyType
} from "../services/policyTypeService";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import FormInput from "../components/FormInput";
import SelectInput from "../components/SelectInput";
import ErrorMessage from "../components/ErrorMessage";

const PolicyTypes = () => {
  const { role } = useAuth();
  const isAdmin = role === "ADMIN";

  const [policyTypes, setPolicyTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const initialForm = {
    policy_name: "",
    category: "Life"
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchPolicyTypesList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPolicyTypes({ search, category: categoryFilter });
      setPolicyTypes(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch insurance policy plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicyTypesList();
  }, [search, categoryFilter]);

  const handleOpenEdit = (pt) => {
    setSelectedType(pt);
    setFormData({
      policy_name: pt.policy_name || "",
      category: pt.category || "Life"
    });
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createPolicyType(formData);
      setIsCreateOpen(false);
      setFormData(initialForm);
      fetchPolicyTypesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create policy type.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updatePolicyType(selectedType.policy_type_id, formData);
      setIsEditOpen(false);
      fetchPolicyTypesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update policy plan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedType) return;
    setActionLoading(true);
    try {
      await deletePolicyType(selectedType.policy_type_id);
      setIsDeleteOpen(false);
      fetchPolicyTypesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete policy type (it may be in use by active policies).");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: "ID", accessor: "policy_type_id", sortable: true, style: { width: "70px" }, render: (val) => <span className="font-mono">#{val}</span> },
    { header: "Policy Plan Name", accessor: "policy_name", render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { header: "Insurance Category", accessor: "category", render: (val) => (
      <span className="status-badge badge-info" style={{ fontWeight: 600 }}>{val}</span>
    )}
  ];

  return (
    <div className="policy-types-page">
      <PageHeader
        title="Insurance Policy Catalog"
        description="Definitions of insurance policy categories and underwriting plans"
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
              <span>Create Policy Plan</span>
            </button>
          )
        }
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by plan name or category..."
        />

        <div className="filter-group">
          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Life">Life Insurance</option>
            <option value="Health">Health Insurance</option>
            <option value="Vehicle">Vehicle / Auto</option>
            <option value="Property">Property & Home</option>
            <option value="Business">Commercial Business</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={policyTypes}
        keyField="policy_type_id"
        loading={loading}
        emptyMessage="No policy types configured."
        actions={(row) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            {isAdmin && (
              <>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleOpenEdit(row)}
                  title="Edit Policy Plan"
                >
                  <Edit size={15} />
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ color: "#dc2626" }}
                  onClick={() => {
                    setSelectedType(row);
                    setIsDeleteOpen(true);
                  }}
                  title="Delete Policy Plan"
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        )}
      />

      {/* ================= CREATE POLICY TYPE MODAL ================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Insurance Policy Plan"
        maxWidth="500px"
      >
        <form onSubmit={handleCreateSubmit}>
          <FormInput
            label="Policy Plan Name"
            name="policy_name"
            placeholder="e.g. Comprehensive Term Life Shield"
            value={formData.policy_name}
            onChange={(e) => setFormData({ ...formData, policy_name: e.target.value })}
            required
          />

          <SelectInput
            label="Category"
            name="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: "Life", label: "Life Insurance" },
              { value: "Health", label: "Health Insurance" },
              { value: "Vehicle", label: "Vehicle / Auto Insurance" },
              { value: "Property", label: "Property Insurance" },
              { value: "Business", label: "Commercial Business Insurance" }
            ]}
            required
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
              {actionLoading ? "Saving..." : "Save Plan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= EDIT POLICY TYPE MODAL ================= */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Policy Plan"
        maxWidth="500px"
      >
        <form onSubmit={handleEditSubmit}>
          <FormInput
            label="Policy Plan Name"
            name="policy_name"
            value={formData.policy_name}
            onChange={(e) => setFormData({ ...formData, policy_name: e.target.value })}
            required
          />

          <SelectInput
            label="Category"
            name="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: "Life", label: "Life Insurance" },
              { value: "Health", label: "Health Insurance" },
              { value: "Vehicle", label: "Vehicle / Auto Insurance" },
              { value: "Property", label: "Property Insurance" },
              { value: "Business", label: "Commercial Business Insurance" }
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
        title="Delete Policy Plan"
        message={`Are you sure you want to remove plan ${selectedType?.policy_name}?`}
        confirmText="Confirm Deletion"
        isDanger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default PolicyTypes;
