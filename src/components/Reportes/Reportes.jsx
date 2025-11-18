import React, { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../utils/firebase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export const Reportes = () => {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastExport, setLastExport] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const snap = await getDocs(collection(db, "insumos"));

        const data = snap.docs.map((doc) => {
          const d = doc.data();
          const stock_actual = Number(d.stock_actual ?? 0);
          const stock_minimo = Number(d.stock_minimo ?? 0);
          const consumo_promedio = Number(d.consumo_promedio ?? 0);

          // lógica simple de reorden
          const punto_reorden = stock_minimo || Math.ceil(consumo_promedio * 1.5);
          const enRiesgo = stock_actual <= stock_minimo;

          return {
            id: doc.id,
            nombre: d.nombre || "(Sin nombre)",
            categoria: d.categoria || "General",
            stock_actual,
            stock_minimo,
            consumo_promedio,
            costo_unidad: Number(d.costo_unidad ?? 0),
            unidad_medida: d.unidad_medida || "",
            punto_reorden,
            enRiesgo,
          };
        });

        setInsumos(data);
      } catch (e) {
        console.error("Error leyendo insumos para reportes:", e);
        setError("No se pudieron cargar los datos de Firebase.");
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  // KPIs para las tarjetitas
  const resumen = useMemo(() => {
    return insumos.reduce(
      (acc, i) => {
        acc.totalInsumos += 1;
        acc.totalUnidades += i.stock_actual;
        acc.valorTotal += i.stock_actual * i.costo_unidad;
        if (i.enRiesgo) acc.necesitanReorden += 1;
        return acc;
      },
      { totalInsumos: 0, totalUnidades: 0, valorTotal: 0, necesitanReorden: 0 }
    );
  }, [insumos]);

  // Datos para gráfica de reorden (top 7 por peor nivel de stock)
  const datosGrafica = useMemo(() => {
    const withRatio = insumos.map((i) => ({
      ...i,
      ratio: i.stock_minimo > 0 ? i.stock_actual / i.stock_minimo : 999,
    }));

    return withRatio
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 7); // top 7 más críticos
  }, [insumos]);

  const handleExportCSV = () => {
    if (insumos.length === 0) return;

    const headers = [
      "Nombre",
      "Categoría",
      "Stock actual",
      "Stock mínimo",
      "Consumo promedio",
      "Punto de reorden",
      "Unidad",
      "Costo unidad",
      "Valor en inventario",
      "En riesgo reorden",
    ];

    const rows = insumos.map((i) => {
      const valor = i.stock_actual * i.costo_unidad;
      return [
        i.nombre,
        i.categoria,
        i.stock_actual,
        i.stock_minimo,
        i.consumo_promedio,
        i.punto_reorden,
        i.unidad_medida,
        i.costo_unidad,
        valor.toFixed(2),
        i.enRiesgo ? "Sí" : "No",
      ];
    });

    const escapeCSV = (value) => {
      if (value == null) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte_reorden_sanate.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setLastExport({
      fecha: new Date().toLocaleString(),
      registros: insumos.length,
    });
  };

  if (loading) {
    return (
      <p className="p-6 text-center text-gray-500 animate-softFadeUp">
        Cargando reportes…
      </p>
    );
  }

  if (error) {
    return <p className="p-4 text-red-600">{error}</p>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-softFadeUp">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Reportes de inventario
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Exporta tu inventario a CSV y revisa visualmente los puntos de
            reorden.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white px-5 py-2.5 rounded-2xl shadow-lg hover:shadow-xl hover:brightness-110 active:scale-95 transition-all duration-200"
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-softFadeUp">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-sky-50 shadow-md px-4 py-3 flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-sky-500">
            Insumos
          </span>
          <span className="text-lg font-bold text-gray-900">
            {resumen.totalInsumos}
          </span>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl border border-indigo-50 shadow-md px-4 py-3 flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
            Unidades totales
          </span>
          <span className="text-lg font-bold text-gray-900">
            {resumen.totalUnidades.toLocaleString()}
          </span>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl border border-emerald-50 shadow-md px-4 py-3 flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
            Valor inventario
          </span>
          <span className="text-lg font-bold text-gray-900">
            ${resumen.valorTotal.toFixed(2)}
          </span>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl border border-rose-50 shadow-md px-4 py-3 flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-rose-500">
            Necesitan reorden
          </span>
          <span className="text-lg font-bold text-gray-900">
            {resumen.necesitanReorden}
          </span>
        </div>
      </div>

      {/* Gráfica de reorden */}
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-gray-100 p-5 space-y-3 animate-cardPop">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-800 tracking-wide uppercase">
            Gráfica de reorden (stock vs mínimo)
          </h3>
          <span className="text-xs text-gray-400">
            Mostrando los {datosGrafica.length} más críticos
          </span>
        </div>

        {datosGrafica.length === 0 ? (
          <p className="text-center text-gray-500 py-6">
            No hay insumos con información suficiente para graficar.
          </p>
        ) : (
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosGrafica}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nombre" angle={-15} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="stock_actual" name="Stock actual" radius={[8, 8, 0, 0]} />
                <Bar dataKey="stock_minimo" name="Stock mínimo" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tabla resumida */}
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-cardPop">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-200">
            <tr>
              {[
                "Nombre",
                "Stock",
                "Mínimo",
                "Punto reorden",
                "Consumo prom.",
                "Costo",
                "En riesgo",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 tracking-[0.08em] uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {insumos.map((i, idx) => (
              <tr
                key={i.id}
                className="group hover:bg-indigo-50/60 transition-all duration-300 animate-rowFloat"
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                <td className="px-4 md:px-6 py-3 font-medium text-gray-900">
                  <span className="group-hover:text-indigo-700 transition-colors">
                    {i.nombre}
                  </span>
                </td>

                <td className="px-4 md:px-6 py-3 text-sm">
                  {i.stock_actual} {i.unidad_medida}
                </td>

                <td className="px-4 md:px-6 py-3 text-sm text-gray-700">
                  {i.stock_minimo} {i.unidad_medida}
                </td>

                <td className="px-4 md:px-6 py-3 text-sm text-gray-700">
                  {i.punto_reorden} {i.unidad_medida}
                </td>

                <td className="px-4 md:px-6 py-3 text-sm text-gray-700">
                  {i.consumo_promedio || "-"}
                </td>

                <td className="px-4 md:px-6 py-3 text-sm text-gray-800">
                  ${i.costo_unidad.toFixed(2)}
                </td>

                <td className="px-4 md:px-6 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      i.enRiesgo
                        ? "bg-rose-50 text-rose-700 border-rose-200 animate-softGlow"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {i.enRiesgo ? "Sí" : "No"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {insumos.length === 0 && (
          <p className="text-center text-gray-500 py-10">
            No hay información de insumos para mostrar.
          </p>
        )}
      </div>

      {/* mini historial de exportación */}
      {lastExport && (
        <p className="text-xs text-gray-400 text-right">
          Última exportación: {lastExport.fecha} · {lastExport.registros} registros
        </p>
      )}
    </div>
  );
};
