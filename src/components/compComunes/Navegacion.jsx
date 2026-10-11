import {
  LayoutDashboard,
  Boxes,
  PackageCheck,
  ChartNoAxesCombined,
} from "lucide-react";
const tabs = [
  { id: "Dashboard", short: "Inicio", icon: LayoutDashboard },
  { id: "Materia Prima", short: "Insumos", icon: Boxes },
  { id: "Producto Terminado", short: "Producto", icon: PackageCheck },
  { id: "Reportes", short: "Reportes", icon: ChartNoAxesCombined },
];
export function Navegacion({ activeTab, onTabChange, mobile = false }) {
  return (
    <nav
      className={mobile ? "mobile-nav glass" : "sidebar-nav"}
      aria-label={mobile ? "Navegación móvil" : "Navegación principal"}
    >
      {tabs.map(({ id, short, icon: Icon }) => (
        <button
          type="button"
          key={id}
          title={id}
          aria-label={id}
          aria-current={activeTab === id ? "page" : undefined}
          className={activeTab === id ? "active" : ""}
          onClick={() => onTabChange(id)}
        >
          <Icon size={20} />
          <span>{mobile ? short : id}</span>
          {!mobile && activeTab === id && <span className="nav-active-dot" />}
        </button>
      ))}
    </nav>
  );
}
