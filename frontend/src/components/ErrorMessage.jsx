import { AlertCircle, X } from "lucide-react";
import "./UI.css";

const ErrorMessage = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="error-alert">
      <div className="error-alert-content">
        <AlertCircle size={20} className="error-icon" />
        <span className="error-message-text">{message}</span>
      </div>
      {onDismiss && (
        <button type="button" className="error-dismiss-btn" onClick={onDismiss}>
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
