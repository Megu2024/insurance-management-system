import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  FileText,
  UploadCloud,
  Eye,
  Download,
  Paperclip,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument
} from "../services/documentService";
import { getCustomers } from "../services/customerService";
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
import "./Documents.css";

const DOCUMENT_TYPES = [
  { value: "Aadhaar Card", label: "Aadhaar Card" },
  { value: "PAN Card", label: "PAN Card" },
  { value: "Passport", label: "Passport" },
  { value: "Driving License", label: "Driving License" },
  { value: "Voter ID", label: "Voter ID" },
  { value: "Income Proof / ITR", label: "Income Proof / ITR" },
  { value: "Salary Slip", label: "Salary Slip (Last 3 Months)" },
  { value: "Bank Statement", label: "Bank Account Statement / Cancelled Cheque" },
  { value: "Medical History", label: "Medical History / Health Certificate" },
  { value: "Vehicle RC", label: "Vehicle Registration Certificate (RC)" },
  { value: "Property Deed", label: "Property Ownership Deed / Title" },
  { value: "Business Registration / GST", label: "Business Registration / GST Certificate" },
  { value: "Utility Bill / Address Proof", label: "Utility Bill / Address Proof" },
  { value: "Policy Proposal Form", label: "Policy Proposal Form" },
  { value: "Other Supporting Document", label: "Other Supporting Document" }
];

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const Documents = () => {
  const { role, user } = useAuth();
  const isAdmin = role === "ADMIN";
  const isCustomer = role === "CUSTOMER";

  const [documents, setDocuments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Multi-document rows state for the upload modal
  const multiFileInputRef = useRef(null);
  const [targetCustomerId, setTargetCustomerId] = useState("");
  const [initialStatus, setInitialStatus] = useState("Pending");

  const createEmptyRow = (id = Date.now()) => ({
    id,
    doc_type: "Aadhaar Card",
    custom_doc_name: "",
    doc_no: "",
    file_name: "",
    file_type: "",
    file_size: 0,
    file_data: "",
    previewUrl: null
  });

  const [docRows, setDocRows] = useState([createEmptyRow()]);

  // Edit single doc state
  const [editFormData, setEditFormData] = useState({
    doc_type: "Aadhaar Card",
    custom_doc_name: "",
    doc_no: "",
    verification_status: "Pending",
    file_name: "",
    file_type: "",
    file_size: 0,
    file_data: "",
    previewUrl: null
  });

  const fetchDocumentsList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDocuments({ search, status: statusFilter });
      setDocuments(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentsList();
  }, [search, statusFilter]);

  useEffect(() => {
    if (!isCustomer) {
      getCustomers()
        .then((data) => {
          setCustomers(data || []);
          if (data && data.length > 0 && !targetCustomerId) {
            setTargetCustomerId(data[0].customer_id);
          }
        })
        .catch(console.error);
    }
  }, [isCustomer]);

  // Helper to convert File to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Guess document type from file name
  const guessDocType = (fileName) => {
    const lower = fileName.toLowerCase();
    if (lower.includes("aadhaar") || lower.includes("aadhar") || lower.includes("uidai")) return "Aadhaar Card";
    if (lower.includes("pan") || lower.includes("pancard")) return "PAN Card";
    if (lower.includes("passport")) return "Passport";
    if (lower.includes("license") || lower.includes("driving") || lower.includes("dl")) return "Driving License";
    if (lower.includes("voter") || lower.includes("epic")) return "Voter ID";
    if (lower.includes("itr") || lower.includes("tax") || lower.includes("income")) return "Income Proof / ITR";
    if (lower.includes("salary") || lower.includes("payslip")) return "Salary Slip";
    if (lower.includes("bank") || lower.includes("cheque") || lower.includes("statement")) return "Bank Statement";
    if (lower.includes("medical") || lower.includes("health") || lower.includes("hospital")) return "Medical History";
    if (lower.includes("rc") || lower.includes("vehicle")) return "Vehicle RC";
    if (lower.includes("property") || lower.includes("deed") || lower.includes("land")) return "Property Deed";
    if (lower.includes("gst") || lower.includes("business")) return "Business Registration / GST";
    return "Other Supporting Document";
  };

  // Add another empty row to the upload list
  const handleAddRow = () => {
    setDocRows((prev) => [...prev, createEmptyRow(Date.now() + Math.random())]);
  };

  // Remove a row
  const handleRemoveRow = (rowId) => {
    if (docRows.length <= 1) return;
    setDocRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  // Update a field in a row
  const handleRowChange = (rowId, field, value) => {
    setDocRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r))
    );
  };

  // Handle single file selection for a specific row
  const handleRowFileSelect = async (rowId, file) => {
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      const isImg = file.type.startsWith("image/");
      setDocRows((prev) =>
        prev.map((r) => {
          if (r.id === rowId) {
            return {
              ...r,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              file_data: base64,
              previewUrl: isImg ? base64 : null,
              doc_type: r.doc_type === "Aadhaar Card" && !r.doc_no ? guessDocType(file.name) : r.doc_type
            };
          }
          return r;
        })
      );
    } catch (err) {
      console.error("Error reading file:", err);
      setError("Failed to process file. Please try a different file.");
    }
  };

  // Handle multi-file bulk drop / browse
  const handleMultiFilesSelected = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);

    const newRows = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const base64 = await fileToBase64(file);
      const isImg = file.type.startsWith("image/");
      newRows.push({
        id: Date.now() + i,
        doc_type: guessDocType(file.name),
        doc_no: "",
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_data: base64,
        previewUrl: isImg ? base64 : null
      });
    }

    setDocRows((prev) => {
      const hasInitialData = prev.some((r) => r.file_name || r.doc_no);
      if (!hasInitialData) {
        return newRows;
      }
      return [...prev, ...newRows];
    });
  };

  // Submit all document rows
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");

    const custId = isCustomer ? user.customer_id : targetCustomerId;
    if (!custId) {
      setError("Please select a customer for document upload.");
      setActionLoading(false);
      return;
    }

    for (let i = 0; i < docRows.length; i++) {
      if (!docRows[i].doc_type) {
        setError(`Please select a Document Type for Document #${i + 1}`);
        setActionLoading(false);
        return;
      }
      if (
        (docRows[i].doc_type === "Other Supporting Document" || docRows[i].doc_type === "Other Document") &&
        !docRows[i].custom_doc_name?.trim()
      ) {
        setError(`Please enter the document name for Document #${i + 1}`);
        setActionLoading(false);
        return;
      }
      if (!docRows[i].file_name || !docRows[i].file_data) {
        setError(`Please upload a document file for Document #${i + 1}`);
        setActionLoading(false);
        return;
      }
    }

    try {
      const payload = {
        customer_id: custId,
        verification_status: initialStatus,
        documents: docRows.map((r) => ({
          customer_id: custId,
          doc_type: (r.doc_type === "Other Supporting Document" || r.doc_type === "Other Document")
            ? (r.custom_doc_name?.trim() || "Other Supporting Document")
            : r.doc_type,
          doc_no: r.doc_no && r.doc_no.trim() ? r.doc_no.trim() : null,
          verification_status: initialStatus,
          file_name: r.file_name || null,
          file_type: r.file_type || null,
          file_size: r.file_size || null,
          file_data: r.file_data || null
        }))
      };

      const res = await createDocument(payload);
      setSuccessMsg(
        res.message || `${docRows.length} document(s) uploaded successfully!`
      );
      setTimeout(() => setSuccessMsg(""), 5000);

      setIsUploadOpen(false);
      setDocRows([createEmptyRow()]);
      fetchDocumentsList();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to upload document(s).");
    } finally {
      setActionLoading(false);
    }
  };

  // Open view modal and load document full data
  const handleViewDoc = async (doc) => {
    setSelectedDoc(doc);
    setIsViewOpen(true);
    setViewLoading(true);
    try {
      const fullDoc = await getDocumentById(doc.document_id);
      setViewingDoc(fullDoc);
    } catch (err) {
      console.error(err);
      setError("Failed to load document content.");
      setViewingDoc(doc);
    } finally {
      setViewLoading(false);
    }
  };

  // Download document file locally
  const handleDownloadFile = (doc) => {
    if (!doc || !doc.file_data) {
      setError("No file content attached to this document.");
      return;
    }
    const link = document.createElement("a");
    link.href = doc.file_data;
    link.download = doc.file_name || `${doc.doc_type.replace(/\s+/g, "_")}_${doc.doc_no || doc.document_id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open edit modal
  const handleOpenEdit = async (doc) => {
    setSelectedDoc(doc);
    const isPredefined = DOCUMENT_TYPES.some((t) => t.value === doc.doc_type && t.value !== "Other Supporting Document");
    setEditFormData({
      doc_type: isPredefined ? doc.doc_type : "Other Supporting Document",
      custom_doc_name: isPredefined ? "" : doc.doc_type,
      doc_no: doc.doc_no || "",
      verification_status: doc.verification_status || "Pending",
      file_name: doc.file_name || "",
      file_type: doc.file_type || "",
      file_size: doc.file_size || 0,
      file_data: "",
      previewUrl: null
    });
    setIsEditOpen(true);

    try {
      const fullDoc = await getDocumentById(doc.document_id);
      if (fullDoc && fullDoc.file_data) {
        setEditFormData((prev) => ({
          ...prev,
          file_name: fullDoc.file_name || prev.file_name,
          file_type: fullDoc.file_type || prev.file_type,
          file_size: fullDoc.file_size || prev.file_size,
          file_data: fullDoc.file_data,
          previewUrl: fullDoc.file_type?.startsWith("image/") ? fullDoc.file_data : null
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit single file replace
  const handleEditFileSelect = async (file) => {
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      const isImg = file.type.startsWith("image/");
      setEditFormData((prev) => ({
        ...prev,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_data: base64,
        previewUrl: isImg ? base64 : null
      }));
    } catch (err) {
      console.error("Error reading file:", err);
      setError("Failed to read file.");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const finalDocType =
        (editFormData.doc_type === "Other Supporting Document" || editFormData.doc_type === "Other Document")
          ? (editFormData.custom_doc_name?.trim() || "Other Supporting Document")
          : editFormData.doc_type;

      const updatePayload = {
        doc_type: finalDocType,
        doc_no: editFormData.doc_no,
        verification_status: editFormData.verification_status
      };
      if (editFormData.file_data) {
        updatePayload.file_name = editFormData.file_name;
        updatePayload.file_type = editFormData.file_type;
        updatePayload.file_size = editFormData.file_size;
        updatePayload.file_data = editFormData.file_data;
      }
      await updateDocument(selectedDoc.document_id, updatePayload);
      setIsEditOpen(false);
      setSuccessMsg("Document updated successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
      fetchDocumentsList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update document.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (doc, newStatus) => {
    setActionLoading(true);
    try {
      await updateDocument(doc.document_id, { verification_status: newStatus });
      fetchDocumentsList();
    } catch (err) {
      setError("Failed to update verification status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (doc) => {
    setSelectedDoc(doc);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDoc) return;
    setActionLoading(true);
    try {
      await deleteDocument(selectedDoc.document_id);
      setIsDeleteOpen(false);
      setIsViewOpen(false);
      setSuccessMsg(`Document "${selectedDoc.doc_type}" (${selectedDoc.file_name || selectedDoc.doc_no || "#" + selectedDoc.document_id}) was deleted successfully.`);
      setTimeout(() => setSuccessMsg(""), 5000);
      fetchDocumentsList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete document.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: "Doc ID",
      accessor: "document_id",
      sortable: true,
      style: { width: "80px" },
      render: (val) => <span className="font-mono">#{val}</span>
    },
    {
      header: "Document Type",
      accessor: "doc_type",
      render: (val) => (
        <span style={{ fontWeight: 600, color: "#1e293b", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Paperclip size={14} style={{ color: "#3b82f6" }} />
          {val}
        </span>
      )
    },
    {
      header: "Attached File",
      accessor: "file_name",
      render: (val, row) => {
        if (!val && !row.has_file) {
          return <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>— No file attached</span>;
        }
        const isImg = row.file_type && row.file_type.startsWith("image/");
        return (
          <div className="table-file-badge">
            {isImg ? (
              <ImageIcon size={16} style={{ color: "#0284c7", flexShrink: 0 }} />
            ) : (
              <FileText size={16} style={{ color: "#dc2626", flexShrink: 0 }} />
            )}
            <span className="table-file-name" title={val || "Document File"}>
              {val || "Document File"}
            </span>
            {row.file_size > 0 && (
              <span className="table-file-size">{formatBytes(row.file_size)}</span>
            )}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ padding: "2px 6px", height: "auto", fontSize: "0.75rem" }}
              onClick={(e) => {
                e.stopPropagation();
                handleViewDoc(row);
              }}
              title="View / Download file"
            >
              <Eye size={12} />
              <span>View</span>
            </button>
          </div>
        );
      }
    },
    ...(!isCustomer
      ? [
          {
            header: "Customer ID",
            accessor: "customer_id",
            sortable: true,
            style: { width: "110px" },
            render: (val) => <span className="font-mono font-medium">#{val}</span>
          },
          {
            header: "Customer Name",
            accessor: "customer_name"
          }
        ]
      : []),
    {
      header: "Verification Status",
      accessor: "verification_status",
      render: (val) => <StatusBadge status={val} />
    }
  ];

  return (
    <div className="documents-page">
      <PageHeader
        title={isCustomer ? "My Verification Documents" : "Customer Verification Documents"}
        description="Upload official identity proofs, income statements, KYC documents, and policy forms"
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setDocRows([createEmptyRow()]);
              if (customers.length > 0 && !targetCustomerId) {
                setTargetCustomerId(customers[0].customer_id);
              }
              setIsUploadOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Upload Documents</span>
          </button>
        }
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

      {successMsg && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#ecfdf5",
            border: "1px solid #6ee7b7",
            color: "#065f46",
            padding: "12px 18px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "0.9rem",
            fontWeight: 500
          }}
        >
          <CheckCircle2 size={18} style={{ color: "#059669", flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={isCustomer ? "Search by doc type, file name, or verification status..." : "Search by doc type, document number, file name, or customer..."}
        />

        <div className="filter-group">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Verification Statuses</option>
            <option value="Pending">Pending Verification</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={documents}
        keyField="document_id"
        loading={loading}
        emptyMessage="No documents found."
        actions={(row) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleViewDoc(row)}
              title="View Document Details / File"
            >
              <Eye size={15} />
            </button>

            {isAdmin && row.verification_status !== "Verified" && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: "#059669", borderColor: "#a7f3d0" }}
                onClick={() => handleStatusChange(row, "Verified")}
                title="Mark as Verified"
              >
                <Check size={15} />
              </button>
            )}

            {isAdmin && row.verification_status !== "Rejected" && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: "#dc2626", borderColor: "#fecaca" }}
                onClick={() => handleStatusChange(row, "Rejected")}
                title="Mark as Rejected"
              >
                <X size={15} />
              </button>
            )}

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleOpenEdit(row)}
              title="Edit Document Info"
            >
              <Edit size={15} />
            </button>

            {/* Delete Document Option - Available for Admin and the Document Owner */}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ color: "#dc2626", borderColor: "#fecaca" }}
              onClick={() => handleDeleteClick(row)}
              title="Delete Document"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      />

      {/* ================= MULTI-DOCUMENT UPLOAD MODAL ================= */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Verification Documents"
        maxWidth="740px"
      >
        <form onSubmit={handleUploadSubmit}>
          <div className="doc-modal-container">
            {/* Customer Selection for Admin */}
            {!isCustomer && (
              <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <SelectInput
                  label="Select Customer"
                  name="targetCustomerId"
                  value={targetCustomerId}
                  onChange={(e) => setTargetCustomerId(e.target.value)}
                  options={customers.map((c) => ({
                    value: c.customer_id,
                    label: `#${c.customer_id} - ${c.first_name} ${c.last_name} (${c.email})`
                  }))}
                  required
                />
              </div>
            )}

            {/* Quick multi-file drag and drop zone */}
            <div
              className="quick-drop-zone"
              onClick={() => multiFileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("active");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("active");
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("active");
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleMultiFilesSelected(e.dataTransfer.files);
                }
              }}
            >
              <UploadCloud size={32} style={{ color: "#2563eb" }} />
              <div className="quick-drop-title">
                Click or Drop Multiple Files Here to Add Multiple Documents
              </div>
              <div className="quick-drop-hint">
                Supports PDF, JPG, PNG, WEBP — You can add as many documents as you want!
              </div>
              <input
                ref={multiFileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleMultiFilesSelected(e.target.files);
                  }
                }}
              />
            </div>

            {/* Document Rows List */}
            <div className="doc-items-list">
              {docRows.map((row, index) => (
                <div key={row.id} className="doc-card-item">
                  <div className="doc-card-header">
                    <div className="doc-number-badge">
                      <span>Document #{index + 1}</span>
                      {row.file_name && (
                        <span style={{ color: "#059669", fontWeight: 500 }}>
                          • {row.file_name} ({formatBytes(row.file_size)})
                        </span>
                      )}
                    </div>
                    {docRows.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove-doc"
                        onClick={() => handleRemoveRow(row.id)}
                        title="Remove this document row"
                      >
                        <Trash2 size={14} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <SelectInput
                      label="Document Type"
                      name={`doc_type_${row.id}`}
                      value={row.doc_type}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDocRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id
                              ? {
                                  ...r,
                                  doc_type: val,
                                  custom_doc_name: (val === "Other Supporting Document" || val === "Other Document") ? (r.custom_doc_name || "") : ""
                                }
                              : r
                          )
                        );
                      }}
                      options={DOCUMENT_TYPES}
                      required
                    />
                  </div>

                  {(row.doc_type === "Other Supporting Document" || row.doc_type === "Other Document") && (
                    <div style={{ marginBottom: "16px" }}>
                      <FormInput
                        label="Enter Document Name"
                        name={`custom_doc_name_${row.id}`}
                        placeholder="e.g. Birth Certificate, Electricity Bill, Rent Agreement"
                        value={row.custom_doc_name || ""}
                        onChange={(e) => handleRowChange(row.id, "custom_doc_name", e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {/* File Upload Box */}
                  <div className="file-upload-box">
                    <label className="form-label" style={{ display: "block", marginBottom: "6px" }}>
                      Upload Document File <span className="text-danger">*</span>
                    </label>
                    {!row.file_name ? (
                      <label className="file-drop-area">
                        <UploadCloud size={20} style={{ color: "#3b82f6" }} />
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
                          Choose file or drag & drop for {row.doc_type} <span className="text-danger">*</span>
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          PDF, PNG, JPG, WEBP (Max 20MB)
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          style={{ display: "none" }}
                          required
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleRowFileSelect(row.id, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    ) : (
                      <div className="file-preview-card">
                        <div className="file-preview-left">
                          {row.previewUrl ? (
                            <img
                              src={row.previewUrl}
                              alt="Thumbnail preview"
                              className="file-thumb-preview"
                            />
                          ) : (
                            <div className="file-icon-placeholder">
                              <FileText size={22} />
                            </div>
                          )}
                          <div className="file-meta-info">
                            <span className="file-meta-name" title={row.file_name}>
                              {row.file_name}
                            </span>
                            <span className="file-meta-size">
                              {row.file_type || "File"} • {formatBytes(row.file_size)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn-file-clear"
                          onClick={() => {
                            handleRowChange(row.id, "file_name", "");
                            handleRowChange(row.id, "file_type", "");
                            handleRowChange(row.id, "file_size", 0);
                            handleRowChange(row.id, "file_data", "");
                            handleRowChange(row.id, "previewUrl", null);
                          }}
                          title="Remove file"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* + Add Another Document Button */}
            <button
              type="button"
              className="btn-add-doc-row"
              onClick={handleAddRow}
            >
              <Plus size={18} />
              <span>+ Add Another Document ({docRows.length} added)</span>
            </button>

            {isAdmin && (
              <SelectInput
                label="Initial Verification Status for Batch"
                name="initialStatus"
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value)}
                options={[
                  { value: "Pending", label: "Pending Verification" },
                  { value: "Verified", label: "Verified" },
                  { value: "Rejected", label: "Rejected" }
                ]}
              />
            )}
          </div>

          <div
            className="modal-footer"
            style={{
              margin: "20px -24px -24px",
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Total: <strong>{docRows.length}</strong> document{docRows.length > 1 ? "s" : ""} ready to upload
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsUploadOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Uploading..."
                  : `Submit All Documents (${docRows.length})`}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ================= EDIT DOCUMENT MODAL ================= */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Document Details & File"
        maxWidth="600px"
      >
        <form onSubmit={handleEditSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <SelectInput
              label="Document Type"
              name="doc_type"
              value={editFormData.doc_type}
              onChange={(e) => {
                const val = e.target.value;
                setEditFormData({
                  ...editFormData,
                  doc_type: val,
                  custom_doc_name: (val === "Other Supporting Document" || val === "Other Document") ? (editFormData.custom_doc_name || "") : ""
                });
              }}
              options={DOCUMENT_TYPES}
              required
            />
          </div>

          {(editFormData.doc_type === "Other Supporting Document" || editFormData.doc_type === "Other Document") && (
            <div style={{ marginBottom: "16px" }}>
              <FormInput
                label="Enter Document Name"
                name="custom_doc_name"
                placeholder="e.g. Birth Certificate, Electricity Bill, Rent Agreement"
                value={editFormData.custom_doc_name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, custom_doc_name: e.target.value })}
                required
              />
            </div>
          )}

          {isAdmin && (
            <SelectInput
              label="Verification Status"
              name="verification_status"
              value={editFormData.verification_status}
              onChange={(e) => setEditFormData({ ...editFormData, verification_status: e.target.value })}
              options={[
                { value: "Pending", label: "Pending" },
                { value: "Verified", label: "Verified" },
                { value: "Rejected", label: "Rejected" }
              ]}
            />
          )}

          {/* Current / New File Attachment */}
          <div style={{ marginTop: "14px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
              Attached File (Replace / Attach) <span className="text-danger">*</span>
            </label>
            {editFormData.file_name ? (
              <div className="file-preview-card">
                <div className="file-preview-left">
                  {editFormData.previewUrl ? (
                    <img
                      src={editFormData.previewUrl}
                      alt="Thumbnail preview"
                      className="file-thumb-preview"
                    />
                  ) : (
                    <div className="file-icon-placeholder">
                      <FileText size={22} />
                    </div>
                  )}
                  <div className="file-meta-info">
                    <span className="file-meta-name">{editFormData.file_name}</span>
                    <span className="file-meta-size">
                      {editFormData.file_size > 0 ? formatBytes(editFormData.file_size) : "Attached"}
                    </span>
                  </div>
                </div>
                <label
                  className="btn btn-outline btn-sm"
                  style={{ cursor: "pointer", marginLeft: "auto", marginRight: "6px" }}
                >
                  Replace
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleEditFileSelect(e.target.files[0]);
                    }}
                  />
                </label>
              </div>
            ) : (
              <label className="file-drop-area">
                <UploadCloud size={20} style={{ color: "#3b82f6" }} />
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
                  Attach Document File (PDF, PNG, JPG)
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleEditFileSelect(e.target.files[0]);
                  }}
                />
              </label>
            )}
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

      {/* ================= VIEW / DOWNLOAD DOCUMENT MODAL ================= */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={viewingDoc ? `${viewingDoc.doc_type} - Preview` : "Document Preview"}
        maxWidth="800px"
      >
        <div className="doc-viewer-content">
          {viewLoading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
              Loading document data...
            </div>
          ) : viewingDoc ? (
            <>
              {/* Metadata Info Pills */}
              <div className="doc-viewer-meta">
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Doc Type: </span>
                  <strong style={{ color: "#1e293b" }}>{viewingDoc.doc_type}</strong>
                </div>
                {viewingDoc.doc_no && (
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>ID Number: </span>
                    <strong className="font-mono">{viewingDoc.doc_no}</strong>
                  </div>
                )}
                {!isCustomer && (
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Customer: </span>
                    <strong>{viewingDoc.customer_name}</strong>
                    {viewingDoc.customer_id && (
                      <span className="font-mono" style={{ fontSize: "0.8rem", color: "#475569", marginLeft: "6px" }}>
                        (ID: #{viewingDoc.customer_id})
                      </span>
                    )}
                  </div>
                )}
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Status: </span>
                  <StatusBadge status={viewingDoc.verification_status} />
                </div>
                {viewingDoc.file_size > 0 && (
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Size: </span>
                    <strong style={{ color: "#2563eb" }}>{formatBytes(viewingDoc.file_size)}</strong>
                  </div>
                )}
              </div>

              {/* Document File Preview */}
              {viewingDoc.file_data ? (
                <div className="doc-viewer-preview">
                  {viewingDoc.file_type && viewingDoc.file_type.startsWith("image/") ? (
                    <img
                      src={viewingDoc.file_data}
                      alt={viewingDoc.file_name || "Document Preview"}
                      className="doc-viewer-img"
                    />
                  ) : viewingDoc.file_type === "application/pdf" || viewingDoc.file_data.startsWith("data:application/pdf") ? (
                    <iframe
                      src={viewingDoc.file_data}
                      title="PDF Preview"
                      className="doc-viewer-frame"
                    />
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#e2e8f0" }}>
                      <FileText size={48} style={{ margin: "0 auto 12px", color: "#60a5fa" }} />
                      <p style={{ fontWeight: 600, fontSize: "1rem" }}>{viewingDoc.file_name || "Document File"}</p>
                      <p style={{ fontSize: "0.825rem", color: "#94a3b8", marginTop: "4px" }}>
                        Preview not available for this format. Use the download button below.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    padding: "36px 20px",
                    textAlign: "center",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px dashed #cbd5e1"
                  }}
                >
                  <AlertCircle size={36} style={{ color: "#94a3b8", margin: "0 auto 8px" }} />
                  <p style={{ fontWeight: 600, color: "#475569" }}>No Digital File Attached</p>
                  <p style={{ fontSize: "0.825rem", color: "#94a3b8", marginTop: "4px" }}>
                    This document was registered by ID number only ({viewingDoc.doc_no || "N/A"}).
                    You can attach a file by clicking "Edit Document Info".
                  </p>
                </div>
              )}

              {/* Actions - Includes Direct Download & Delete from Preview */}
              <div className="doc-viewer-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ color: "#dc2626", borderColor: "#fecaca", marginRight: "auto" }}
                  onClick={() => {
                    handleDeleteClick(viewingDoc);
                  }}
                >
                  <Trash2 size={16} />
                  <span>Delete Document</span>
                </button>

                {viewingDoc.file_data && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleDownloadFile(viewingDoc)}
                  >
                    <Download size={16} />
                    <span>Download File ({viewingDoc.file_name || "Document"})</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsViewOpen(false)}
                >
                  Close
                </button>
              </div>
            </>
          ) : null}
        </div>
      </Modal>

      {/* ================= DELETE CONFIRM DIALOG ================= */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Uploaded Document"
        message={`Are you sure you want to permanently delete "${selectedDoc?.doc_type}" (${selectedDoc?.file_name || selectedDoc?.doc_no || "Doc #" + selectedDoc?.document_id})? This action cannot be undone.`}
        confirmText="Confirm Deletion"
        isDanger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default Documents;
