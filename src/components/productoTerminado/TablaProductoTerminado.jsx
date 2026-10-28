import React, { useState } from "react";
import { Plus, PackageCheck, Wallet, Pencil, Trash2 } from "lucide-react";

import { PageHeader } from "../ui/PageHeader";
import { GlassCard } from "../ui/GlassCard";
import { GlassButton, IconButton } from "../ui/GlassButton";
import { StatCard } from "../ui/StatCard";
import { SearchInput } from "../ui/SearchInput";
import { FilterTabs } from "../ui/FilterTabs";
import { StatusBadge } from "../ui/StatusBadge";
import { DataTable } from "../ui/DataTable";
import { EmptyState } from "../ui/EmptyState";
import { money, stockStatus, sortProducts } from "../../utils/inventoryDisplay";

export const TablaProductoTerminado = ({
  salidas: allSalidas = [],
  onAdd,
  onEdit,
  onDelete,
}) => {
  const salidas = allSalidas.filter(p=>!p.es_prueba);
  const [filter, setFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const filtered = sortProducts(salidas)
    .filter(
      (p) =>
        `${p.nombre ?? ""} ${p.descripcion ?? ""}`
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase()) &&
        (filter === "Todos" ||
          stockStatus({ ...p, stock_actual: p.cantidad }) === filter),
    );
  return (
    <>
      <PageHeader
        title="Producto terminado"
        description="Consulta y administra las existencias de tus productos."
      >
        <GlassButton onClick={onAdd}>
          <Plus size={18} />
          Registrar producto
        </GlassButton>
      </PageHeader>
      <div className="stats-grid two">
        <StatCard
          icon={PackageCheck}
          title="Productos registrados"
          value={salidas.length}
          detail="Catálogo de productos"
          tone="teal"
        />
        <StatCard
          icon={Wallet}
          title="Valor a precio de venta"
          value={salidas.some(p=>p.stock_pendiente)?"—":money(
            salidas.reduce(
              (sum, p) =>
                sum + (p.stock_pendiente ? 0 : Number(p.cantidad ?? 0) * Number(p.precioVenta ?? 0)),
              0,
            ),
          )}
          detail="Cantidad × precio de venta"
        />
      </div>
      <GlassCard className="table-panel">
        <div className="table-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar producto o descripción…"
          />
          <FilterTabs
            value={filter}
            onChange={setFilter}
            options={["Todos", "Disponible", "Bajo", "Crítico"]}
          />
        </div>
        <DataTable
          label="Historial de producto terminado"
          headers={[
            "Producto",
            "Descripción",
            "Cantidad",
            "Precio de venta",
                        "Estado",
            "Acciones",
          ]}
        >
          {filtered.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="table-name">
                  <span className="item-icon blue">
                    <PackageCheck size={17} />
                  </span>
                  <strong>{item.nombre || "Sin nombre"}</strong>
                </div>
              </td>
              <td className="description-cell muted">
                {item.descripcion?.replace(/^Lote demo SAN-/i, "Lote SAN-") ||
                  "—"}
              </td>
              <td className="numeric">
                {item.stock_pendiente ? "—" : <>{item.cantidad} <span className="muted">{item.unidad}</span></>}
              </td>
              <td className="numeric">{money(item.precioVenta)}</td>
                            <td>
                <StatusBadge
                  status={stockStatus({ ...item, stock_actual: item.cantidad })}
                />
              </td>
              <td>
                <div className="row-actions">
                  <IconButton
                    label={`Editar ${item.nombre}`}
                    onClick={() => onEdit(item)}
                  >
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton
                    label={`Eliminar ${item.nombre}`}
                    onClick={() => onDelete(item)}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
        {!filtered.length && (
          <EmptyState
            title={
              salidas.length
                ? "Sin coincidencias"
                : "Aún no hay productos registrados"
            }
            description={
              salidas.length
                ? "Prueba con otra búsqueda."
                : "Registra tu primera salida para comenzar el historial."
            }
          />
        )}
        <div className="table-footer">
          <span>
            {filtered.length} de {salidas.length} registros
          </span>
          <span>Control de producto terminado</span>
        </div>
      </GlassCard>
    </>
  );
};
