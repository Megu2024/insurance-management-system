import { useState, useEffect } from "react";
import { Plus, Eye, Edit, Trash2, Search, ClipboardCheck } from "lucide-react";
import {
  getSurveyors,
  getSurveyorById,
  getSurveyorClaims,
  createSurveyor,
  updateSurveyor,
  deleteSurveyor
} from "../services/surveyorService";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import FormInput from "../components/FormInput";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";

const Surveyors = () => {
  const { role } = useAuth();
  const isAdmin = role === "ADMIN";

  const [surveyors, setSurveyors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedSurveyor, setSelectedSurveyor] = useState(null);
  const [surveyorClaims, setSurveyorClaims] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const initialForm = {
    surveyor_name: "",
    email: "",
    phone: "",
    license_no: "",
    experience: ""
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchSurveyorsList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getSurveyors({ search });
      setSurveyors(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch surveyors list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveyorsList();
  }, [search]);

  const handleView = async (surveyor) => {
    setSelectedSurveyor(surveyor);
    setIsViewOpen(true);
    setDetailsLoading(true);
    try {
      const claims = await getSurveyorClaims(surveyor.surveyor_id);
      setSurveyorClaims(claims);
    } catch (err) {
      console.error("Error fetching surveyor claims:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenEdit = (surveyor) => {
    setSelectedSurveyor(surveyor);
    setFormData({
      surveyor_name: surveyor.surveyor_name || "",
      email: surveyor.email || "",
      phone: surveyor.phone || "",
      license_no: surveyor.license_no || "",
      experience: surveyor.experience || ""
    });
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createSurveyor(formData);
      setIsCreateOpen(false);
      setFormData(initialForm);
      fetchSurveyorsList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create surveyor.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updateSurveyor(selectedSurveyor.surveyor_id, formData);
      setIsEditOpen(false);
      fetchSurveyorsList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update surveyor.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSurveyor) return;
    setActionLoading(true);
    try {
      await deleteSurveyor(selectedSurveyor.surveyor_id);
      setIsDeleteOpen(false);
      fetchSurveyorsList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete surveyor.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: "ID", accessor: "surveyor_id", sortable: true, style: { width: "80px" }, render: (val) => <span className="font-mono">#{val}</span> },
    { header: "Surveyor Name", accessor: "surveyor_name", render: (val, row) => (
      <div>
        <div style={{ fontWeight: 600, color: "#0f172a" }}>{val}</div>
        <div style={{ fontSize: "12px", color: "#64748b" }}>{row.email}</div>
      </div>
    )},
    { header: "Phone", accessor: "phone" },
    { header: "License No", accessor: "license_no", render: (val) => <span className="font-mono">{val || "—"}</span> },
    { header: "Experience", accessor: "experience", render: (val) => `${val || 0} years` },
    { header: "Assigned Claims", accessor: "assigned_claims_count", render: (val) => <span className="font-mono font-medium">{val || 0}</span> }
  ];

  return (
    <div className="surveyors-page">
      <PageHeader
        title="Insurance Claim Surveyors"
        description="Licensed loss assessors and damage inspection professionals"
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
              <span>Register Surveyor</span>
            </button>
          )
        }
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by surveyor name, email, or license..."
        />
      </div>

      <DataTable
        columns={columns}
        data={surveyors}
        keyField="surveyor_id"
        loading={loading}
        emptyMessage="No surveyors found."
        actions={(row) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleView(row)}
              title="View Assigned Claims"
            >
              <Eye size={15} />
            </button>
            {isAdmin && (
              <>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleOpenEdit(row)}
                  title="Edit Surveyor"
                >
                  <Edit size={15} />
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ color: "#dc2626" }}
                  onClick={() => {
                    setSelectedSurveyor(row);
                    setIsDeleteOpen(true);
                  }}
                  title="Delete Surveyor"
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        )}
      />

      {/* ================= VIEW SURVEYOR MODAL ================= */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Surveyor Profile: ${selectedSurveyor?.surveyor_name || ""}`}
        maxWidth="760px"
      >
        {selectedSurveyor && (
          <div>
            <div className="detail-card">
              <h4 className="detail-card-title">Surveyor Credentials</h4>
              <div className="grid-2">
                <div className="detail-row"><span className="detail-label">Surveyor ID:</span><span className="detail-value font-mono">#{selectedSurveyor.surveyor_id}</span></div>
                <div className="detail-row"><span className="detail-label">Name:</span><span className="detail-value font-medium">{selectedSurveyor.surveyor_name}</span></div>
                <div className="detail-row"><span className="detail-label">Email:</span><span className="detail-value">{selectedSurveyor.email}</span></div>
                <div className="detail-row"><span className="detail-label">Phone:</span><span className="detail-value">{selectedSurveyor.phone || "—"}</span></div>
                <div className="detail-row"><span className="detail-label">License:</span><span className="detail-value font-mono">{selectedSurveyor.license_no || "—"}</span></div>
                <div className="detail-row"><span className="detail-label">Experience:</span><span className="detail-value">{selectedSurveyor.experience || 0} years</span></div>
              </div>
            </div>

            {/* Claims Inspected */}
            <div className="detail-card">
              <h4 className="detail-card-title">Claims Inspected by this Surveyor ({surveyorClaims.length})</h4>
              {detailsLoading ? (
                <LoadingSpinner text="Fetching claims..." size={20} />
              ) : surveyorClaims.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "13.5px" }}>No claims currently assigned to this surveyor.</p>
              ) : (
                <div className="table-responsive">
                  <table className="dash-table">
                    <thead>
                      <tr><th>Claim ID</th><th>Policy No</th><th>Customer</th><th>Claimed</th><th>Approved</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {surveyorClaims.map((c) => (
                        <tr key={c.claim_id}>
                          <td className="font-mono">#{c.claim_id}</td>
                          <td className="font-mono">{c.policy_no}</td>
                          <td>{c.customer_name}</td>
                          <td>₹{parseFloat(c.claim_amount || 0).toLocaleString("en-IN")}</td>
                          <td>₹{parseFloat(c.approve_amt || 0).toLocaleString("en-IN")}</td>
                          <td><StatusBadge status={c.claim_status} /></td>
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

      {/* ================= CREATE SURVEYOR MODAL ================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Claim Surveyor"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateSubmit}>
          <FormInput
            label="Surveyor Full Name"
            name="surveyor_name"
            value={formData.surveyor_name}
            onChange={(e) => setFormData({ ...formData, surveyor_name: e.target.value })}
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
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="License Number"
              name="license_no"
              value={formData.license_no}
              onChange={(e) => setFormData({ ...formData, license_no: e.target.value })}
            />
            <FormInput
              label="Experience (Years)"
              name="experience"
              type="number"
              min="0"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
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
              {actionLoading ? "Registering..." : "Add Surveyor"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= EDIT SURVEYOR MODAL ================= */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Surveyor Details"
        maxWidth="600px"
      >
        <form onSubmit={handleEditSubmit}>
          <FormInput
            label="Surveyor Full Name"
            name="surveyor_name"
            value={formData.surveyor_name}
            onChange={(e) => setFormData({ ...formData, surveyor_name: e.target.value })}
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
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="License Number"
              name="license_no"
              value={formData.license_no}
              onChange={(e) => setFormData({ ...formData, license_no: e.target.value })}
            />
            <FormInput
              label="Experience (Years)"
              name="experience"
              type="number"
              min="0"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
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
        title="Delete Surveyor"
        message={`Are you sure you want to remove surveyor ${selectedSurveyor?.surveyor_name}?`}
        confirmText="Confirm Deletion"
        isDanger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default Surveyors;
