export function StatusBadge({ status = "Disponible" }) {
  if (!status) return <span className="muted">—</span>;
  return (
    <span
      className={`status-badge ${status === "Crítico" ? "critical" : status === "Bajo" ? "low" : "healthy"}`}
    >
      <span className="status-dot" />
      {status}
    </span>
  );
}
