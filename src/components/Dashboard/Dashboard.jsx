// src/components/Dashboard/Dashboard.jsx

import React, { useEffect, useState, useMemo } from "react";
import { Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Estadistica } from "../compComunes/Estadistica";

import { collection, getDocs } from "firebase/firestore";
import { db } from "../../utils/firebase";

export const Dashboard = ({ productoTerminado = [] }) => {
  const [materiaPrima, setMateriaPrima] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔥 Leemos insumos desde Firebase (igualito que en TablaProductoTerminado)
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

        setMateriaPrima(data);
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

  const ValorTotalProductoTerminado = useMemo(
    () =>
      productoTerminado.reduce(
        (suma, p) =>
          suma +
          Number(p.stock_actual ?? p.cantidad ?? 0) *
            Number(p.costo_unidad ?? p.costoUnitario ?? 0),
        0
      ),
    [productoTerminado]
  );

  // ⚠️ AQUÍ ESTÁ LA MAGIA: MISMA CONDICIÓN QUE EN TU TABLA
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
          // 👉 AQUÍ YA MARCA 1 SI LA TAPA #54 ESTÁ EN STOCK BAJO
          value={pocoStockMateriaPrima.length}
          color="#bf092f"
        />
      </div>

      {/* Alertas */}
      {pocoStockMateriaPrima.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <h3 className="font-bold text-red-800 mb-2"> Stock Bajo</h3>
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

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Últimos Productos</h3>
          <div className="space-y-2">
            {productoTerminado.slice(-5).reverse().map((p) => (
              <div key={p.id} className="flex justify-between py-2 border-b">
                <span className="font-medium">{p.nombre}</span>
                <span className="text-gray-600">
                  {p.stock_actual ?? p.cantidad}{" "}
                  {p.unidad_medida ?? p.unidad}
                </span>
              </div>
            ))}
            {productoTerminado.length === 0 && (
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
