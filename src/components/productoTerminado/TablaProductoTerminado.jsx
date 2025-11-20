import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../utils/firebase";

export const TablaProductoTerminado = ({ onAdd }) => {
  const [salidas, setSalidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ================================
  // Cargar historial desde Firebase
  // ================================
  useEffect(() => {
    const cargarSalidas = async () => {
      try {
        const snap = await getDocs(collection(db, "productosTerminados"));
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Ordenar por fecha (más nuevos primero)
        data.sort(
          (a, b) =>
            (b.creadoEn?.toDate?.() ?? new Date()) -
            (a.creadoEn?.toDate?.() ?? new Date())
        );

        setSalidas(data);
      } catch (e) {
        console.error("Error leyendo Firestore:", e);
        setError("No se pudieron cargar los datos de Firebase.");
      } finally {
        setLoading(false);
      }
    };

    cargarSalidas();
  }, []);

  if (loading)
    return (
      <p className="p-6 text-center text-gray-500 animate-softFadeUp">
        Cargando historial…
      </p>
    );

  if (error) return <p className="p-4 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      {/* Header + botón */}
      <div className="flex justify-between items-center animate-softFadeUp">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Historial de Salidas
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Registros de producción y venta generados recientemente.
          </p>
        </div>

        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white px-5 py-2.5 rounded-2xl shadow-lg hover:shadow-xl hover:brightness-110 active:scale-95 transition-all duration-200"
        >
          <Plus size={18} />
          Agregar
        </button>
      </div>

      {/* Tabla principal */}
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-cardPop">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-200">
            <tr>
              {["Nombre", "Descripción", "Cantidad", "Precio", "Fecha"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 tracking-[0.08em] uppercase"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {salidas.map((item, index) => (
              <tr
                key={item.id}
                className="group hover:bg-indigo-50/60 transition-all duration-300 animate-rowFloat"
                style={{ animationDelay: `${index * 0.04}s` }}
              >
                {/* Nombre */}
                <td className="px-6 py-4 font-medium text-gray-900">
                  <span className="group-hover:text-indigo-700 transition-colors">
                    {item.nombre}
                  </span>
                </td>

                {/* Descripción */}
                <td className="px-6 py-4 text-sm text-gray-700">
                  {item.descripcion || "—"}
                </td>

                {/* Cantidad */}
                <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                  {item.cantidad} {item.unidad}
                </td>

                {/* Precio */}
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-50 text-slate-800 text-sm font-semibold border border-slate-200">
                    ${Number(item.precioVenta).toFixed(2)}
                  </span>
                </td>

                {/* Fecha */}
                <td className="px-6 py-4 text-sm text-gray-700">
                  {item.creadoEn?.toDate
                    ? item.creadoEn.toDate().toLocaleString("es-MX", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {salidas.length === 0 && (
          <p className="text-center text-gray-500 py-10">
            No hay salidas registradas todavía.
          </p>
        )}
      </div>
    </div>
  );
};
