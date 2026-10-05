import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Home } from "lucide-react";
import {
  getProperties,
  createProperty,
  updateProperty,
  deleteProperty
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

const Properties = () => {
  const { role } = useAuth();
  const isAdmin = role === "ADMIN";
  const isAgent = role === "AGENT";

  const [properties, setProperties] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  const initialForm = {
    policy_id: "",
    property_type: "Residential Apartment",
    address: "",
    city: "",
    state: "",
    construction_year: "",
    market_value: "",
    usage_type: "Residential"
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchPropertiesList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProperties({ search });
      setProperties(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch property assets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertiesList();
  }, [search]);

  useEffect(() => {
    getPolicies()
      .then((data) => setPolicies(data))
      .catch(console.error);
  }, []);

  const handleOpenEdit = (p) => {
    setSelectedProperty(p);
    setFormData({
      policy_id: p.policy_id,
      property_type: p.property_type || "Residential Apartment",
      address: p.address || "",
      city: p.city || "",
      state: p.state || "",
      construction_year: p.construction_year || "",
      market_value: p.market_value || "",
      usage_type: p.usage_type || "Residential"
    });
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createProperty(formData);
      setIsCreateOpen(false);
      setFormData(initialForm);
      fetchPropertiesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to register property. (1:1 policy constraint applies)");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updateProperty(selectedProperty.property_id, formData);
      setIsEditOpen(false);
      fetchPropertiesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update property.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProperty) return;
    setActionLoading(true);
    try {
      await deleteProperty(selectedProperty.property_id);
      setIsDeleteOpen(false);
      fetchPropertiesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete property record.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: "ID", accessor: "property_id", sortable: true, style: { width: "70px" }, render: (val) => <span className="font-mono">#{val}</span> },
    { header: "Property Type", accessor: "property_type", render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { header: "Location / Address", render: (_, row) => `${row.address || ""}, ${row.city || ""}` },
    { header: "Market Value (₹)", accessor: "market_value", render: (val) => `₹${parseFloat(val || 0).toLocaleString("en-IN")}` },
    { header: "Year Built", accessor: "construction_year", render: (val) => val || "—" },
    { header: "Usage Type", accessor: "usage_type" },
    { header: "Covered Policy", accessor: "policy_no", render: (val, row) => (
      <div>
        <span className="font-mono font-medium">{val}</span>
        {row.customer_name && <div style={{ fontSize: "12px", color: "#64748b" }}>({row.customer_name})</div>}
      </div>
    )}
  ];

  return (
    <div className="properties-page">
      <PageHeader
        title="Insured Real Estate Properties"
        description="Residential and commercial building assets insured under property policies"
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
              <span>Register Property</span>
            </button>
          )
        }
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by property type, city, address, or policy..."
        />
      </div>

      <DataTable
        columns={columns}
        data={properties}
        keyField="property_id"
        loading={loading}
        emptyMessage="No insured property records found."
        actions={(row) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleOpenEdit(row)}
              title="Edit Property"
            >
              <Edit size={15} />
            </button>
            {isAdmin && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: "#dc2626" }}
                onClick={() => {
                  setSelectedProperty(row);
                  setIsDeleteOpen(true);
                }}
                title="Delete Property Record"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      />

      {/* ================= REGISTER PROPERTY MODAL ================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Insured Property"
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
            helperText="Property insurance policies enforce a 1:1 asset linkage"
          />

          <div className="grid-2">
            <SelectInput
              label="Property Type"
              name="property_type"
              value={formData.property_type}
              onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
              options={[
                { value: "Residential Apartment", label: "Residential Apartment" },
                { value: "Independent Villa / Bungalow", label: "Independent Villa / Bungalow" },
                { value: "Commercial Office Building", label: "Commercial Office Building" },
                { value: "Industrial Warehouse", label: "Industrial Warehouse" },
                { value: "Retail Storefront", label: "Retail Storefront" }
              ]}
              required
            />
            <SelectInput
              label="Usage Type"
              name="usage_type"
              value={formData.usage_type}
              onChange={(e) => setFormData({ ...formData, usage_type: e.target.value })}
              options={[
                { value: "Residential", label: "Residential" },
                { value: "Commercial", label: "Commercial" },
                { value: "Industrial", label: "Industrial" }
              ]}
            />
          </div>

          <FormInput
            label="Physical Address"
            name="address"
            placeholder="Flat No, Building, Street, Landmark"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />

          <div className="grid-2">
            <FormInput
              label="City"
              name="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
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
              label="Construction Year"
              name="construction_year"
              type="number"
              placeholder="e.g. 2018"
              value={formData.construction_year}
              onChange={(e) => setFormData({ ...formData, construction_year: e.target.value })}
            />
            <FormInput
              label="Market Valuation (₹)"
              name="market_value"
              type="number"
              min="0"
              placeholder="e.g. 7500000"
              value={formData.market_value}
              onChange={(e) => setFormData({ ...formData, market_value: e.target.value })}
              required
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
              {actionLoading ? "Registering..." : "Save Property"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= EDIT PROPERTY MODAL ================= */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Property Asset Details"
        maxWidth="640px"
      >
        <form onSubmit={handleEditSubmit}>
          <div className="grid-2">
            <SelectInput
              label="Property Type"
              name="property_type"
              value={formData.property_type}
              onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
              options={[
                { value: "Residential Apartment", label: "Residential Apartment" },
                { value: "Independent Villa / Bungalow", label: "Independent Villa / Bungalow" },
                { value: "Commercial Office Building", label: "Commercial Office Building" },
                { value: "Industrial Warehouse", label: "Industrial Warehouse" },
                { value: "Retail Storefront", label: "Retail Storefront" }
              ]}
              required
            />
            <SelectInput
              label="Usage Type"
              name="usage_type"
              value={formData.usage_type}
              onChange={(e) => setFormData({ ...formData, usage_type: e.target.value })}
              options={[
                { value: "Residential", label: "Residential" },
                { value: "Commercial", label: "Commercial" },
                { value: "Industrial", label: "Industrial" }
              ]}
            />
          </div>

          <FormInput
            label="Address"
            name="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
              label="Market Valuation (₹)"
              name="market_value"
              type="number"
              min="0"
              value={formData.market_value}
              onChange={(e) => setFormData({ ...formData, market_value: e.target.value })}
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
        title="Delete Property Record"
        message={`Are you sure you want to remove property at ${selectedProperty?.address}, ${selectedProperty?.city}?`}
        confirmText="Confirm Deletion"
        isDanger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default Properties;
