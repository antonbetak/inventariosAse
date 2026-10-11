import { PackageOpen } from "lucide-react";
export function EmptyState({
  title = "Todavía no hay registros",
  description = "Los datos de tu inventario aparecerán aquí.",
  children,
}) {
  return (
    <div className="empty-state">
      <span className="icon-capsule">
        <PackageOpen size={24} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function LoadingState({ label = "Cargando inventario…" }) {
  return (
    <div role="status" className="loading-state">
      <p className="muted">{label}</p>
      <div className="skeleton-grid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton" />
        ))}
      </div>
      <div className="skeleton skeleton-panel" />
    </div>
  );
}
export function ErrorState({ message }) {
  return (
    <div role="alert" className="error-message">
      {message}
    </div>
  );
}
