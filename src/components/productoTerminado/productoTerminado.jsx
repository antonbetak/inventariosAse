import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../utils/firebase"; // misma ruta que en MateriaPrima

// OJO: mantenemos el mismo nombre de export que ya usas en App.jsx
export const ProductoTerminado = ({ onCancel }) => {
  const [insumos, setInsumos] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // 1) Leer insumos desde la colección "insumos"
  useEffect(() => {
    const cargarInsumos = async () => {
      try {
        const snap = await getDocs(collection(db, "insumos"));
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        console.log("Insumos para SALIDAS:", data);
        setInsumos(data);
      } catch (err) {
        console.error("Error obteniendo insumos:", err);
        setMensaje("No se pudieron cargar los insumos desde Firebase.");
      } finally {
        setLoading(false);
      }
    };

    cargarInsumos();
  }, []);

  const selectedInsumo = insumos.find((i) => i.id === selectedId);

  // 2) RESTAR stock_actual en vez de sumar
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (!selectedId) {
      setMensaje("Selecciona un insumo.");
      return;
    }

    const cantidadNum = parseFloat(cantidad);
    if (!cantidad || isNaN(cantidadNum) || cantidadNum <= 0) {
      setMensaje("Ingresa una cantidad válida.");
      return;
    }

    const stockActual = Number(selectedInsumo.stock_actual ?? 0);

    if (cantidadNum > stockActual) {
      setMensaje(`No hay stock suficiente. Stock actual: ${stockActual}.`);
      return;
    }

    try {
      setSaving(true);
      const nuevoStock = stockActual - cantidadNum; // 👈 AQUÍ ESTÁ LA RESTA

      await updateDoc(doc(db, "insumos", selectedId), {
        stock_actual: nuevoStock,
      });

      // actualizar estado local para que se vea el cambio
      setInsumos((prev) =>
        prev.map((i) =>
          i.id === selectedId ? { ...i, stock_actual: nuevoStock } : i
        )
      );

      setMensaje("Salida registrada correctamente ✅");
      setCantidad("");
    } catch (err) {
      console.error("Error registrando salida:", err);
      setMensaje("Ocurrió un error al registrar la salida.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-4">Cargando insumos...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold mb-2">
        Registrar salida de materia prima
      </h2>

      {/* Select de insumos */}
      <div>
        <label className="block text-sm font-medium mb-1">Insumo</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">
            {insumos.length === 0
              ? "No hay insumos en Firebase"
              : "Selecciona un insumo"}
          </option>
          {insumos.map((ins) => (
            <option key={ins.id} value={ins.id}>
              {ins.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Info del insumo seleccionado */}
      {selectedInsumo && (
        <div className="bg-gray-50 border rounded-lg p-3 text-sm space-y-1">
          <p>
            <span className="font-semibold">Stock actual:</span>{" "}
            {selectedInsumo.stock_actual} {selectedInsumo.unidad_medida}
          </p>
          <p>
            <span className="font-semibold">Stock mínimo:</span>{" "}
            {selectedInsumo.stock_minimo}
          </p>
          <p>
            <span className="font-semibold">Costo unidad:</span>{" "}
            ${selectedInsumo.costo_unidad}
          </p>
        </div>
      )}

      {/* Cantidad a descontar */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Cantidad a descontar
        </label>
        <input
          type="number"
          step="0.01"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {mensaje && <p className="text-sm">{mensaje}</p>}

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Registrar salida"}
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
