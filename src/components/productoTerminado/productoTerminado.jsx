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

// =======================================================
// CONFIGURACIÓN DE PRODUCTOS Y RECETAS AUTOMÁTICAS
// =======================================================

// Productos finales
const PRODUCTOS = [
  { id: "garrafon20", nombre: "Garrafón de 20 litros" },
  { id: "botella1L", nombre: "Agua de 1 litro" },
  { id: "botella500", nombre: "Agua de 500 mL" },
];

// RECETAS AUTOMÁTICAS DEFINITIVAS
const RECETAS_BASE = {
  garrafon20: [
    { nombreInsumo: "TAPA #54 CON CINTILLO", cantidadPorUnidad: 1 },
    { nombreInsumo: "ETIQUETA DE GARRAFÓN", cantidadPorUnidad: 1 },
    { nombreInsumo: "SELLO TERMOENCOGIBLE", cantidadPorUnidad: 1 },

    // Valores realistas por garrafón (kg, gal, litros)
    { nombreInsumo: "SALES", cantidadPorUnidad: 0.018 },          // kg
    { nombreInsumo: "LAVADIN INTERNO", cantidadPorUnidad: 0.005 },// gal
    { nombreInsumo: "LAVADIN EXTERNO", cantidadPorUnidad: 0.003 },// gal
    { nombreInsumo: "OXIDÍN", cantidadPorUnidad: 0.002 },         // litros
    { nombreInsumo: "PIPA DE AGUA POTABLE", cantidadPorUnidad: 0.020 }, // litros
  ],

  botella1L: [
    { nombreInsumo: "BOTELLA DE AGUA DE 1 LT", cantidadPorUnidad: 1 },
    { nombreInsumo: "TAPA DE BOTELLA DE AGUA", cantidadPorUnidad: 1 },
    { nombreInsumo: "ETIQUETA DE BOTELLAS DE AGUA", cantidadPorUnidad: 1 },

    { nombreInsumo: "SALES", cantidadPorUnidad: 0.003 }, // 3 g
  ],

  botella500: [
    { nombreInsumo: "BOTELLA DE AGUA DE 500 ML", cantidadPorUnidad: 1 },
    { nombreInsumo: "TAPA DE BOTELLA DE AGUA", cantidadPorUnidad: 1 },
    { nombreInsumo: "ETIQUETA DE BOTELLAS DE AGUA", cantidadPorUnidad: 1 },

    { nombreInsumo: "SALES", cantidadPorUnidad: 0.002 }, // 2 g
  ],
};

// =======================================================
// COMPONENTE PRINCIPAL
// =======================================================

export const ProductoTerminado = ({ onCancel }) => {
  const [materiaPrima, setMateriaPrima] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [formData, setFormData] = useState({
    productoId: "",
    nombre: "",
    cantidad: "",
    unidad: "unidades",
    precioVenta: "",
    descripcion: "",
    insumos: [],
  });

  const [insumoSeleccionado, setInsumoSeleccionado] = useState("");
  const [cantidadInsumo, setCantidadInsumo] = useState("");

  // Cargar insumos desde Firebase
  useEffect(() => {
    const cargar = async () => {
      try {
        const snap = await getDocs(collection(db, "insumos"));
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
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

  // =======================================================
  // CARGAR RECETA AUTOMÁTICA
  // =======================================================
  const aplicarRecetaAutomatica = () => {
    setMensaje("");

    if (!formData.productoId) {
      setMensaje("Selecciona un producto antes de cargar receta.");
      return;
    }

    const cantidadProducto = parseFloat(formData.cantidad);
    if (isNaN(cantidadProducto) || cantidadProducto <= 0) {
      setMensaje("Captura primero la cantidad del producto.");
      return;
    }

    const receta = RECETAS_BASE[formData.productoId];

    const insumosFinal = [];

    for (const item of receta) {
      const insumoDoc = materiaPrima.find(
        (m) =>
          m.nombre.trim().toUpperCase() ===
          item.nombreInsumo.trim().toUpperCase()
      );

      if (!insumoDoc) {
        setMensaje(`No se encontró en Firebase: ${item.nombreInsumo}`);
        return;
      }

      const total = cantidadProducto * item.cantidadPorUnidad;

      if (total > insumoDoc.stock_actual) {
        setMensaje(
          `No hay stock suficiente de ${insumoDoc.nombre}. Disponible: ${insumoDoc.stock_actual}`
        );
        return;
      }

      insumosFinal.push({
        id: insumoDoc.id,
        nombre: insumoDoc.nombre,
        cantidadUsada: total,
        unidad: insumoDoc.unidad_medida,
      });
    }

    setFormData((prev) => ({ ...prev, insumos: insumosFinal }));
    setMensaje("Receta automática cargada correctamente.");
  };

  // =======================================================
  // AGREGAR INSUMO MANUAL
  // =======================================================
  const agregarInsumo = () => {
    setMensaje("");

    if (!insumoSeleccionado || !cantidadInsumo) {
      setMensaje("Selecciona un insumo y cantidad.");
      return;
    }

    const materia = materiaPrima.find((m) => m.id === insumoSeleccionado);
    const cantidadNum = parseFloat(cantidadInsumo);

    if (cantidadNum > materia.stock_actual) {
      setMensaje(
        `No hay suficiente stock de ${materia.nombre}. Disponible: ${materia.stock_actual}`
      );
      return;
    }

    const nuevo = {
      id: materia.id,
      nombre: materia.nombre,
      cantidadUsada: cantidadNum,
      unidad: materia.unidad_medida,
    };

    setFormData((prev) => ({
      ...prev,
      insumos: [...prev.insumos, nuevo],
    }));

    setInsumoSeleccionado("");
    setCantidadInsumo("");
  };

  const eliminarInsumo = (id) => {
    setFormData((prev) => ({
      ...prev,
      insumos: prev.insumos.filter((x) => x.id !== id),
    }));
  };

  // =======================================================
  // GUARDAR EN FIREBASE + DESCONTAR STOCK
  // =======================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (!formData.nombre || !formData.cantidad || !formData.precioVenta) {
      setMensaje("Completa nombre, cantidad y precio.");
      return;
    }

    if (formData.insumos.length === 0) {
      setMensaje("Agrega insumos o usa receta automática.");
      return;
    }

    try {
      setSaving(true);

      // Crear salida
      await addDoc(collection(db, "productosTerminados"), {
        ...formData,
        cantidad: parseFloat(formData.cantidad),
        precioVenta: parseFloat(formData.precioVenta),
        creadoEn: new Date(),
      });

      // Descontar insumos
      await Promise.all(
        formData.insumos.map(async (ins) => {
          const materia = materiaPrima.find((m) => m.id === ins.id);
          const nuevo = materia.stock_actual - ins.cantidadUsada;

          await updateDoc(doc(db, "insumos", ins.id), {
            stock_actual: nuevo,
          });
        })
      );

      setMensaje("Salida registrada y stock actualizado ✓");
    } catch (err) {
      console.error(err);
      setMensaje("Error guardando producto.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Cargando insumos...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* PRODUCTO */}
      <div>
        <label className="block text-sm font-medium">Producto</label>
        <select
          value={formData.productoId}
          onChange={(e) => {
            const prod = PRODUCTOS.find((p) => p.id === e.target.value);
            setFormData((prev) => ({
              ...prev,
              productoId: e.target.value,
              nombre: prod?.nombre || "",
            }));
          }}
          required
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Selecciona un producto...</option>
          {PRODUCTOS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* CANTIDAD */}
      <div>
        <label className="block text-sm font-medium">Cantidad</label>
        <input
          type="number"
          step="0.01"
          className="w-full px-3 py-2 border rounded-lg"
          value={formData.cantidad}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, cantidad: e.target.value }))
          }
          required
        />
      </div>

      {/* PRECIO */}
      <div>
        <label className="block text-sm font-medium">Precio venta (MXN)</label>
        <input
          type="number"
          step="0.01"
          className="w-full px-3 py-2 border rounded-lg"
          value={formData.precioVenta}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, precioVenta: e.target.value }))
          }
          required
        />
      </div>

      {/* DESCRIPCIÓN */}
      <div>
        <label className="block text-sm font-medium">Descripción</label>
        <textarea
          className="w-full px-3 py-2 border rounded-lg"
          rows="2"
          value={formData.descripcion}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
          }
        />
      </div>

      {/* BOTÓN RECETA AUTOMÁTICA */}
      <button
        type="button"
        onClick={aplicarRecetaAutomatica}
        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Cargar automáticamente
      </button>

      {/* INSUMOS */}
      <h3 className="font-semibold pt-4">Insumos utilizados</h3>

      <div className="flex gap-2">
        <select
          value={insumoSeleccionado}
          onChange={(e) => setInsumoSeleccionado(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg"
        >
          <option value="">Selecciona un insumo...</option>
          {materiaPrima.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre} — {m.stock_actual} {m.unidad_medida}
            </option>
          ))}
        </select>

        <input
          type="number"
          step="0.01"
          placeholder="Cantidad"
          value={cantidadInsumo}
          onChange={(e) => setCantidadInsumo(e.target.value)}
          className="w-24 px-3 py-2 border rounded-lg"
        />

        <button
          type="button"
          onClick={agregarInsumo}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* LISTA DE INSUMOS */}
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

      {/* MENSAJE */}
      {mensaje && (
        <p
          className={`text-sm ${
            mensaje.includes("✓") ? "text-green-600" : "text-red-600"
          }`}
        >
          {mensaje}
        </p>
      )}

      {/* BOTONES */}
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
