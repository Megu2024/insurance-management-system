import { useState, useEffect } from "react";
import { Plus, Eye, Edit, Trash2, CheckCircle, XCircle, Search, ClipboardCheck, HeartPulse } from "lucide-react";
import {
  getClaims,
  getClaimById,
  createClaim,
  updateClaim,
  deleteClaim
} from "../services/claimService";
import { getPolicies } from "../services/policyService";
import { getSurveyors } from "../services/surveyorService";
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

const Claims = () => {
  const { role, user } = useAuth();
  const isAdmin = role === "ADMIN";
  const isSurveyor = role === "SURVEYOR";
  const isCustomer = role === "CUSTOMER";
  const isAgent = role === "AGENT";

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [policies, setPolicies] = useState([]);
  const [surveyors, setSurveyors] = useState([]);

  // Modals
  const [isFileClaimOpen, setIsFileClaimOpen] = useState(false);
  const [isProcessOpen, setIsProcessOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Form State
  const initialForm = {
    policy_id: "",
    claim_amount: "",
    claim_date: new Date().toISOString().split("T")[0],
    description: "",
    claim_status: "Pending",
    surveyor_id: "",
    approve_amt: 0
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchClaimsList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getClaims({ search, status: statusFilter });
      setClaims(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch claims list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimsList();
  }, [search, statusFilter]);

  // Load policies & surveyors for filing/processing
  useEffect(() => {
    getPolicies()
      .then((data) => setPolicies(data))
      .catch(console.error);

    if (isAdmin || isSurveyor) {
      getSurveyors()
        .then((data) => setSurveyors(data))
        .catch(console.error);
    }
  }, [isAdmin, isSurveyor]);

  // View Claim Details
  const handleView = async (cl) => {
    setActionLoading(true);
    try {
      const detailed = await getClaimById(cl.claim_id);
      setSelectedClaim(detailed);
      setIsViewOpen(true);
    } catch (err) {
      console.error(err);
      setError("Failed to load claim details.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Process / Review Modal (Admin & Surveyor)
  const handleOpenProcess = (cl) => {
    setSelectedClaim(cl);
    setFormData({
      policy_id: cl.policy_id,
      claim_amount: cl.claim_amount,
      claim_date: cl.claim_date ? cl.claim_date.split("T")[0] : "",
      description: cl.description || "",
      claim_status: cl.claim_status || "Pending",
      surveyor_id: cl.surveyor_id || "",
      approve_amt: cl.approve_amt || 0
    });
    setIsProcessOpen(true);
  };

  // Submit File Claim
  const handleFileClaimSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createClaim(formData);
      setIsFileClaimOpen(false);
      setFormData(initialForm);
      fetchClaimsList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to lodge claim.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Process Claim
  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updateClaim(selectedClaim.claim_id, formData);
      setIsProcessOpen(false);
      fetchClaimsList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update claim.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Delete Claim
  const handleDeleteConfirm = async () => {
    if (!selectedClaim) return;
    setActionLoading(true);
    try {
      await deleteClaim(selectedClaim.claim_id);
      setIsDeleteOpen(false);
      fetchClaimsList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete claim.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: "Claim ID", accessor: "claim_id", sortable: true, style: { width: "80px" }, render: (val) => <span className="font-mono font-medium">#{val}</span> },
    { header: "Policy No", accessor: "policy_no", sortable: true, render: (val) => <span className="font-mono">{val}</span> },
    { header: "Claimant Name", accessor: "customer_name" },
    { header: "Claim Date", accessor: "claim_date", render: (val) => formatDate(val) },
    { header: "Claimed Amount (₹)", accessor: "claim_amount", render: (val) => `₹${parseFloat(val || 0).toLocaleString("en-IN")}` },
    { header: "Approved Amount (₹)", accessor: "approve_amt", render: (val) => `₹${parseFloat(val || 0).toLocaleString("en-IN")}` },
    { header: "Assigned Surveyor", accessor: "surveyor_name", render: (val) => val || <span style={{ color: "#94a3b8" }}>Unassigned</span> },
    { header: "Status", accessor: "claim_status", render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="claims-page">
      <PageHeader
        title={isSurveyor ? "Assigned Inspection Claims" : isCustomer ? "My Insurance Claims" : "Claim Management"}
        description="Comprehensive claim adjudication, damage inspection, and settlement workflow"
        actions={
          (isAdmin || isCustomer || isAgent) && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setFormData(initialForm);
                setIsFileClaimOpen(true);
              }}
            >
              <Plus size={16} />
              <span>File New Claim</span>
            </button>
          )
        }
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by claim ID, policy no, claimant, or surveyor..."
        />

        <div className="filter-group">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Settled">Settled</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={claims}
        keyField="claim_id"
        loading={loading}
        emptyMessage="No claims found matching your filter criteria."
        actions={(row) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleView(row)}
              title="View Claim Details"
            >
              <Eye size={15} />
            </button>
            {(isAdmin || isSurveyor) && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleOpenProcess(row)}
                title="Review & Adjudicate Claim"
              >
                <ClipboardCheck size={15} />
                <span>Process</span>
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: "#dc2626" }}
                onClick={() => {
                  setSelectedClaim(row);
                  setIsDeleteOpen(true);
                }}
                title="Delete Claim"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      />

      {/* ================= VIEW CLAIM DETAILS MODAL ================= */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Claim #${selectedClaim?.claim_id} Evaluation Overview`}
        maxWidth="760px"
      >
        {selectedClaim && (
          <div>
            <div className="detail-card">
              <h4 className="detail-card-title">Claim & Policy Summary</h4>
              <div className="grid-2">
                <div className="detail-row">
                  <span className="detail-label">Claim ID:</span>
                  <span className="detail-value font-mono">#{selectedClaim.claim_id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Claim Status:</span>
                  <span className="detail-value"><StatusBadge status={selectedClaim.claim_status} /></span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Policy Number:</span>
                  <span className="detail-value font-mono font-medium">{selectedClaim.policy_no}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Policyholder:</span>
                  <span className="detail-value">{selectedClaim.customer_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Claim Date:</span>
                  <span className="detail-value">{formatDate(selectedClaim.claim_date)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Claimed Sum:</span>
                  <span className="detail-value font-medium">₹{parseFloat(selectedClaim.claim_amount || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Approved Sum:</span>
                  <span className="detail-value font-medium" style={{ color: "#059669" }}>₹{parseFloat(selectedClaim.approve_amt || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Policy Coverage:</span>
                  <span className="detail-value">₹{parseFloat(selectedClaim.sum_coverage || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
              <div style={{ marginTop: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
                <span className="detail-label" style={{ display: "block", marginBottom: "4px" }}>Claim Description / Incident:</span>
                <p style={{ fontSize: "14px", color: "#334155", margin: 0 }}>{selectedClaim.description || "No description provided."}</p>
              </div>
            </div>

            {/* Assigned Surveyor */}
            <div className="detail-card">
              <h4 className="detail-card-title">Surveyor Assessment</h4>
              {selectedClaim.surveyor_name ? (
                <div className="grid-2">
                  <div className="detail-row"><span className="detail-label">Surveyor:</span><span className="detail-value font-medium">{selectedClaim.surveyor_name}</span></div>
                  <div className="detail-row"><span className="detail-label">Phone:</span><span className="detail-value">{selectedClaim.surveyor_phone || "—"}</span></div>
                  <div className="detail-row"><span className="detail-label">Email:</span><span className="detail-value">{selectedClaim.surveyor_email || "—"}</span></div>
                  <div className="detail-row"><span className="detail-label">License:</span><span className="detail-value font-mono">{selectedClaim.surveyor_license || "—"}</span></div>
                </div>
              ) : (
                <p style={{ color: "#64748b", fontSize: "13.5px" }}>No surveyor has been assigned to inspect this claim yet.</p>
              )}
            </div>

            {/* Linked Hospital Records */}
            <div className="detail-card">
              <h4 className="detail-card-title">Linked Hospital / Medical Records ({(selectedClaim.hospitals || []).length})</h4>
              {(selectedClaim.hospitals || []).length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "13.5px" }}>No hospital admission records linked to this claim.</p>
              ) : (
                <div className="table-responsive">
                  <table className="dash-table">
                    <thead>
                      <tr><th>Hospital</th><th>City</th><th>Admission Date</th><th>Discharge Date</th><th>Bill Amount</th></tr>
                    </thead>
                    <tbody>
                      {selectedClaim.hospitals.map((h) => (
                        <tr key={h.hospital_id}>
                          <td>{h.hospital_name}</td>
                          <td>{h.city}</td>
                          <td>{formatDate(h.admission_date)}</td>
                          <td>{formatDate(h.discharge_date)}</td>
                          <td>₹{parseFloat(h.bill_amt || 0).toLocaleString("en-IN")}</td>
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

      {/* ================= FILE NEW CLAIM MODAL ================= */}
      <Modal
        isOpen={isFileClaimOpen}
        onClose={() => setIsFileClaimOpen(false)}
        title="Lodge New Insurance Claim"
        maxWidth="620px"
      >
        <form onSubmit={handleFileClaimSubmit}>
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
          />

          <div className="grid-2">
            <FormInput
              label="Claim Amount (₹)"
              name="claim_amount"
              type="number"
              min="1"
              value={formData.claim_amount}
              onChange={(e) => setFormData({ ...formData, claim_amount: e.target.value })}
              required
            />
            <FormInput
              label="Incident / Claim Date"
              name="claim_date"
              type="date"
              value={formData.claim_date}
              onChange={(e) => setFormData({ ...formData, claim_date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Incident Description & Damage Details</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Provide a detailed account of the loss, damage, or hospitalization..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsFileClaimOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? "Submitting..." : "Submit Claim"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= PROCESS / ADJUDICATE CLAIM MODAL ================= */}
      <Modal
        isOpen={isProcessOpen}
        onClose={() => setIsProcessOpen(false)}
        title={`Adjudicate Claim #${selectedClaim?.claim_id}`}
        maxWidth="680px"
      >
        <form onSubmit={handleProcessSubmit}>
          <div className="grid-2">
            <SelectInput
              label="Claim Adjudication Status"
              name="claim_status"
              value={formData.claim_status}
              onChange={(e) => setFormData({ ...formData, claim_status: e.target.value })}
              options={[
                { value: "Pending", label: "Pending" },
                { value: "Under Review", label: "Under Review" },
                { value: "Approved", label: "Approved" },
                { value: "Rejected", label: "Rejected" },
                { value: "Settled", label: "Settled" }
              ]}
              required
            />

            <FormInput
              label="Approved Settlement Amount (₹)"
              name="approve_amt"
              type="number"
              min="0"
              value={formData.approve_amt}
              onChange={(e) => setFormData({ ...formData, approve_amt: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <SelectInput
              label="Assign Claim Surveyor"
              name="surveyor_id"
              value={formData.surveyor_id}
              onChange={(e) => setFormData({ ...formData, surveyor_id: e.target.value })}
              options={surveyors.map((s) => ({
                value: s.surveyor_id,
                label: `${s.surveyor_name} (${s.experience || 0} yrs exp)`
              }))}
              placeholder="Unassigned (Select Surveyor)"
            />

            <FormInput
              label="Claim Amount (Original ₹)"
              name="claim_amount"
              type="number"
              value={formData.claim_amount}
              onChange={(e) => setFormData({ ...formData, claim_amount: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Surveyor / Adjudication Notes</label>
            <textarea
              className="form-control"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsProcessOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? "Updating..." : "Save Adjudication"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= DELETE CONFIRM DIALOG ================= */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Claim Record"
        message={`Are you sure you want to permanently delete Claim #${selectedClaim?.claim_id}? This cannot be undone.`}
        confirmText="Confirm Deletion"
        isDanger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default Claims;
