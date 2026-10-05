import "./StatCard.css";

const StatCard = ({ title, value, icon, subtitle, color = "primary", onClick }) => {
  return (
    <div
      className={`stat-card stat-card-${color} ${onClick ? "stat-card-clickable" : ""}`}
      onClick={onClick}
    >
      <div className="stat-card-top">
        <div className="stat-card-info">
          <span className="stat-card-title">{title}</span>
          <span className="stat-card-value">{value}</span>
        </div>
        {icon && <div className="stat-icon">{icon}</div>}
      </div>
      {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
    </div>
  );
};

export default StatCard;