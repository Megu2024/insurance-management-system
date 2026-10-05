import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import "./UI.css";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = false,
  confirmVariant,
  loading = false
}) => {
  const handleClose = onClose || onCancel;
  const isDangerVariant = isDanger || confirmVariant === "danger";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      maxWidth="460px"
      footer={
        <div className="dialog-footer-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${isDangerVariant ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      }
    >
      <div className="confirm-dialog-content">
        <div className={`confirm-icon-wrapper ${isDangerVariant ? "icon-danger" : "icon-warning"}`}>
          <AlertTriangle size={24} />
        </div>
        <p className="confirm-message">{message}</p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
