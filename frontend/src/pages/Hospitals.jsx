import { useState, useEffect } from "react";
import { Plus, Eye, Edit, Trash2, HeartPulse } from "lucide-react";
import {
  getHospitals,
  createHospital,
  updateHospital,
  deleteHospital
} from "../services/hospitalService";
import { getClaims } from "../services/claimService";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import FormInput from "../components/FormInput";
import SelectInput from "../components/SelectInput";
import ErrorMessage from "../components/ErrorMessage";
import StatusBadge from "../components/StatusBadge";
import { formatDate } from "../utils/dateUtils";

const Hospitals = () => {
  const { role } = useAuth();
  const isAdmin = role === "ADMIN";
  const isSurveyor = role === "SURVEYOR";

  const [hospitals, setHospitals] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);

  const initialForm = {
    hospital_name: "",
    claim_id: "",
    city: "",
    admission_date: "",
    discharge_date: "",
    bill_amt: ""
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchHospitalsList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getHospitals({ search });
      setHospitals(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch hospital records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalsList();
  }, [search]);

  useEffect(() => {
    getClaims()
      .then((data) => setClaims(data))
      .catch(console.error);
  }, []);

  const handleOpenEdit = (h) => {
    setSelectedHospital(h);
    setFormData({
      hospital_name: h.hospital_name || "",
      claim_id: h.claim_id || "",
      city: h.city || "",
      admission_date: h.admission_date ? h.admission_date.split("T")[0] : "",
      discharge_date: h.discharge_date ? h.discharge_date.split("T")[0] : "",
      bill_amt: h.bill_amt || ""
    });
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createHospital(formData);
      setIsCreateOpen(false);
      setFormData(initialForm);
      fetchHospitalsList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add hospital.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updateHospital(selectedHospital.hospital_id, formData);
      setIsEditOpen(false);
      fetchHospitalsList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update hospital.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedHospital) return;
    setActionLoading(true);
    try {
      await deleteHospital(selectedHospital.hospital_id);
      setIsDeleteOpen(false);
      fetchHospitalsList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete hospital record.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: "ID", accessor: "hospital_id", sortable: true, style: { width: "70px" }, render: (val) => <span className="font-mono">#{val}</span> },
    { header: "Hospital Name", accessor: "hospital_name", render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { header: "City", accessor: "city" },
    { header: "Linked Claim", accessor: "claim_id", render: (val, row) => (
      <div>
        <span className="font-mono">Claim #{val}</span>
        {row.policy_no && <div style={{ fontSize: "12px", color: "#64748b" }}>Pol: {row.policy_no}</div>}
      </div>
    )},
    { header: "Admission - Discharge", render: (_, row) => (
      <div style={{ fontSize: "13px" }}>
        {formatDate(row.admission_date)} to{" "}
        {formatDate(row.discharge_date)}
      </div>
    )},
    { header: "Hospital Bill (₹)", accessor: "bill_amt", render: (val) => `₹${parseFloat(val || 0).toLocaleString("en-IN")}` }
  ];

  return (
    <div className="hospitals-page">
      <PageHeader
        title="Network Hospitals & Medical Claims"
        description="Medical admission records, inpatient bills, and claim linkage"
        actions={
          (isAdmin || isSurveyor) && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setFormData(initialForm);
                setIsCreateOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Link Hospital Bill</span>
            </button>
          )
        }
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by hospital name, city, or policy no..."
        />
      </div>

      <DataTable
        columns={columns}
        data={hospitals}
        keyField="hospital_id"
        loading={loading}
        emptyMessage="No hospital records found."
        actions={(row) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            {(isAdmin || isSurveyor) && (
              <>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleOpenEdit(row)}
                  title="Edit Hospital Record"
                >
                  <Edit size={15} />
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ color: "#dc2626" }}
                  onClick={() => {
                    setSelectedHospital(row);
                    setIsDeleteOpen(true);
                  }}
                  title="Delete Hospital Record"
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        )}
      />

      {/* ================= CREATE HOSPITAL MODAL ================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Link Hospital & Admission Record"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateSubmit}>
          <FormInput
            label="Hospital Name"
            name="hospital_name"
            placeholder="e.g. Apollo Super Speciality Hospital"
            value={formData.hospital_name}
            onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
            required
          />

          <div className="grid-2">
            <SelectInput
              label="Linked Insurance Claim"
              name="claim_id"
              value={formData.claim_id}
              onChange={(e) => setFormData({ ...formData, claim_id: e.target.value })}
              options={claims.map((c) => ({
                value: c.claim_id,
                label: `Claim #${c.claim_id} - ${c.customer_name} (${c.policy_no})`
              }))}
              required
            />
            <FormInput
              label="City"
              name="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="Admission Date"
              name="admission_date"
              type="date"
              value={formData.admission_date}
              onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
            />
            <FormInput
              label="Discharge Date"
              name="discharge_date"
              type="date"
              value={formData.discharge_date}
              onChange={(e) => setFormData({ ...formData, discharge_date: e.target.value })}
            />
          </div>

          <FormInput
            label="Total Medical Bill Amount (₹)"
            name="bill_amt"
            type="number"
            min="0"
            value={formData.bill_amt}
            onChange={(e) => setFormData({ ...formData, bill_amt: e.target.value })}
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
              {actionLoading ? "Saving..." : "Save Hospital Record"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= EDIT HOSPITAL MODAL ================= */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Hospital Record"
        maxWidth="600px"
      >
        <form onSubmit={handleEditSubmit}>
          <FormInput
            label="Hospital Name"
            name="hospital_name"
            value={formData.hospital_name}
            onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
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
              label="Total Bill (₹)"
              name="bill_amt"
              type="number"
              min="0"
              value={formData.bill_amt}
              onChange={(e) => setFormData({ ...formData, bill_amt: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="Admission Date"
              name="admission_date"
              type="date"
              value={formData.admission_date}
              onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
            />
            <FormInput
              label="Discharge Date"
              name="discharge_date"
              type="date"
              value={formData.discharge_date}
              onChange={(e) => setFormData({ ...formData, discharge_date: e.target.value })}
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
        title="Delete Hospital Record"
        message={`Are you sure you want to remove hospital record for ${selectedHospital?.hospital_name}?`}
        confirmText="Confirm Deletion"
        isDanger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default Hospitals;
