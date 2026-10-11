export function StatusBadge({ status = "Disponible" }) {
  return (
    <span
      className={`status-badge ${status === "Crítico" ? "critical" : status === "Bajo" ? "low" : "healthy"}`}
    >
      <span className="status-dot" />
      {status}
    </span>
  );
}
