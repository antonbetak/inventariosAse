import { memo, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { GlassCard } from "../ui/GlassCard";
import { SectionHeader } from "../ui/PageHeader";
import { FilterTabs } from "../ui/FilterTabs";
import { EmptyState } from "../ui/EmptyState";
import { money, dateLabel } from "../../utils/inventoryDisplay";
export const DashboardCharts = memo(function DashboardCharts({
  history,
  healthy,
  low,
  critical,
  count,
}) {
  const [chartView, setChartView] = useState("30 días");
  const chartData = useMemo(
    () => history.slice(-Number.parseInt(chartView)),
    [history, chartView],
  );
  const distribution = useMemo(
    () => [
      { name: "Saludable", value: healthy, color: "#5fa199" },
      { name: "Bajo", value: low, color: "#f6c453" },
      { name: "Crítico", value: critical, color: "#ff5c6c" },
    ],
    [healthy, low, critical],
  );
  return (
    <div className="dashboard-charts">
      <GlassCard className="value-chart">
        <SectionHeader
          title="Evolución del inventario"
          description="Insumos al costo validado · MXN; valuación parcial"
        >
          <span className="subtle-badge">COSTO PARCIAL</span>
        </SectionHeader>
        <FilterTabs
          options={["7 días", "30 días", "90 días"]}
          value={chartView}
          onChange={setChartView}
          label="Rango de histórico"
        />
        {chartData.length ? (
          <div
            className="chart-frame"
            role="img"
            aria-label="Evolución del valor del inventario"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 8, left: 0, bottom: 12 }}
              >
                <defs>
                  <linearGradient
                    id="inventoryArea"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--accent-primary)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--accent-primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(204,235,255,.08)"
                />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                    })
                  }
                  minTickGap={35}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9096a4", fontSize: 10 }}
                  dy={10}
                />
                <YAxis
                  tickFormatter={(v) => `${Number((v / 1000).toFixed(1))}k`}
                  width={48}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9096a4", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10, 24, 36, .94)",

                    boxShadow: "var(--glass-shadow)",
                    border: "1px solid var(--glass-edge)",
                    borderRadius: 14,
                    color: "#f7f7f7",
                  }}
                  labelFormatter={dateLabel}
                  formatter={(v) => [money(v), "Valor"]}
                />
                <Area
                  type="monotone"
                  dataKey="materiaPrima"
                  stroke="var(--accent-primary)"
                  strokeWidth={2.5}
                  fill="url(#inventoryArea)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            title="Tu próxima visión empieza aquí"
            description="Se requieren costos de insumos validados y observaciones de inventario para visualizar su valor."
          />
        )}
        <div className="chart-footnote">
          <span className="legend-dot blue" />
          Costo validado
          <span className="muted">Insumos comerciales</span>
        </div>
      </GlassCard>
      <GlassCard className="stock-panel">
        <SectionHeader
          title="Estado del inventario"
          description="Disponibilidad de materia prima"
        />
        <div className="donut-wrap">
          {count > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={distribution.filter((d) => d.value)}
                  innerRadius="72%"
                  outerRadius="92%"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={6}
                >
                  {distribution
                    .filter((d) => d.value)
                    .map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="donut-center">
            <strong>
              {count ? `${Math.round((healthy / count) * 100)}%` : "—"}
            </strong>
            <span>saludable</span>
          </div>
        </div>
        <div className="stock-legend">
          {distribution.map((d) => (
            <div key={d.name}>
              <span>
                <i style={{ background: d.color }} />
                {d.name}
              </span>
              <strong>
                {d.value}
                <small> insumos</small>
              </strong>
            </div>
          ))}
        </div>
        <p className="stock-note">
          Bajo: stock hasta el mínimo. Crítico: sin existencias.
        </p>
      </GlassCard>
    </div>
  );
});
