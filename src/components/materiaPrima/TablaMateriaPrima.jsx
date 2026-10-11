import React, { useState, useMemo } from "react";
import {
  Plus,
  Boxes,
  Wallet,
  TriangleAlert,
  Pencil,
  Trash2,
  ArrowDownLeft,
} from "lucide-react";

import { PageHeader } from "../ui/PageHeader";
import { GlassCard } from "../ui/GlassCard";
import { StatCard } from "../ui/StatCard";
import { GlassButton, IconButton } from "../ui/GlassButton";
import { SearchInput } from "../ui/SearchInput";
import { FilterTabs } from "../ui/FilterTabs";
import { DataTable } from "../ui/DataTable";
import { StatusBadge } from "../ui/StatusBadge";
import { EmptyState } from "../ui/EmptyState";
import { money, stockStatus } from "../../utils/inventoryDisplay";

export const TablaMateriaPrima = ({
  materia = [],
  onAdd,
  onEntry,
  onEdit,
  onDelete,
}) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const { totalUnidades, valorTotal, bajoStock } = useMemo(() => {
    return materia.reduce(
      (acc, i) => {
        acc.totalUnidades += Number(i.stock_actual || 0);
        acc.valorTotal +=
          Number(i.stock_actual || 0) * Number(i.costo_unidad || 0);
        if (i.stock_actual <= i.stock_minimo) acc.bajoStock += 1;
        return acc;
      },
      { totalUnidades: 0, valorTotal: 0, bajoStock: 0 },
    );
  }, [materia]);

  const filtered = materia.filter(
    (m) =>
      m.nombre.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
      (filter === "Todos" || stockStatus(m) === filter),
  );
  return (
    <>
      <PageHeader
        title="Materia prima"
        description="Gestiona tus insumos, existencias y niveles mínimos."
      >
        <GlassButton variant="secondary" onClick={onEntry}>
          <ArrowDownLeft size={17} />
          Registrar entrada
        </GlassButton>
        <GlassButton onClick={onAdd}>
          <Plus size={18} />
          Nueva materia prima
        </GlassButton>
      </PageHeader>
      <div className="stats-grid three">
        <StatCard
          icon={Boxes}
          title="Insumos registrados"
          value={materia.length}
          detail={`${totalUnidades.toLocaleString("es-MX")} unidades agregadas · diferentes medidas`}
          tone="teal"
        />
        <StatCard
          icon={Wallet}
          title="Valor del inventario"
          value={money(valorTotal)}
        />
        <StatCard
          icon={TriangleAlert}
          title="Requieren reorden"
          value={bajoStock}
          detail="Stock en el mínimo o por debajo"
          tone="amber"
        />
      </div>
      <GlassCard className="table-panel">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} />
          <FilterTabs
            options={["Todos", "Disponible", "Bajo", "Crítico"]}
            value={filter}
            onChange={setFilter}
          />
        </div>
        <DataTable
          label="Inventario de materia prima"
          headers={[
            "Insumo",
            "Stock actual",
            "Unidad",
            "Stock mínimo",
            "Costo / unidad",
            "Estado",
            "Acciones",
          ]}
        >
          {filtered.map((m) => (
            <tr key={m.id}>
              <td>
                <div className="table-name">
                  <span className="item-icon teal">
                    <Boxes size={17} />
                  </span>
                  <strong>{m.nombre}</strong>
                </div>
              </td>
              <td className="numeric">
                {Number(m.stock_actual).toLocaleString("es-MX")}
              </td>
              <td className="muted">{m.unidad_medida || "—"}</td>
              <td>{m.stock_minimo}</td>
              <td className="numeric">{money(m.costo_unidad)}</td>
              <td>
                <StatusBadge status={stockStatus(m)} />
              </td>
              <td>
                <div className="row-actions">
                  <IconButton
                    label={`Editar ${m.nombre}`}
                    onClick={() => onEdit(m)}
                  >
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton
                    label={`Eliminar ${m.nombre}`}
                    onClick={() => onDelete(m)}
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
              materia.length
                ? "Sin coincidencias"
                : "Tu inventario empieza aquí"
            }
            description={
              materia.length
                ? "Prueba con otro nombre o estado."
                : "Los insumos registrados aparecerán en esta tabla."
            }
          />
        )}
        <div className="table-footer">
          <span>
            {filtered.length} de {materia.length} insumos
          </span>
          <span>Inventario actual</span>
        </div>
      </GlassCard>
    </>
  );
};
