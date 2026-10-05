import "./UI.css";

const PageHeader = ({ title, description, actions, badge }) => {
  return (
    <div className="page-header-container">
      <div className="page-header-text">
        <div className="page-title-row">
          <h1 className="page-main-title">{title}</h1>
          {badge && <span className="header-badge">{badge}</span>}
        </div>
        {description && <p className="page-subtitle">{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
};

export default PageHeader;
