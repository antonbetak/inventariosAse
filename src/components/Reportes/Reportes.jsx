import {CommercialSales} from './CommercialSales';
import React, { memo, useState } from "react";
import {
  Download,
  Boxes,
  Wallet,
  ArrowDownLeft,
  TriangleAlert,
} from "lucide-react";
import { reportsService } from "../../services/reportsService";
import { quantity } from '../../utils/inventoryDisplay';
import { downloadReport } from "../../utils/downloadReport";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { PageHeader, SectionHeader } from "../ui/PageHeader";
import { GlassCard } from "../ui/GlassCard";
import { StatCard } from "../ui/StatCard";
import { GlassButton } from "../ui/GlassButton";
import { SearchInput } from "../ui/SearchInput";
import { FilterTabs } from "../ui/FilterTabs";
import { DataTable } from "../ui/DataTable";
import { EmptyState, ErrorState } from "../ui/EmptyState";

export const Reportes = ({ reports, snapshot }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [lastExport, setLastExport] = useState(null);
  const [exportError, setExportError] = useState("");
  const [exporting, setExporting] = useState(false);
  const {
    insumos,
    resumen,
    resumenEntradas,
    resumenSalidas,
    reporteCompleto,
    datosGrafica,
    topMerma,
    movementDays,
  } = reports;
  const formatCurrency = (n) =>
    Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  const handleExportCSV = async () => {
    setExporting(true);
    setExportError("");
    try {
      const rows = await reportsService.getExportRows(snapshot);
      if (downloadReport(rows, "reporte_sanate"))
        setLastExport({
          fecha: new Date().toLocaleString("es-MX"),
          registros: rows.length,
        });
    } catch (e) {
      setExportError(e.message);
    } finally {
      setExporting(false);
    }
  };
  const filtered = insumos.filter(
    (i) =>
      i.nombre.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
      (filter === "Todos" ||
        (filter === "En riesgo" ? i.enRiesgo : !i.enRiesgo)),
  );
  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE / ANALYTICS"
        title="Cada dato, una mejor decisión."
        description="Analiza tus existencias, anticipa el reorden y exporta tu inventario."
      >
        <GlassButton
          onClick={handleExportCSV}
          disabled={!insumos.length || exporting}
        >
          <Download size={17} />
          {exporting ? "Exportando…" : "Exportar CSV"}
        </GlassButton>
      </PageHeader>
      <CommercialSales snapshot={snapshot} />
      <div className="stats-grid">
        <StatCard
          icon={Boxes}
          title="Insumos registrados"
          value={reporteCompleto.totalItems}
          detail={`${resumenEntradas.registros} registros en inventario`}
          tone="teal"
        />
        <StatCard
          icon={Wallet}
          title="Valor de materia prima"
          value={reports.rawValueComplete?formatCurrency(reporteCompleto.valorTotal):"—"}
          detail="Existencias × costo por unidad"
        />
        <StatCard
          icon={ArrowDownLeft}
          title="Salidas registradas"
          value={resumenSalidas.registros}
          detail={resumenSalidas.valor==null?"Movimientos del inventario":`Valor declarado: ${formatCurrency(resumenSalidas.valor)}`}
          tone="violet"
        />
        <StatCard
          icon={TriangleAlert}
          title="En punto de reorden"
          value={resumen.necesitanReorden}
          detail="Incluye consumo y stock de seguridad"
          tone="amber"
        />
      </div>
      <div className="reports-charts">
        <GlassCard>
          <SectionHeader
            title="Anticipa tu próximo reorden"
            description="Stock actual frente al punto de reorden · hasta 7 insumos"
          />
          {datosGrafica.length ? (
            <ReorderChart data={datosGrafica} />
          ) : (
            <EmptyState
              title="Sin puntos de reorden disponibles"
              description="Se necesitan insumos con stock mínimo o consumo registrado."
            />
          )}
          <div className="chart-footnote">
            <span>
              <i className="legend-dot teal" /> Stock actual
            </span>
            <span>
              <i className="legend-dot blue" /> Punto de reorden
            </span>
          </div>
        </GlassCard>
        <GlassCard className="merma-panel">
          <SectionHeader
            title="Muestras de merma"
            description="Pérdida de material por muestra"
          />
          {topMerma.length ? (
            topMerma.map((i, index) => (
              <div className="merma-item" key={i.id}>
                <span className="merma-rank">0{index + 1}</span>
                <div>
                  <strong>{i.nombre}</strong>
                  <div className="stock-track">
                    <span
                      style={{
                        width: `${Math.min(100, Math.max(0, i.merma_mensual * 100))}%`,
                      }}
                    />
                  </div>
                </div>
                <span>{i.merma_mensual==null?"—":`${(i.merma_mensual * 100).toFixed(2)}%`}</span>
              </div>
            ))
          ) : (
            <EmptyState
              title="Sin merma registrada"
              description="Los porcentajes disponibles aparecerán aquí."
            />
          )}
          <p className="stock-note">Observaciones del Excel sin fecha; no representan pérdida mensual real.</p>
        </GlassCard>
      </div>
      <GlassCard className="movements-chart">
        <SectionHeader
          title="Entradas y salidas"
          description="Valor declarado de movimientos · MXN; insumos al costo disponible y productos a precio de venta. No es utilidad."
        />
        <MovementChart data={movementDays} />
        <div className="chart-footnote">
          <span>
            <i className="legend-dot blue" /> Entradas
          </span>
          <span>
            <i className="legend-dot teal" /> Salidas
          </span>
        </div>
      </GlassCard>
      {exportError && <ErrorState message={exportError} />}
      <GlassCard className="table-panel">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} />
          <FilterTabs
            value={filter}
            onChange={setFilter}
            options={["Todos", "En riesgo", "Sin riesgo"]}
          />
        </div>
        <DataTable
          label="Reporte detallado del inventario"
          headers={[
            "Insumo",
            "Stock",
            "Seguridad (SS)",
            "Reorden (R)",
            "Consumo prom.",
            "Costo",
            "Merma",
            "Riesgo",
          ]}
        >
          {filtered.map((i) => (
            <tr key={i.id}>
              <td>
                <strong>{i.nombre}</strong>
              </td>
              <td>
                {quantity(i.stock_actual)}{" "}
                <span className="muted">{i.unidad_medida}</span>
              </td>
              <td>{quantity(i.stock_minimo)}</td>
              <td>{quantity(i.punto_reorden)}</td>
              <td>{quantity(i.consumo_promedio)}</td>
              <td>{i.costo_pendiente || i.costo_unidad == null ? "—" : formatCurrency(i.costo_unidad)}</td>
              <td>{i.merma_mensual==null?"—":`${(i.merma_mensual * 100).toFixed(2)}%`}</td>
              <td>
                <span
                  className={`status-badge ${i.enRiesgo ? "low" : "healthy"}`}
                >
                  <span className="status-dot" />
                  {i.enRiesgo ? "En riesgo" : "Sin riesgo"}
                </span>
              </td>
            </tr>
          ))}
        </DataTable>
        {!filtered.length && (
          <EmptyState
            title="Sin registros para mostrar"
            description="Prueba con otra búsqueda o revisa tu inventario."
          />
        )}
        <div className="table-footer">
          <span>
            {filtered.length} de {insumos.length} insumos
          </span>
          <span>La exportación incluye todos los registros</span>
        </div>
      </GlassCard>
      {lastExport && (
        <p role="status" className="export-note">
          Última exportación: {lastExport.fecha} · {lastExport.registros}{" "}
          registros
        </p>
      )}
    </>
  );
};

const ReorderChart = memo(function ReorderChart({ data }) {
  return (
    <div
      className="chart-frame"
      role="img"
      aria-label="Comparación de stock y punto de reorden por insumo"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ bottom: 20 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,.06)" />
          <XAxis
            dataKey="nombre"
            tickFormatter={(v) => (v.length > 12 ? `${v.slice(0, 11)}…` : v)}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#939bab", fontSize: 10 }}
            interval={0}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={45}
            tick={{ fill: "#939bab", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              background: "#171c25",
              border: "1px solid #343b46",
              borderRadius: 14,
              color: "#f7f7f7",
            }}
            cursor={{ fill: "rgba(255,255,255,.03)" }}
          />
          <Bar
            isAnimationActive={false}
            dataKey="stock_actual"
            name="Stock actual"
            fill="#5fa199"
            radius={[5, 5, 0, 0]}
            maxBarSize={32}
          />
          <Bar
            isAnimationActive={false}
            dataKey="punto_reorden"
            name="Punto de reorden"
            fill="var(--accent-primary)"
            radius={[5, 5, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

const MovementChart = memo(function MovementChart({ data }) {
  return (
    <div
      className="chart-frame"
      role="img"
      aria-label="Valor de entradas y salidas por día"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
          <XAxis
            dataKey="fecha"
            tick={{ fill: "#939bab", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "#939bab", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: "#171c25",
              border: "1px solid #343b46",
              borderRadius: 14,
            }}
            formatter={formatChartCurrency}
          />
          <Bar
            dataKey="entradas"
            name="Entradas"
            fill="var(--accent-primary)"
            radius={[5, 5, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="salidas"
            name="Salidas"
            fill="var(--accent-secondary)"
            radius={[5, 5, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
const formatChartCurrency = (n) =>
  Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
