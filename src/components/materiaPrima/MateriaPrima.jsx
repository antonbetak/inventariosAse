import { useState } from "react";
import { inventoryService } from "../../services/inventoryService";
import { GlassButton } from "../ui/GlassButton";
import { ErrorState } from "../ui/EmptyState";
export function MateriaPrima({
  materia,
  mode = "record",
  rawMaterials = [],
  onSaved,
  onCancel,
}) {
  const [form, setForm] = useState(() => ({
    ...{
      nombre: "",
      categoria: "Ingredientes",
      stock_actual: "",
      stock_minimo: "",
      costo_unidad: "",
      unidad_medida: "kg",
      proveedor: "",
      consumo_promedio: 0,
      merma_mensual: 0,
    },
    ...materia,
  }));
  const [selected, setSelected] = useState(""),
    [quantity, setQuantity] = useState(""),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (mode === "entry")
        await inventoryService.registerRawMaterialEntry(selected, quantity);
      else if (materia)
        await inventoryService.updateRawMaterial(materia.id, form);
      else await inventoryService.createRawMaterial(form);
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  const item = rawMaterials.find((i) => i.id === selected);
  return (
    <form className="inventory-form space-y-4" onSubmit={submit}>
      <fieldset disabled={saving} className="form-fields">
        {mode === "entry" ? (
          <>
            <div>
              <label htmlFor="entry-material">Insumo</label>
              <select
                id="entry-material"
                required
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Selecciona un insumo</option>
                {rawMaterials.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nombre}
                  </option>
                ))}
              </select>
            </div>
            {item && (
              <p className="form-info">
                Stock actual: {item.stock_actual} {item.unidad_medida} · Mínimo:{" "}
                {item.stock_minimo}
              </p>
            )}
            <div>
              <label htmlFor="entry-quantity">Cantidad a agregar</label>
              <input
                id="entry-quantity"
                type="number"
                required
                min="0.0001"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label htmlFor="raw-name">Nombre del insumo</label>
              <input
                id="raw-name"
                name="nombre"
                value={form.nombre}
                onChange={change}
                required
                maxLength={120}
                placeholder="Ej. Glicerina vegetal"
              />
            </div>
            <div className="form-grid">
              <div>
                <label htmlFor="raw-category">Categoría</label>
                <input
                  id="raw-category"
                  name="categoria"
                  value={form.categoria}
                  onChange={change}
                  required
                  list="raw-categories"
                />
                <datalist id="raw-categories">
                  <option>Ingredientes</option>
                  <option>Empaque</option>
                  <option>Fragancias</option>
                </datalist>
              </div>
              <div>
                <label htmlFor="raw-unit">Unidad de medida</label>
                <select
                  id="raw-unit"
                  name="unidad_medida"
                  value={form.unidad_medida}
                  onChange={change}
                >
                  {["kg", "L", "g", "ml", "pzas", "cajas"].map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-grid">
              {[
                ["stock_actual", "Stock actual"],
                ["stock_minimo", "Stock mínimo"],
                ["costo_unidad", "Costo por unidad (MXN)"],
                ["consumo_promedio", "Consumo promedio diario"],
              ].map(([name, label]) => (
                <div key={name}>
                  <label htmlFor={`raw-${name}`}>{label}</label>
                  <input
                    id={`raw-${name}`}
                    name={name}
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={form[name]}
                    onChange={change}
                  />
                </div>
              ))}
            </div>
            <div>
              <label htmlFor="raw-provider">Proveedor</label>
              <input
                id="raw-provider"
                name="proveedor"
                value={form.proveedor}
                onChange={change}
                maxLength={120}
                placeholder="Opcional"
              />
            </div>
          </>
        )}
      </fieldset>
      {error && <ErrorState message={error} />}
      <div className="form-actions">
        <GlassButton variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </GlassButton>
        <GlassButton type="submit" disabled={saving}>
          {saving
            ? "Guardando…"
            : mode === "entry"
              ? "Registrar entrada"
              : materia
                ? "Guardar cambios"
                : "Crear materia prima"}
        </GlassButton>
      </div>
    </form>
  );
}
