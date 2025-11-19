// src/components/productos/ProductoTerminado.jsx
import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../../utils/firebase";

export const ProductoTerminado = ({ onCancel }) => {
  const [materiaPrima, setMateriaPrima] = useState([]);   // insumos de Firebase
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Datos del producto terminado
  const [formData, setFormData] = useState({
    nombre: "",
    cantidad: "",
    unidad: "unidades",
    precioVenta: "",
    descripcion: "",
    insumos: [], // { id, nombre, cantidadUsada, unidad }
  });

  // Controles para agregar insumos
  const [insumoSeleccionado, setInsumoSeleccionado] = useState("");
  const [cantidadInsumo, setCantidadInsumo] = useState("");

  // 1) Cargar insumos desde Firebase
  useEffect(() => {
    const cargar = async () => {
      try {
        const snap = await getDocs(collection(db, "insumos"));
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        console.log("Materia prima:", data);
        setMateriaPrima(data);
      } catch (err) {
        console.error("Error obteniendo insumos:", err);
        setMensaje("No se pudieron cargar los insumos.");
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  const agregarInsumo = () => {
    setMensaje("");

    if (!insumoSeleccionado || !cantidadInsumo) {
      setMensaje("Selecciona un insumo y una cantidad válida.");
      return;
    }

    const cantidadNum = parseFloat(cantidadInsumo);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      setMensaje("La cantidad del insumo debe ser mayor a 0.");
      return;
    }

    const materia = materiaPrima.find((m) => m.id === insumoSeleccionado);
    if (!materia) {
      setMensaje("Insumo no encontrado.");
      return;
    }

    const stockActual = Number(materia.stock_actual ?? 0);

    if (cantidadNum > stockActual) {
      setMensaje(
        `No hay suficiente ${materia.nombre}. Disponible: ${stockActual} ${materia.unidad_medida}`
      );
      return;
    }

    // Evitar duplicado
    const yaExiste = formData.insumos.find((i) => i.id === insumoSeleccionado);
    if (yaExiste) {
      setMensaje("Este insumo ya fue agregado.");
      return;
    }

    const nuevoInsumo = {
      id: materia.id,
      nombre: materia.nombre,
      cantidadUsada: cantidadNum,
      unidad: materia.unidad_medida,
    };

    setFormData((prev) => ({
      ...prev,
      insumos: [...prev.insumos, nuevoInsumo],
    }));

    setInsumoSeleccionado("");
    setCantidadInsumo("");
  };

  const eliminarInsumo = (idInsumo) => {
    setFormData((prev) => ({
      ...prev,
      insumos: prev.insumos.filter((i) => i.id !== idInsumo),
    }));
  };

  // 2) Guardar producto terminado + descontar insumos
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (!formData.nombre || !formData.cantidad || !formData.precioVenta) {
      setMensaje("Completa nombre, cantidad y precio de venta.");
      return;
    }

    if (formData.insumos.length === 0) {
      setMensaje("Agrega al menos un insumo utilizado.");
      return;
    }

    const cantidadProducto = parseFloat(formData.cantidad);
    const precioVentaNum = parseFloat(formData.precioVenta);

    if (isNaN(cantidadProducto) || cantidadProducto <= 0) {
      setMensaje("La cantidad del producto debe ser mayor a 0.");
      return;
    }
    if (isNaN(precioVentaNum) || precioVentaNum <= 0) {
      setMensaje("El precio de venta debe ser mayor a 0.");
      return;
    }

    // Verificar stock de todos los insumos antes de hacer updates
    for (const insumo of formData.insumos) {
      const materia = materiaPrima.find((m) => m.id === insumo.id);
      const stockActual = Number(materia?.stock_actual ?? 0);
      if (!materia || stockActual < insumo.cantidadUsada) {
        setMensaje(
          `No hay stock suficiente de ${materia?.nombre ?? "algún insumo"}.`
        );
        return;
      }
    }

    try {
      setSaving(true);

      // 2.1 Crear el producto terminado (ajusta el nombre de la colección si quieres)
      await addDoc(collection(db, "productosTerminados"), {
        nombre: formData.nombre,
        cantidad: cantidadProducto,
        unidad: formData.unidad,
        precioVenta: precioVentaNum,
        descripcion: formData.descripcion,
        insumos: formData.insumos, // se guarda el detalle de qué se usó
        creadoEn: new Date(),
      });

      // 2.2 Descontar insumos en Firebase
      const updates = formData.insumos.map(async (insumo) => {
        const materia = materiaPrima.find((m) => m.id === insumo.id);
        const stockActual = Number(materia.stock_actual ?? 0);
        const nuevoStock = stockActual - insumo.cantidadUsada;

        await updateDoc(doc(db, "insumos", insumo.id), {
          stock_actual: nuevoStock,
        });

        // Actualizar estado local
        setMateriaPrima((prev) =>
          prev.map((m) =>
            m.id === insumo.id ? { ...m, stock_actual: nuevoStock } : m
          )
        );
      });

      await Promise.all(updates);

      setMensaje("Producto guardado y stock actualizado ✅");
      // Si quieres cerrar el modal al guardar:
      // onCancel();
    } catch (err) {
      console.error("Error guardando producto:", err);
      setMensaje("Ocurrió un error al guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-4">Cargando insumos...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre del producto */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Nombre del producto
        </label>
        <input
          type="text"
          required
          value={formData.nombre}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, nombre: e.target.value }))
          }
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Cantidad + unidad */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Cantidad</label>
          <input
            type="number"
            required
            step="0.01"
            value={formData.cantidad}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, cantidad: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Unidad</label>
          <select
            value={formData.unidad}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, unidad: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="unidades">unidades</option>
            <option value="kg">kg</option>
            <option value="L">litros</option>
            <option value="cajas">cajas</option>
          </select>
        </div>
      </div>

      {/* Precio de venta */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Precio de venta (MXN)
        </label>
        <input
          type="number"
          required
          step="0.01"
          value={formData.precioVenta}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, precioVenta: e.target.value }))
          }
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium mb-1">Descripción</label>
        <textarea
          value={formData.descripcion}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
          }
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          rows="2"
        />
      </div>

      {/* Sección de insumos utilizados */}
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3">Insumos utilizados</h4>

        {/* Agregar insumo */}
        <div className="flex gap-2 mb-3">
          <select
            value={insumoSeleccionado}
            onChange={(e) => setInsumoSeleccionado(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          >
            <option value="">Seleccionar insumo...</option>
            {materiaPrima.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} (Disponible: {m.stock_actual} {m.unidad_medida})
              </option>
            ))}
          </select>

          <input
            type="number"
            step="0.01"
            placeholder="Cantidad"
            value={cantidadInsumo}
            onChange={(e) => setCantidadInsumo(e.target.value)}
            className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />

          <button
            type="button"
            onClick={agregarInsumo}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Lista de insumos ya agregados */}
        {formData.insumos.length > 0 ? (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            {formData.insumos.map((ins) => (
              <div
                key={ins.id}
                className="flex justify-between items-center bg-white p-2 rounded border"
              >
                <span className="text-sm">
                  <strong>{ins.nombre}:</strong> {ins.cantidadUsada} {ins.unidad}
                </span>
                <button
                  type="button"
                  onClick={() => eliminarInsumo(ins.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-2">
            No se han agregado insumos
          </p>
        )}
      </div>

      {mensaje && (
        <p
          className={`text-sm ${
            mensaje.includes("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {mensaje}
        </p>
      )}

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};
