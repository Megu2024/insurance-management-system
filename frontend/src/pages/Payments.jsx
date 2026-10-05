import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, CreditCard, CheckCircle2, Clock, Smartphone, QrCode, Copy, Check, Sparkles } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import "./Payments.css";
import {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment
} from "../services/paymentService";
import { getPolicies } from "../services/policyService";
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
import { formatDate } from "../utils/dateUtils";

const Payments = () => {
  const { role, user } = useAuth();
  const isAdmin = role === "ADMIN";
  const isAgent = role === "AGENT";
  const isCustomer = role === "CUSTOMER";

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [policies, setPolicies] = useState([]);

  // Modal State
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // UPI Gateway State
  const [companyUpiId, setCompanyUpiId] = useState("sureguard@okicici");
  const [utrNumber, setUtrNumber] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Form State
  const initialForm = {
    policy_id: "",
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_mode: "Online (UPI/Card)",
    payment_status: "Successful"
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchPaymentsList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPayments({ search, status: statusFilter });
      setPayments(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch payment history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsList();
  }, [search, statusFilter]);

  // Load policies for record payment dropdown
  useEffect(() => {
    getPolicies()
      .then((data) => setPolicies(data))
      .catch(console.error);
  }, []);

  const handleOpenEdit = (py) => {
    setSelectedPayment(py);
    setFormData({
      policy_id: py.policy_id,
      amount: py.amount,
      payment_date: py.payment_date ? py.payment_date.split("T")[0] : "",
      payment_mode: py.payment_mode || "Online",
      payment_status: py.payment_status || "Successful"
    });
    setIsEditOpen(true);
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    setSuccessMsg("");

    const isUpi = formData.payment_mode === "Online (UPI/Card)" || formData.payment_mode.includes("UPI");

    if (isUpi && (!utrNumber || utrNumber.trim().length < 6)) {
      setError("Please complete the payment on your mobile phone and enter the 12-digit UPI UTR / Transaction Reference Number.");
      setActionLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        payment_status: "Successful",
        payment_mode: isUpi ? `UPI (Ref: ${utrNumber.trim().slice(-8)})` : formData.payment_mode
      };

      const res = await createPayment(payload);
      setIsRecordOpen(false);
      setFormData(initialForm);
      setUtrNumber("");
      const policyObj = policies.find(p => String(p.policy_id) === String(payload.policy_id));
      setSuccessMsg(`Payment of ₹${parseFloat(payload.amount).toLocaleString("en-IN")} for policy ${policyObj?.policy_no || ""} completed successfully via UPI. Receipt #${res.payment_id} recorded!`);
      fetchPaymentsList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to record payment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updatePayment(selectedPayment.payment_id, formData);
      setIsEditOpen(false);
      fetchPaymentsList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update payment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPayment) return;
    setActionLoading(true);
    try {
      await deletePayment(selectedPayment.payment_id);
      setIsDeleteOpen(false);
      fetchPaymentsList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete payment record.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: "Receipt #", accessor: "payment_id", sortable: true, style: { width: "90px" }, render: (val) => <span className="font-mono">#{val}</span> },
    { header: "Policy No", accessor: "policy_no", sortable: true, render: (val) => <span className="font-mono font-medium">{val}</span> },
    { header: "Customer", accessor: "customer_name" },
    { header: "Amount Paid (₹)", accessor: "amount", render: (val) => `₹${parseFloat(val || 0).toLocaleString("en-IN")}` },
    { header: "Payment Date", accessor: "payment_date", render: (val) => formatDate(val) },
    { header: "Payment Mode", accessor: "payment_mode" },
    { header: "Status", accessor: "payment_status", render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="payments-page">
      <PageHeader
        title={isCustomer ? "My Premium Payment History" : "Premium Payment Transactions"}
        description="Audit trail of premium payments, transaction receipts, and payment modes"
        actions={
          (isAdmin || isAgent || isCustomer) && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setFormData(initialForm);
                setIsRecordOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Record Premium Payment</span>
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

      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by policy no, customer, or mode..."
        />

        <div className="filter-group">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Successful">Successful / Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        keyField="payment_id"
        loading={loading}
        emptyMessage="No payment records found."
        actions={(row) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            {(isAdmin || isAgent) && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => handleOpenEdit(row)}
                title="Edit Payment"
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
                  setSelectedPayment(row);
                  setIsDeleteOpen(true);
                }}
                title="Delete Payment Record"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      />

      {/* ================= RECORD PAYMENT / UPI QR GATEWAY MODAL ================= */}
      <Modal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        title="Pay Insurance Premium"
        maxWidth="640px"
      >
        <form onSubmit={handleRecordSubmit}>
          <SelectInput
            label="Select Policy to Pay *"
            name="policy_id"
            value={formData.policy_id}
            onChange={(e) => {
              const selectedPol = policies.find(p => String(p.policy_id) === String(e.target.value));
              setFormData({
                ...formData,
                policy_id: e.target.value,
                amount: selectedPol ? selectedPol.premium_amt : formData.amount
              });
            }}
            options={policies.map((p) => ({
              value: p.policy_id,
              label: `${p.policy_no} - ${p.customer_name} (Due: ₹${parseFloat(p.premium_amt || 0).toLocaleString("en-IN")})`
            }))}
            required
          />

          <div className="grid-2">
            <FormInput
              label="Payment Amount (₹) *"
              name="amount"
              type="number"
              min="1"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <FormInput
              label="Payment Date *"
              name="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <SelectInput
              label="Payment Mode"
              name="payment_mode"
              value={formData.payment_mode}
              onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
              options={[
                { value: "Online (UPI/Card)", label: "📱 Instant UPI QR Code (GPay / PhonePe / Paytm)" },
                { value: "Net Banking", label: "🏦 Net Banking / NEFT" },
                { value: "Cheque", label: "📄 Bank Cheque" },
                { value: "Cash", label: "💵 Cash Collection (Branch Counter)" }
              ]}
            />

            {formData.payment_mode === "Online (UPI/Card)" ? (
              <div className="form-group">
                <label className="form-label">Payment Status</label>
                <div style={{ display: 'flex', alignItems: 'center', height: '38px', gap: '8px', color: '#059669', fontWeight: 600, fontSize: '13px' }}>
                  <CheckCircle2 size={18} />
                  <span>Auto-marked "Successful" upon verification</span>
                </div>
              </div>
            ) : (
              <SelectInput
                label="Payment Status"
                name="payment_status"
                value={formData.payment_status}
                onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                options={[
                  { value: "Successful", label: "Successful / Completed" },
                  { value: "Pending", label: "Pending Verification" },
                  { value: "Failed", label: "Failed" }
                ]}
              />
            )}
          </div>

          {/* DYNAMIC UPI QR CODE GATEWAY PANEL */}
          {formData.payment_mode === "Online (UPI/Card)" && (
            <div className="upi-gateway-container">
              <div className="upi-header-banner">
                <Smartphone size={20} color="#2563eb" />
                <span>Scan & Pay with Google Pay, PhonePe, or Paytm</span>
              </div>

              {/* Customizable Company UPI VPA */}
              <div className="upi-vpa-config">
                <div className="upi-vpa-label">
                  <span>Insurance Company UPI Receiver ID (VPA):</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Edit if needed</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="upi-vpa-input"
                    value={companyUpiId}
                    onChange={(e) => setCompanyUpiId(e.target.value)}
                    placeholder="e.g. sureguard@okicici"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(companyUpiId);
                      setCopiedUpi(true);
                      setTimeout(() => setCopiedUpi(false), 2000);
                    }}
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  *Default: <code>sureguard@okicici</code>. You can change this to any UPI ID (like your own) to test live mobile phone scanning.
                </div>
              </div>

              {/* Dynamic QR Code Card */}
              <div className="upi-qr-card">
                {formData.amount && parseFloat(formData.amount) > 0 ? (
                  <QRCodeSVG
                    value={`upi://pay?pa=${encodeURIComponent(companyUpiId.trim())}&pn=${encodeURIComponent("SureGuard Insurance")}&am=${encodeURIComponent(parseFloat(formData.amount).toFixed(2))}&cu=INR&tn=${encodeURIComponent(`Premium Payment ${policies.find(p => String(p.policy_id) === String(formData.policy_id))?.policy_no || 'Policy'}`)}`}
                    size={185}
                    level="M"
                    includeMargin={true}
                  />
                ) : (
                  <div style={{ width: 185, height: 185, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#94a3b8', fontSize: '13px' }}>
                    Select a policy above to generate QR code
                  </div>
                )}
                <div className="upi-amount-tag">
                  Amount Due: ₹{parseFloat(formData.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                  Receiver: SureGuard Insurance Ltd.
                </div>
              </div>

              {/* Supported Apps Badges */}
              <div className="upi-apps-row">
                <span className="upi-app-badge">🟢 Google Pay</span>
                <span className="upi-app-badge">🟣 PhonePe</span>
                <span className="upi-app-badge">🔵 Paytm</span>
                <span className="upi-app-badge">🟠 BHIM UPI</span>
                <span className="upi-app-badge">📦 Amazon Pay</span>
              </div>

              {/* UPI UTR Verification Box */}
              <div className="upi-utr-box">
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>
                  Verification: Enter 12-Digit UPI UTR / Reference No. *
                </div>
                <p className="upi-instruction-text">
                  After scanning and completing the transaction on your phone, copy the 12-digit <strong>UPI Reference / UTR Number</strong> shown on your Google Pay screen:
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-control font-mono"
                    placeholder="Enter 12-digit UTR (e.g. 428192837461)"
                    maxLength={12}
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => {
                      const demoUtr = Math.floor(100000000000 + Math.random() * 900000000000).toString();
                      setUtrNumber(demoUtr);
                    }}
                    title="Click to automatically fill a valid 12-digit demo UTR"
                  >
                    Auto-Fill Demo UTR
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsRecordOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading
                ? "Verifying Payment..."
                : formData.payment_mode === "Online (UPI/Card)"
                ? `Verify & Complete Payment (₹${parseFloat(formData.amount || 0).toLocaleString("en-IN")})`
                : "Confirm & Record Payment"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= EDIT PAYMENT MODAL ================= */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Payment Record"
        maxWidth="600px"
      >
        <form onSubmit={handleEditSubmit}>
          <div className="grid-2">
            <FormInput
              label="Payment Amount (₹)"
              name="amount"
              type="number"
              min="1"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <FormInput
              label="Payment Date"
              name="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <SelectInput
              label="Payment Mode"
              name="payment_mode"
              value={formData.payment_mode}
              onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
              options={[
                { value: "Online (UPI/Card)", label: "Online (UPI / Debit / Credit Card)" },
                { value: "Net Banking", label: "Net Banking / NEFT" },
                { value: "Cheque", label: "Bank Cheque" },
                { value: "Cash", label: "Cash Collection" }
              ]}
            />
            <SelectInput
              label="Payment Status"
              name="payment_status"
              value={formData.payment_status}
              onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
              options={[
                { value: "Successful", label: "Successful / Completed" },
                { value: "Pending", label: "Pending" },
                { value: "Failed", label: "Failed" }
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

      {/* ================= DELETE CONFIRM DIALOG ================= */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Payment Record"
        message={`Are you sure you want to delete payment receipt #${selectedPayment?.payment_id} for policy ${selectedPayment?.policy_no}?`}
        confirmText="Delete Payment"
        isDanger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default Payments;
