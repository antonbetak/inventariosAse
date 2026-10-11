import logo from "../../assets/Logo.png";
export function Brand({ href = "#main-content", compact = false }) {
  return (
    <a
      href={href}
      className={`brand sanate-brand ${compact ? "brand-compact" : ""}`}
      aria-label="Sanaté Inventarios 2.0"
    >
      <span className="sanate-logo-panel">
        <img src={logo} alt="Sanaté, agua alcalina ionizada" />
      </span>
      {!compact && (
        <span className="brand-subtitle">
          INVENTARIOS <span className="version-badge">2.0</span>
        </span>
      )}
    </a>
  );
}
