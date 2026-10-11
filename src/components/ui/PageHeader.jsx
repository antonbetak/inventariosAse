export function PageHeader({
  eyebrow = "WORKSPACE / INVENTARIO",
  title,
  description,
  children,
}) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      <div className="page-actions">{children}</div>
    </div>
  );
}
export function SectionHeader({ title, description, children }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {description && <p className="muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}
