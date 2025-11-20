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
} from "recharts";

export const Reportes = () => {
  const [insumos, setInsumos] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastExport, setLastExport] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [snapInsumos, snapEntradas] = await Promise.all([
          getDocs(collection(db, "insumos")),
          getDocs(collection(db, "entradasMateriaPrima")),
        ]);

        const LEAD_TIME_DIAS = 2;

        const dataInsumos = snapInsumos.docs.map((doc) => {
          const d = doc.data();
          const stock_actual = Number(d.stock_actual ?? 0);
          const stock_minimo = Number(d.stock_minimo ?? 0);
          const consumo_promedio = Number(d.consumo_promedio ?? 0);

          const punto_reorden =
            consumo_promedio > 0 || stock_minimo > 0
              ? Math.ceil(consumo_promedio * LEAD_TIME_DIAS + stock_minimo)
              : 0;

          const enRiesgo =
            punto_reorden > 0 ? stock_actual <= punto_reorden : false;

          return {
            id: doc.id,
            nombre: d.nombre || "(Sin nombre)",
            categoria: d.categoria || "General",
            stock_actual,
            stock_minimo,
            consumo_promedio,
            costo_unidad: Number(d.costo_unidad ?? 0),
            unidad_medida: d.unidad_medida || "",
            merma_mensual: Number(d.merma_mensual ?? 0), // 👈 merma desde Firebase
            punto_reorden,
            enRiesgo,
          };
        });

        const dataEntradas = snapEntradas.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            ...d,
            valor_total: Number(d.valor_total ?? d.valor ?? 0),
          };
        });

        setInsumos(dataInsumos);
        setEntradas(dataEntradas);
      } catch (e) {
        console.error("Error leyendo datos para reportes:", e);
        setError("No se pudieron cargar los datos de Firebase.");
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  const formatCurrency = (n) =>
    n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

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

  const resumenEntradas = useMemo(() => {
    const registros = insumos.length;
    const valor = insumos.reduce(
      (acc, i) => acc + i.stock_actual * i.costo_unidad,
      0
    );
    return { registros, valor };
  }, [insumos]);

  const resumenSalidas = useMemo(() => {
    const registros = entradas.length;
    const valor = entradas.reduce(
      (acc, e) => acc + Number(e.valor_total ?? 0),
      0
    );
    return { registros, valor };
  }, [entradas]);

  const reporteCompleto = useMemo(
    () => ({
      totalItems: resumen.totalInsumos,
      valorTotal: resumen.valorTotal,
    }),
    [resumen]
  );

  // 🔹 Datos para la gráfica de reorden (LA MISMA QUE TENÍAS)
  const datosGrafica = useMemo(() => {
    const withRatio = insumos
      .filter((i) => i.punto_reorden > 0)
      .map((i) => ({
        ...i,
        ratio: i.stock_actual / i.punto_reorden,
      }))
      .sort((a, b) => a.ratio - b.ratio);

    const enReorden = withRatio.filter((i) => i.ratio <= 1);

    return enReorden.length > 0
      ? enReorden.slice(0, 7)
      : withRatio.slice(0, 7);
  }, [insumos]);

  // 🔹 Top 3 productos con mayor merma
  const topMerma = useMemo(() => {
    return [...insumos]
      .filter((i) => i.merma_mensual > 0)
      .sort((a, b) => b.merma_mensual - a.merma_mensual)
      .slice(0, 3);
  }, [insumos]);

  // ✔️ Exportar CSV con merma
  const handleExportCSV = () => {
    if (insumos.length === 0) return;

    const headers = [
      "Nombre",
      "Categoría",
      "Stock actual",
      "Stock mínimo (SS)",
      "Consumo promedio (d)",
      "Punto de reorden (R)",
      "Unidad",
      "Costo unidad",
      "Valor en inventario",
      "Merma mensual (%)",
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
        (i.merma_mensual * 100).toFixed(2) + "%",
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
            Descarga los reportes de tu inventario y revisa visualmente los
            puntos de reorden.
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

      {/* Cards resumen (ahora 4 columnas con top merma) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-softFadeUp">
        {/* Entradas */}
        <div className="bg-white rounded-3xl shadow-md border border-sky-50 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Entradas</h3>
          <p className="text-xs text-gray-500 mb-4">
            Inventario actual con costos y unidades.
          </p>
          <p className="text-xs text-gray-600">
            <strong>Registros:</strong> {resumenEntradas.registros}
            <br />
            <strong>Valor inventario:</strong>{" "}
            {formatCurrency(resumenEntradas.valor)}
          </p>
        </div>

        {/* Salidas */}
        <div className="bg-white rounded-3xl shadow-md border border-emerald-50 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Salidas</h3>
          <p className="text-xs text-gray-500 mb-4">
            Movimientos registrados en entradasMateriaPrima.
          </p>
          <p className="text-xs text-gray-600">
            <strong>Registros:</strong> {resumenSalidas.registros}
            <br />
            <strong>Valor movimientos:</strong>{" "}
            {formatCurrency(resumenSalidas.valor)}
          </p>
        </div>

        {/* Reporte completo */}
        <div className="bg-white rounded-3xl shadow-md border border-purple-50 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">
            Reporte completo
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Resumen total de inventario actual.
          </p>
          <p className="text-xs text-gray-600">
            <strong>Total items:</strong> {reporteCompleto.totalItems}
            <br />
            <strong>Valor total:</strong>{" "}
            {formatCurrency(reporteCompleto.valorTotal)}
          </p>
        </div>

        {/* Top 3 merma */}
        <div className="bg-white rounded-3xl shadow-md border border-rose-50 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">
            Top 3 merma mensual
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Insumos con mayor porcentaje de merma.
          </p>
          <ul className="text-xs text-gray-700 space-y-1">
            {topMerma.length === 0 ? (
              <li>No hay datos de merma registrados.</li>
            ) : (
              topMerma.map((i, idx) => (
                <li key={i.id} className="flex justify-between">
                  <span>
                    <span className="font-semibold">{idx + 1}.</span>{" "}
                    {i.nombre}
                  </span>
                  <span className="font-semibold">
                    {(i.merma_mensual * 100).toFixed(2)}%
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Gráfica de reorden (NO SE TOCA 😌) */}
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-gray-100 p-5 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-800 tracking-wide uppercase">
            Gráfica de reorden (stock vs mínimo)
          </h3>
          <span className="text-xs text-gray-400">
            Mostrando los {datosGrafica.length} insumos más cercanos o en
            punto de reorden
          </span>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosGrafica}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="nombre"
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="stock_actual"
                name="Stock actual"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="punto_reorden"
                name="Punto de reorden (R)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla con merma */}
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-200">
            <tr>
              {[
                "Nombre",
                "Stock",
                "Mínimo (SS)",
                "Punto reorden (R)",
                "Consumo prom.",
                "Costo",
                "Merma (%)",
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
            {insumos.map((i) => (
              <tr
                key={i.id}
                className="group hover:bg-indigo-50/60 transition-all duration-300"
              >
                <td className="px-4 md:px-6 py-3 font-medium text-gray-900">
                  {i.nombre}
                </td>
                <td className="px-4 md:px-6 py-3 text-sm">
                  {i.stock_actual} {i.unidad_medida}
                </td>
                <td className="px-4 md:px-6 py-3 text-sm">
                  {i.stock_minimo}
                </td>
                <td className="px-4 md:px-6 py-3 text-sm">
                  {i.punto_reorden}
                </td>
                <td className="px-4 md:px-6 py-3 text-sm">
                  {i.consumo_promedio || "-"}
                </td>
                <td className="px-4 md:px-6 py-3 text-sm">
                  ${i.costo_unidad.toFixed(2)}
                </td>
                <td className="px-4 md:px-6 py-3 text-sm">
                  {(i.merma_mensual * 100).toFixed(2)}%
                </td>
                <td className="px-4 md:px-6 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      i.enRiesgo
                        ? "bg-rose-50 text-rose-700 border-rose-200"
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
          <p className="text-center text-gray-500 py-8">
            No hay información de insumos para mostrar.
          </p>
        )}
      </div>

      {lastExport && (
        <p className="text-xs text-gray-400 text-right">
          Última exportación: {lastExport.fecha} · {lastExport.registros}{" "}
          registros
        </p>
      )}
    </div>
  );
};
