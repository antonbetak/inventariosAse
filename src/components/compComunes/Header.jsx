import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Search, ArrowUpRight } from "lucide-react";
import { IconButton } from "../ui/GlassButton";
export function Header({ user, onLogout, onTabChange }) {
  const [panel, setPanel] = useState(null);
  const actionsRef = useRef(null);
  useEffect(() => {
    const closeOutside = (event) => {
      if (!actionsRef.current?.contains(event.target)) {
        setPanel(null);
        const search = actionsRef.current?.querySelector("details");
        if (search) search.open = false;
      }
    };
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      const expanded = actionsRef.current?.querySelector(
        '[aria-expanded="true"]',
      );
      const search = actionsRef.current?.querySelector("details[open]");
      setPanel(null);
      if (search) {
        search.open = false;
        search.querySelector("summary")?.focus();
      }
      expanded?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);
  return (
    <header className="topbar glass">
      <div className="topbar-greeting">
        <span className="eyebrow">TU ESPACIO DE TRABAJO</span>
        <p>
          Hola, {user.nombre} <span className="greeting-dot" />
        </p>
        <small className="muted">Aquí tienes el estado de tu inventario.</small>
      </div>
      <div className="topbar-actions" ref={actionsRef}>
        <details className="quick-search">
          <summary aria-label="Buscar sección">
            <Search size={17} />
            <span>Buscar sección…</span>
            <kbd>↵</kbd>
          </summary>
          <div className="dropdown glass">
            {[
              "Dashboard",
              "Materia Prima",
              "Producto Terminado",
              "Reportes",
            ].map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={(e) => {
                  onTabChange(tab);
                  e.currentTarget.closest("details").open = false;
                }}
              >
                {tab}
                <ArrowUpRight size={15} />
              </button>
            ))}
          </div>
        </details>
        <div className="topbar-popover">
          <IconButton
            label="Notificaciones"
            aria-expanded={panel === "notifications"}
            onClick={() =>
              setPanel(panel === "notifications" ? null : "notifications")
            }
          >
            <Bell size={19} />
          </IconButton>
          {panel === "notifications" && (
            <div className="dropdown glass">
              <strong>Notificaciones</strong>
              <p className="muted">
                Consulta las alertas de stock en tu Dashboard.
              </p>
              <button
                type="button"
                onClick={() => {
                  onTabChange("Dashboard");
                  setPanel(null);
                }}
              >
                Ver estado del inventario <ArrowUpRight size={16} />
              </button>
            </div>
          )}
        </div>
        <div className="topbar-popover">
          <button
            type="button"
            className="profile-button"
            aria-label="Menú de usuario"
            aria-expanded={panel === "user"}
            onClick={() => setPanel(panel === "user" ? null : "user")}
          >
            <span className="avatar">A</span>
            <ChevronDown size={15} />
          </button>
          {panel === "user" && (
            <div className="dropdown glass">
              <strong>{user.nombre}</strong>
              <p className="muted break-word">{user.email}</p>
              <button type="button" onClick={onLogout}>
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
