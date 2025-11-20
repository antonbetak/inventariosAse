import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../utils/firebase";

export const MateriaPrima = ({ onCancel, onSaved }) => {
  const [insumos, setInsumos] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const fetchInsumos = async () => {
      try {
        const snap = await getDocs(collection(db, "insumos")); // colección de tus insumos
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setInsumos(data);
      } catch (err) {
        console.error("Error obteniendo insumos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsumos();
  }, []);

  const selectedInsumo = insumos.find((i) => i.id === selectedId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (!selectedId) {
      setMensaje("Selecciona un insumo.");
      return;
    }
    if (!cantidad || parseFloat(cantidad) <= 0) {
      setMensaje("Ingresa una cantidad válida.");
      return;
    }

    try {
      setSaving(true);

      const cantidadNum = parseFloat(cantidad);
      const stockActual = Number(selectedInsumo.stock_actual || 0);

      // 1) Actualizar stock del insumo
      await updateDoc(doc(db, "insumos", selectedId), {
        stock_actual: stockActual + cantidadNum,
      });

      // 2) Guardar historial en colección "entradasMateriaPrima"
      await addDoc(collection(db, "entradasMateriaPrima"), {
        insumoId: selectedId,
        nombre: selectedInsumo.nombre,
        cantidad: cantidadNum,
        stockMin: selectedInsumo.stock_minimo,
        costo: selectedInsumo.costo_unidad,
        unidadMedida: selectedInsumo.unidad_medida,
        proveedor: selectedInsumo.proveedor || "",
        fecha: serverTimestamp(),
      });

      // Actualizar UI del stock en memoria
      setInsumos((prev) =>
        prev.map((i) =>
          i.id === selectedId
            ? { ...i, stock_actual: stockActual + cantidadNum }
            : i
        )
      );

      setMensaje("Entrada registrada correctamente ✅");
      setCantidad("");

      // Avisar al padre para que refresque la tabla de historial
      if (onSaved) onSaved();
    } catch (err) {
      console.error("Error guardando entrada:", err);
      setMensaje("Ocurrió un error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-4">Cargando insumos...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <h2 className="text-xl font-bold mb-2">Registrar entrada</h2>

      {/* Select de insumos */}
      <div>
        <label className="block text-sm mb-1">Insumo</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Selecciona un insumo</option>
          {insumos.map((ins) => (
            <option key={ins.id} value={ins.id}>
              {ins.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Info del insumo */}
      {selectedInsumo && (
        <div className="p-3 bg-gray-100 border rounded-lg text-sm space-y-1">
          <p>
            <strong>Stock actual:</strong> {selectedInsumo.stock_actual}{" "}
            {selectedInsumo.unidad_medida}
          </p>
          <p>
            <strong>Stock mínimo:</strong> {selectedInsumo.stock_minimo}
          </p>
          <p>
            <strong>Costo unidad:</strong> ${selectedInsumo.costo_unidad}
          </p>
          {selectedInsumo.proveedor && (
            <p>
              <strong>Proveedor:</strong> {selectedInsumo.proveedor}
            </p>
          )}
        </div>
      )}

      {/* Cantidad a agregar */}
      <div>
        <label className="block text-sm mb-1">Cantidad a agregar</label>
        <input
          type="number"
          step="0.01"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      {mensaje && <p className="text-sm">{mensaje}</p>}

      <div className="flex gap-2">
        {/* Botón principal con el diseño del logout */}
        <button
          type="submit"
          disabled={saving}
          className="flex-1 flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-900 text-white font-semibold px-4 py-2 rounded-md shadow transition duration-150 disabled:opacity-60"
        >
          <span>{saving ? "Guardando..." : "Registrar"}</span>
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400 transition"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};
