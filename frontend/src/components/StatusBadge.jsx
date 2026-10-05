import "./UI.css";

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const s = String(status).toLowerCase();

  let variant = "default";
  if (["active", "approved", "successful", "verified", "settled", "paid", "completed"].includes(s)) {
    variant = "success";
  } else if (["pending", "under review"].includes(s)) {
    variant = "warning";
  } else if (["rejected", "inactive", "failed", "cancelled", "terminated", "expired"].includes(s)) {
    variant = "danger";
  } else if (["in progress", "processing"].includes(s)) {
    variant = "info";
  }

  return <span className={`status-badge badge-${variant}`}>{status}</span>;
};

export default StatusBadge;
