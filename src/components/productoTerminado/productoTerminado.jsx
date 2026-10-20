import { useState } from "react";
import { Plus, X } from "lucide-react";
import { inventoryService } from "../../services/inventoryService";
import { GlassButton, IconButton } from "../ui/GlassButton";
import { ErrorState } from "../ui/EmptyState";
export function ProductoTerminado({
  producto,
  rawMaterials = [],
  onSaved,
  onCancel,
}) {
  const [form, setForm] = useState(() => ({
    ...{
      nombre: "",
      categoria: "Agua purificada",
      cantidad: "",
      stock_minimo: 0,
      precioVenta: "",
      unidad: "unidades",
      descripcion: "",
      insumos: [],
    },
    ...producto,
    ...(producto?.stock_pendiente ? { cantidad: "" } : {}),
  }));
  const [selected, setSelected] = useState(""),
    [quantity, setQuantity] = useState(""),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const recipe = async () => {
    setError("");
    try {
      const insumos = await inventoryService.getRecipe(
        form.nombre,
        form.cantidad,
      );
      setForm({ ...form, insumos });
    } catch (e) {
      setError(e.message);
    }
  };
  const add = () => {
    setError("");
    const item = rawMaterials.find((i) => i.id === selected);
    const qty = Number(quantity);
    if (!item || !Number.isFinite(qty) || qty <= 0) {
      setError("Selecciona un insumo y una cantidad mayor a cero.");
      return;
    }
    const previous =
      form.insumos.find((i) => i.id === item.id)?.cantidadUsada ?? 0;
    if (previous + qty > item.stock_actual) {
      setError(`Stock insuficiente de ${item.nombre}.`);
      return;
    }
    setForm({
      ...form,
      insumos: [
        ...form.insumos.filter((i) => i.id !== item.id),
        {
          id: item.id,
          nombre: item.nombre,
          cantidadUsada: previous + qty,
          unidad: item.unidad_medida,
        },
      ],
    });
    setSelected("");
    setQuantity("");
  };
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (producto)
        await inventoryService.updateFinishedProduct(producto.id, form);
      else await inventoryService.createFinishedProduct(form);
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <form className="inventory-form space-y-4" onSubmit={submit}>
      <fieldset disabled={saving} className="form-fields">
        <div>
          <label htmlFor="product-name">Nombre del producto</label>
          <input
            id="product-name"
            name="nombre"
            required
            maxLength={50}
            value={form.nombre}
            onChange={change}
            list="product-examples"
            placeholder="Ej. Garrafón 20L"
          />
          <datalist id="product-examples">
            {inventoryService.recipeNames.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </datalist>
        </div>
        <div className="form-grid">
          <div>
            <label htmlFor="product-category">Categoría</label>
            <input
              id="product-category"
              name="categoria"
              required
              value={form.categoria}
              onChange={change}
            />
          </div>
          <div>
            <label htmlFor="product-unit">Unidad</label>
            <input
              id="product-unit"
              name="unidad"
              required
              value={form.unidad}
              onChange={change}
            />
          </div>
        </div>
        <div className="form-grid">
          {[
            ["cantidad", "Cantidad"],
            ["stock_minimo", "Stock mínimo"],
            ["precioVenta", "Precio de venta (MXN)"],
          ].map(([name, label]) => (
            <div key={name}>
              <label htmlFor={`product-${name}`}>{label}</label>
              <input
                id={`product-${name}`}
                type="number"
                name={name}
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
          <label htmlFor="product-description">Descripción</label>
          <textarea
            id="product-description"
            name="descripcion"
            rows={2}
            value={(form.descripcion ?? "").replace(/^Lote demo SAN-/i, "Lote SAN-")}
            onChange={change}
            maxLength={600}
          />
        </div>
        {!producto && (
          <>
            <h3>
              Insumos utilizados <span className="muted">· opcional</span>
            </h3>
            <p className="muted">
              Registra existencias iniciales sin receta o agrega los insumos de
              producción. Se descontarán al guardar.
            </p>
            <GlassButton variant="secondary" onClick={recipe}>
              Cargar receta
            </GlassButton>
            <div className="recipe-row">
              <select
                aria-label="Insumo a utilizar"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Selecciona un insumo</option>
                {rawMaterials.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nombre} · {i.stock_actual} {i.unidad_medida}
                  </option>
                ))}
              </select>
              <input
                aria-label="Cantidad de insumo"
                type="number"
                min="0"
                step="any"
                placeholder="Cantidad"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <IconButton label="Agregar insumo" onClick={add}>
                <Plus size={18} />
              </IconButton>
            </div>
          </>
        )}
        {producto && (
          <p className="form-info">
            Editar o borrar un producto ajusta su registro; no revierte ni
            vuelve a descontar los insumos de producción.
          </p>
        )}
        {form.insumos.length > 0 && (
          <div className="recipe-list">
            {form.insumos.map((i) => (
              <div key={i.id}>
                <span>
                  <strong>{i.nombre}</strong>
                  <small>
                    {i.cantidadUsada} {i.unidad}
                  </small>
                </span>
                {!producto && (
                  <IconButton
                    label={`Quitar ${i.nombre}`}
                    onClick={() =>
                      setForm({
                        ...form,
                        insumos: form.insumos.filter((x) => x.id !== i.id),
                      })
                    }
                  >
                    <X size={16} />
                  </IconButton>
                )}
              </div>
            ))}
          </div>
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
            : producto
              ? "Guardar cambios"
              : "Registrar producto"}
        </GlassButton>
      </div>
    </form>
  );
}
