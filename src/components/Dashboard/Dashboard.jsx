// src/components/Dashboard/Dashboard.jsx

import React, { useEffect, useState, useMemo } from "react";
import { Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Estadistica } from "../compComunes/Estadistica";

import { collection, getDocs } from "firebase/firestore";
import { db } from "../../utils/firebase";

export const Dashboard = ({ productoTerminado = [] }) => {
  const [materiaPrima, setMateriaPrima] = useState([]);
  const [productosTerminados, setProductosTerminados] = useState([]); // 🔹 historial de productos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔥 Leemos insumos + productosTerminados desde Firebase
  useEffect(() => {
    const cargarDesdeFirebase = async () => {
      try {
        const [snapInsumos, snapProductos] = await Promise.all([
          getDocs(collection(db, "insumos")),
          getDocs(collection(db, "productosTerminados")),
        ]);

        // ------- Insumos --------
        const dataInsumos = snapInsumos.docs.map((doc) => {
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

        // ------- Productos Terminados (historial) --------
        const dataProductos = snapProductos.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Ordenar por fecha (más nuevos primero)
        dataProductos.sort(
          (a, b) =>
            (b.creadoEn?.toDate?.() ?? new Date()) -
            (a.creadoEn?.toDate?.() ?? new Date())
        );

        setMateriaPrima(dataInsumos);
        setProductosTerminados(dataProductos);
      } catch (e) {
        console.error("Error leyendo Firestore en Dashboard:", e);
        setError("No se pudieron cargar los datos de Firebase.");
      } finally {
        setLoading(false);
      }
    };

    cargarDesdeFirebase();
  }, []);

  const ValorTotalMateriaPrima = useMemo(
    () =>
      materiaPrima.reduce(
        (suma, m) =>
          suma +
          Number(m.stock_actual ?? 0) * Number(m.costo_unidad ?? 0),
        0
      ),
    [materiaPrima]
  );

  // Usamos el historial de productosTerminados; si por algo viene el prop, lo usamos de fallback
  const productosParaResumen =
    productosTerminados.length > 0 ? productosTerminados : productoTerminado;

  const ValorTotalProductoTerminado = useMemo(
    () =>
      productosParaResumen.reduce(
        (suma, p) =>
          suma +
          Number(p.stock_actual ?? p.cantidad ?? 0) *
            Number(p.costo_unidad ?? p.costoUnitario ?? p.precioVenta ?? 0),
        0
      ),
    [productosParaResumen]
  );

  // ⚠️ Misma condición que usas en otros lados: stock_actual <= stock_minimo
  const pocoStockMateriaPrima = useMemo(
    () =>
      materiaPrima.filter(
        (m) =>
          Number(m.stock_actual ?? 0) <= Number(m.stock_minimo ?? 0)
      ),
    [materiaPrima]
  );

  if (loading) {
    return (
      <p className="p-6 text-center text-gray-500">
        Cargando resumen del inventario…
      </p>
    );
  }

  if (error) {
    return <p className="p-4 text-red-600">{error}</p>;
  }

  return (
    <div className="w-full space-y-8">
      {/* Título */}
      <div className="text-center">
        <h2 className="text-gray-500">Resumen del inventario</h2>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Estadistica
          icon={Package}
          title="Materia Prima"
          value={`$${ValorTotalMateriaPrima.toLocaleString("es-MX", {
            minimumFractionDigits: 2,
          })}`}
          color="#001a5a"
        />
        <Estadistica
          icon={ShoppingCart}
          title="Producto Terminado"
          value={`$${ValorTotalProductoTerminado.toLocaleString("es-MX", {
            minimumFractionDigits: 2,
          })}`}
          color="#5fa199"
        />
        <Estadistica
          icon={TrendingUp}
          title="Alertas de Reorden"
          value={pocoStockMateriaPrima.length}
          color="#bf092f"
        />
      </div>

      {/* Alertas */}
      {pocoStockMateriaPrima.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <h3 className="font-bold text-red-800 mb-2">Stock Bajo</h3>
          <ul className="space-y-1">
            {pocoStockMateriaPrima.map((m) => (
              <li key={m.id} className="text-red-700 text-sm">
                {m.nombre}: {m.stock_actual} {m.unidad_medida} (Mín:{" "}
                {m.stock_minimo})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Registros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas materias primas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Últimas Materias Primas</h3>
          <div className="space-y-2">
            {materiaPrima.slice(-5).reverse().map((m) => (
              <div key={m.id} className="flex justify-between py-2 border-b">
                <span className="font-medium">{m.nombre}</span>
                <span className="text-gray-600">
                  {m.stock_actual} {m.unidad_medida}
                </span>
              </div>
            ))}
            {materiaPrima.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No hay materias primas registradas
              </p>
            )}
          </div>
        </div>

        {/* Últimos productos terminados (HISTORIAL) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Últimos Productos</h3>
          <div className="space-y-2">
            {productosTerminados.slice(0, 5).map((p) => (
              <div key={p.id} className="flex justify-between py-2 border-b">
                {/* Nombre del producto */}
                <span className="font-medium">{p.nombre}</span>
                {/* Solo precioVenta */}
                <span className="text-gray-600">
                  ${Number(p.precioVenta ?? 0).toFixed(2)}
                </span>
              </div>
            ))}

            {productosTerminados.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No hay productos registrados
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
