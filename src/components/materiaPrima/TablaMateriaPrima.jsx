import React, { useEffect, useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../utils/firebase";

export const TablaMateriaPrima = ({ onAdd }) => {
  const [materia, setMateria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDesdeFirebase = async () => {
      try {
        const snap = await getDocs(collection(db, "insumos"));

        const data = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            nombre: d.nombre || "(Sin nombre)",
            stock_actual: d.stock_actual ?? 0,
            stock_minimo: d.stock_minimo ?? 0,
            costo_unidad: d.costo_unidad ?? 0,
            unidad_medida: d.unidad_medida || "",
          };
        });

        setMateria(data);
      } catch (e) {
        console.error("Error leyendo Firestore:", e);
        setError("No se pudieron cargar los datos de Firebase.");
      } finally {
        setLoading(false);
      }
    };

    cargarDesdeFirebase();
  }, []);

  const { totalUnidades, valorTotal, bajoStock } = useMemo(() => {
    return materia.reduce(
      (acc, i) => {
        acc.totalUnidades += Number(i.stock_actual || 0);
        acc.valorTotal += Number(i.stock_actual || 0) * Number(i.costo_unidad || 0);
        if (i.stock_actual <= i.stock_minimo) acc.bajoStock += 1;
        return acc;
      },
      { totalUnidades: 0, valorTotal: 0, bajoStock: 0 }
    );
  }, [materia]);

  if (loading) {
    return (
      <p className="p-6 text-center text-gray-500 animate-softFadeUp">
        Cargando materias primas…
      </p>
    );
  }

  if (error) {
    return <p className="p-4 text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header + botón */}
      <div className="flex justify-between items-center animate-softFadeUp">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Materia Prima
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Control de tus insumos base y su disponibilidad actual.
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

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-softFadeUp">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-blue-50 shadow-md px-4 py-3 flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            Unidades totales
          </span>
          <span className="text-lg font-bold text-gray-900">
            {totalUnidades.toLocaleString()}
          </span>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl border border-emerald-50 shadow-md px-4 py-3 flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
            Valor aproximado
          </span>
          <span className="text-lg font-bold text-gray-900">
            ${valorTotal.toFixed(2)}
          </span>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl border border-rose-50 shadow-md px-4 py-3 flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-rose-500">
            Insumos con bajo stock
          </span>
          <span className="text-lg font-bold text-gray-900">
            {bajoStock}
          </span>
        </div>
      </div>

      {/* Tabla principal */}
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-cardPop">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-200">
            <tr>
              {["Nombre", "Cantidad", "Stock Mínimo", "Costo por Unidad"].map(
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
            {materia.map((m, index) => (
              <tr
                key={m.id}
                className="group hover:bg-indigo-50/60 transition-all duration-300 animate-rowFloat"
                style={{ animationDelay: `${index * 0.04}s` }}
              >
                <td className="px-6 py-4 font-medium text-gray-900">
                  <span className="group-hover:text-indigo-700 transition-colors">
                    {m.nombre}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                      m.stock_actual <= m.stock_minimo
                        ? "bg-rose-50 text-rose-700 border-rose-200 animate-softGlow"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {m.stock_actual} {m.unidad_medida}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm text-gray-700">
                  {m.stock_minimo} {m.unidad_medida}
                </td>

                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-50 text-slate-800 text-sm font-semibold border border-slate-200">
                    ${Number(m.costo_unidad).toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {materia.length === 0 && (
          <p className="text-center text-gray-500 py-10">
            No hay materia prima registrada
          </p>
        )}
      </div>
    </div>
  );
};
