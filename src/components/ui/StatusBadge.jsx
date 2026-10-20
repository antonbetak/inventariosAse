export function StatusBadge({ status = "Disponible" }) {
  return (
    <span
      className={`status-badge ${status === "Crítico" ? "critical" : ["Bajo", "Por confirmar"].includes(status) ? "low" : "healthy"}`}
    >
      <span className="status-dot" />
      {status}
    </span>
  );
}
