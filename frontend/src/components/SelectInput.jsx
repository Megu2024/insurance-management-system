import "./UI.css";

const SelectInput = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  required = false,
  error,
  disabled = false,
  helperText
}) => {
  return (
    <div className={`form-group ${error ? "has-error" : ""}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="form-control"
      >
        <option value="" disabled={required}>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="form-error">{error}</span>}
      {!error && helperText && <span className="form-helper">{helperText}</span>}
    </div>
  );
};

export default SelectInput;
