import { memo } from "react";
import { DashboardCharts } from "./DashboardCharts";
import {
  Wallet,
  Boxes,
  PackageCheck,
  TriangleAlert,
  ArrowUpRight,
  Plus,
  CircleCheck,
  ArrowDownLeft,
  ArrowUpRight as Outgoing,
} from "lucide-react";

import { GlassCard } from "../ui/GlassCard";
import { StatCard } from "../ui/StatCard";
import { PageHeader, SectionHeader } from "../ui/PageHeader";
import { GlassButton } from "../ui/GlassButton";
import { EmptyState } from "../ui/EmptyState";
import { StatusBadge } from "../ui/StatusBadge";
import {
  money,
  stockStatus,
  recordDate,
  dateLabel,
} from "../../utils/inventoryDisplay";

export const Dashboard = memo(function Dashboard({
  materiaPrima = [],
  productoTerminado = [],
  reports,
  onNavigate,
  onAdd,
}) {
  const products = productoTerminado;
  const { rawValue, productValue } = reports;
  const alerts = materiaPrima.filter(
    (m) => Number(m.stock_actual ?? 0) <= Number(m.stock_minimo ?? 0),
  );
  const critical = materiaPrima.filter(
    (m) => stockStatus(m) === "Crítico",
  ).length;
  const low = materiaPrima.filter((m) => stockStatus(m) === "Bajo").length;
  const healthy = materiaPrima.length - critical - low;
  const activity = reports.activity.map((m) => ({
    ...m,
    kind: m.entidad === "materia" ? "raw" : "product",
    date: recordDate(m.fecha),
  }));
  return (
    <>
      <PageHeader
        eyebrow="SANATÉ / CONTROL OPERATIVO"
        title="Tu inventario, en perspectiva."
        description="Una visión clara de tus recursos y de lo que necesita atención."
      >
        <GlassButton variant="secondary" onClick={() => onNavigate("Reportes")}>
          Ver reportes <ArrowUpRight size={16} />
        </GlassButton>
        <GlassButton onClick={onAdd}>
          <Plus size={17} />
          Registrar entrada
        </GlassButton>
      </PageHeader>
      <div className="overview-strip">
        <span>
          <span className="status-dot" />
          Resumen actual
        </span>
        <span>Inventario & producción</span>
      </div>
      <div className="stats-grid">
        <StatCard
          icon={Wallet}
          title="Valor total inventario"
          value={money(rawValue + productValue)}
          detail="Insumos + productos registrados"
        />
        <StatCard
          icon={Boxes}
          title="Materia prima"
          value={money(rawValue)}
          detail={`${materiaPrima.length} insumos registrados`}
          tone="teal"
        />
        <StatCard
          icon={PackageCheck}
          title="Producto terminado"
          value={money(productValue)}
          detail={`${products.length} registros de producto`}
          tone="violet"
        />
        <StatCard
          icon={TriangleAlert}
          title="Stock crítico"
          value={critical}
          detail={`${low} insumos adicionales en nivel bajo`}
          tone="amber"
        />
      </div>
      <DashboardCharts
        history={reports.history}
        healthy={healthy}
        low={low}
        critical={critical}
        count={materiaPrima.length}
      />
      <div className="dashboard-bottom">
        <GlassCard>
          <SectionHeader
            title="Requieren atención"
            description={`${alerts.length} insumos en su mínimo o por debajo`}
          >
            <span className="icon-capsule amber">
              <TriangleAlert size={19} />
            </span>
          </SectionHeader>
          {alerts.length ? (
            <div className="attention-list">
              {alerts.map((m) => (
                <div className="attention-item" key={m.id}>
                  <span className="item-icon">
                    <Boxes size={18} />
                  </span>
                  <div className="item-copy">
                    <strong>{m.nombre || "Sin nombre"}</strong>
                    <small>
                      {m.stock_actual ?? 0} {m.unidad_medida} disponibles ·
                      mínimo {m.stock_minimo ?? 0}
                    </small>
                    <div className="stock-track">
                      <span
                        style={{
                          width: `${Math.min(100, Math.max(0, (Number(m.stock_actual) / Math.max(1, Number(m.stock_minimo))) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                  <StatusBadge status={stockStatus(m)} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                materiaPrima.length
                  ? "Todo en equilibrio"
                  : "Sin alertas disponibles"
              }
              description={
                materiaPrima.length
                  ? "Tus insumos están por encima del stock mínimo."
                  : "Las alertas aparecerán cuando registres insumos."
              }
            />
          )}
          <button
            type="button"
            className="panel-link"
            onClick={() => onNavigate("Materia Prima")}
          >
            Gestionar materia prima <ArrowUpRight size={16} />
          </button>
        </GlassCard>
        <GlassCard>
          <SectionHeader
            title="Registros recientes"
            description="Entradas, salidas y cambios del inventario"
          />
          <div className="activity-feed">
            {activity.map((item, index) => (
              <div key={`${item.kind}-${item.id}`} className="activity-item">
                <span
                  className={`activity-icon ${item.kind === "raw" ? "teal" : "blue"}`}
                >
                  {item.kind === "raw" ? (
                    <ArrowDownLeft size={18} />
                  ) : (
                    <Outgoing size={18} />
                  )}
                </span>
                <div>
                  <small>{item.descripcion?.replace(/ · demo$/i, "")}</small>
                  <strong>{item.nombre || "Sin nombre"}</strong>
                  <span>
                    {item.date ? dateLabel(item.date) : "Sin fecha registrada"}
                  </span>
                </div>
                <span className="activity-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
          {!activity.length && (
            <EmptyState
              title="Tu actividad aparecerá aquí"
              description="Consulta tus últimos registros en este espacio."
            />
          )}
          <div className="feed-note">
            <CircleCheck size={14} />
            Últimos movimientos registrados
          </div>
        </GlassCard>
      </div>
    </>
  );
});
