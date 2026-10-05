import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, Inbox } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import "./UI.css";

const DataTable = ({
  columns = [],
  data = [],
  keyField = "id",
  loading = false,
  emptyMessage = "No records found",
  pageSize = 10,
  onRowClick,
  actions
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key) => {
    if (!key) return;
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="data-table-container">
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={col.style}
                  className={`${col.className || ""} ${col.sortable !== false && col.accessor ? "sortable-header" : ""}`}
                  onClick={() => col.sortable !== false && col.accessor && handleSort(col.accessor)}
                >
                  <div className="header-cell-content">
                    <span>{col.header}</span>
                    {col.sortable !== false && col.accessor && (
                      <ArrowUpDown size={14} className="sort-icon" />
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="table-state-cell">
                  <LoadingSpinner text="Fetching data..." />
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="table-state-cell">
                  <div className="empty-state-wrapper">
                    <Inbox size={48} className="empty-icon" />
                    <p className="empty-title">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => {
                const rowKey = typeof keyField === "function" ? keyField(row) : row[keyField] ?? rowIdx;
                return (
                  <tr
                    key={rowKey}
                    className={onRowClick ? "clickable-row" : ""}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} style={col.style} className={col.className}>
                        {col.render
                          ? col.render(col.accessor ? row[col.accessor] : row, row)
                          : row[col.accessor] ?? "—"}
                      </td>
                    ))}
                    {actions && (
                      <td className="text-right actions-cell" onClick={(e) => e.stopPropagation()}>
                        {actions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {!loading && sortedData.length > pageSize && (
        <div className="table-pagination">
          <div className="pagination-info">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
          </div>
          <div className="pagination-controls">
            <button
              className="page-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              title="First Page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              className="page-btn"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="page-indicator">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="page-btn"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="page-btn"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              title="Last Page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
