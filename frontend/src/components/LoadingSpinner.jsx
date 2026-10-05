import { Loader2 } from "lucide-react";
import "./UI.css";

const LoadingSpinner = ({ text = "Loading...", size = 28 }) => {
  return (
    <div className="loading-spinner-container">
      <Loader2 size={size} className="animate-spin text-primary" />
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
