import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./UI.css";

const FormInput = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  helperText,
  min,
  max,
  step
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`form-group ${error ? "has-error" : ""}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="input-wrapper" style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
        <input
          id={name}
          name={name}
          type={inputType}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className="form-control"
          style={isPassword ? { paddingRight: "42px" } : {}}
        />
        {isPassword && (
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex="-1"
            title={showPassword ? "Hide password" : "Show password"}
            aria-label={showPassword ? "Hide password" : "Show password"}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              borderRadius: "4px",
              lineHeight: 1
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className="form-error">{error}</span>}
      {!error && helperText && <span className="form-helper">{helperText}</span>}
    </div>
  );
};

export default FormInput;
