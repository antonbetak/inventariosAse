import { useState } from "react";
import { DashboardPlanner } from "../Dashboard/DashboardPlanner";
import { Brand } from "../ui/Brand";
import {
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ShieldCheck,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
} from "lucide-react";
import { Navegacion } from "../compComunes/Navegacion";
import { Header } from "../compComunes/Header";
import { IconButton } from "../ui/GlassButton";
export function AppShell({ user, onLogout, activeTab, onTabChange, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">
        Ir al contenido
      </a>
      <aside className="sidebar glass">
        <Brand href="#main-content" compact={collapsed} />
        <div className="sidebar-heading">
          <span>PRINCIPAL</span>
          <IconButton
            label={collapsed ? "Expandir menú" : "Contraer menú"}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <PanelLeftClose size={17} />
            )}
          </IconButton>
        </div>
        <Navegacion activeTab={activeTab} onTabChange={onTabChange} />
        <div className="sidebar-bottom">
          <div className="workspace-note">
            <span className="icon-capsule">
              <ShieldCheck size={20} />
            </span>
            <h3>Todo bajo control.</h3>
            <p>Tu inventario, en un solo lugar.</p>
            <button type="button" onClick={() => onTabChange("Reportes")}>
              Explorar reportes <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="sidebar-user">
            <span className="avatar">A</span>
            <div>
              <strong>{user.nombre}</strong>
              <small title={user.email}>{user.email}</small>
            </div>
            <IconButton label="Cerrar sesión" onClick={onLogout}>
              <LogOut size={18} />
            </IconButton>
          </div>
        </div>
      </aside>
      <div className="app-content">
        <Header user={user} onLogout={onLogout} onTabChange={onTabChange} />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="app-footer">
          <span>
            Sanaté Inventarios <span className="muted">/ Workspace 2.0</span>
          </span>
          <span className="muted">Claridad en cada movimiento.</span>
        </footer>
      </div>
      <aside
        className={`productivity-panel ${plannerOpen ? "is-open" : ""}`}
        aria-label="Agenda y tareas"
      >
        <div className="productivity-heading">
          <span className="eyebrow">TU OPERACIÓN, EN ORDEN</span>
          <h2>Agenda y tareas</h2>
        </div>
        <button
          className="planner-toggle"
          aria-expanded={plannerOpen}
          aria-controls="productivity-content"
          onClick={() => setPlannerOpen(!plannerOpen)}
        >
          <CalendarDays size={19} />
          <span>
            Agenda y tareas
            <small>Calendario y pendientes de tu operación</small>
          </span>
          <ChevronDown size={18} />
        </button>
        <div className="productivity-body" id="productivity-content">
          <DashboardPlanner />
        </div>
      </aside>
      <Navegacion mobile activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
