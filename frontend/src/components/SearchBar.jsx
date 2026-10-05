import { Search, X } from "lucide-react";
import "./UI.css";

const SearchBar = ({ value, onChange, placeholder = "Search...", onClear }) => {
  return (
    <div className="search-bar-wrapper">
      <Search size={18} className="search-icon" />
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="search-clear-btn"
          onClick={() => {
            if (onClear) onClear();
            else onChange("");
          }}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
