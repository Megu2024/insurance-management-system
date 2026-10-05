import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Car } from "lucide-react";
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle
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

const Vehicles = () => {
  const { role } = useAuth();
  const isAdmin = role === "ADMIN";
  const isAgent = role === "AGENT";

  const [vehicles, setVehicles] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const initialForm = {
    policy_id: "",
    reg_no: "",
    manufacturer: "",
    model: "",
    engine_no: ""
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchVehiclesList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getVehicles({ search });
      setVehicles(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch insured vehicles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehiclesList();
  }, [search]);

  useEffect(() => {
    getPolicies()
      .then((data) => setPolicies(data))
      .catch(console.error);
  }, []);

  const handleOpenEdit = (v) => {
    setSelectedVehicle(v);
    setFormData({
      policy_id: v.policy_id,
      reg_no: v.reg_no || "",
      manufacturer: v.manufacturer || "",
      model: v.model || "",
      engine_no: v.engine_no || ""
    });
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createVehicle(formData);
      setIsCreateOpen(false);
      setFormData(initialForm);
      fetchVehiclesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add vehicle. Note: A policy can only have one insured vehicle.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updateVehicle(selectedVehicle.vehicle_id, formData);
      setIsEditOpen(false);
      fetchVehiclesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update vehicle.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVehicle) return;
    setActionLoading(true);
    try {
      await deleteVehicle(selectedVehicle.vehicle_id);
      setIsDeleteOpen(false);
      fetchVehiclesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to remove vehicle record.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: "ID", accessor: "vehicle_id", sortable: true, style: { width: "70px" }, render: (val) => <span className="font-mono">#{val}</span> },
    { header: "Registration No", accessor: "reg_no", render: (val) => <span className="font-mono font-medium">{val}</span> },
    { header: "Make & Model", render: (_, row) => `${row.manufacturer || ""} ${row.model || ""}` },
    { header: "Engine Number", accessor: "engine_no", render: (val) => <span className="font-mono">{val || "—"}</span> },
    { header: "Covered Policy", accessor: "policy_no", render: (val, row) => (
      <div>
        <span className="font-mono font-medium">{val}</span>
        {row.customer_name && <div style={{ fontSize: "12px", color: "#64748b" }}>({row.customer_name})</div>}
      </div>
    )}
  ];

  return (
    <div className="vehicles-page">
      <PageHeader
        title="Insured Vehicles"
        description="Motor vehicle assets linked to automotive insurance policies"
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
              <span>Register Vehicle</span>
            </button>
          )
        }
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by reg number, make, model, or policy no..."
        />
      </div>

      <DataTable
        columns={columns}
        data={vehicles}
        keyField="vehicle_id"
        loading={loading}
        emptyMessage="No insured vehicles recorded."
        actions={(row) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleOpenEdit(row)}
              title="Edit Vehicle"
            >
              <Edit size={15} />
            </button>
            {isAdmin && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: "#dc2626" }}
                onClick={() => {
                  setSelectedVehicle(row);
                  setIsDeleteOpen(true);
                }}
                title="Delete Vehicle Record"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      />

      {/* ================= REGISTER VEHICLE MODAL ================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Insured Vehicle"
        maxWidth="600px"
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
            helperText="Select the auto insurance policy to attach this vehicle to (1:1 constraint)"
          />

          <div className="grid-2">
            <FormInput
              label="Registration Number"
              name="reg_no"
              placeholder="e.g. MH-02-AB-1234"
              value={formData.reg_no}
              onChange={(e) => setFormData({ ...formData, reg_no: e.target.value })}
              required
            />
            <FormInput
              label="Manufacturer"
              name="manufacturer"
              placeholder="e.g. Hyundai"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="Model"
              name="model"
              placeholder="e.g. Creta SX"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            />
            <FormInput
              label="Engine Number"
              name="engine_no"
              placeholder="e.g. ENG9876543"
              value={formData.engine_no}
              onChange={(e) => setFormData({ ...formData, engine_no: e.target.value })}
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
              {actionLoading ? "Registering..." : "Save Vehicle"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= EDIT VEHICLE MODAL ================= */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Vehicle Details"
        maxWidth="600px"
      >
        <form onSubmit={handleEditSubmit}>
          <div className="grid-2">
            <FormInput
              label="Registration Number"
              name="reg_no"
              value={formData.reg_no}
              onChange={(e) => setFormData({ ...formData, reg_no: e.target.value })}
              required
            />
            <FormInput
              label="Manufacturer"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="Model"
              name="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            />
            <FormInput
              label="Engine Number"
              name="engine_no"
              value={formData.engine_no}
              onChange={(e) => setFormData({ ...formData, engine_no: e.target.value })}
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
        title="Remove Vehicle"
        message={`Are you sure you want to remove vehicle ${selectedVehicle?.reg_no}?`}
        confirmText="Confirm Removal"
        isDanger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default Vehicles;
