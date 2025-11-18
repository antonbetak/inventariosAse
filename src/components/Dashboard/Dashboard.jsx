import React from "react";
import { Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Estadistica } from '../compComunes/Estadistica';

export const Dashboard = ({ materiaPrima, productoTerminado }) => {
  const ValorTotalMateriaPrima = materiaPrima.reduce(
    (suma, m) => suma + (m.cantidad * m.costoUnitario), 0
  );

  const ValorTotalProductoTerminado = productoTerminado.reduce(
    (suma, p) => suma + (p.cantidad * p.costoUnitario), 0
  );

  const pocoStockMateriaPrima = materiaPrima.filter(
    (m) => m.cantidad <= m.minStock
  );

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
          value={`$${ValorTotalMateriaPrima.toLocaleString('es-MX', {minimumFractionDigits: 2})}`}
          color="#001a5a"
        />
        <Estadistica
          icon={ShoppingCart}
          title="Producto Terminado"
          value={`$${ValorTotalProductoTerminado.toLocaleString('es-MX', {minimumFractionDigits: 2})}`}
          color="#5fa199"
        />
        <Estadistica
          icon={TrendingUp}
          title="Alertas de Reorden"
          value={pocoStockMateriaPrima.length}
          color="#bf092f"
        />
        <Estadistica
          icon={TrendingUp}
          title="Alertas de Stock de Seguridad"
          value={productoTerminado.length}
          color="#f0a500"
        />
      </div>

      {/* Alertas */}
      {pocoStockMateriaPrima.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <h3 className="font-bold text-red-800 mb-2">⚠️ Stock Bajo</h3>
          <ul className="space-y-1">
            {pocoStockMateriaPrima.map((m) => (
              <li key={m.id} className="text-red-700 text-sm">
                {m.nombre}: {m.cantidad} {m.unidad} (Mín: {m.minStock})
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
                <span className="text-gray-600">{m.cantidad} {m.unidad}</span>
              </div>
            ))}
            {materiaPrima.length === 0 && (
              <p className="text-gray-500 text-center py-4">No hay materias primas registradas</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Últimos Productos</h3>
          <div className="space-y-2">
            {productoTerminado.slice(-5).reverse().map((p) => (
              <div key={p.id} className="flex justify-between py-2 border-b">
                <span className="font-medium">{p.nombre}</span>
                <span className="text-gray-600">{p.cantidad} {p.unidad}</span>
              </div>
            ))}
            {productoTerminado.length === 0 && (
              <p className="text-gray-500 text-center py-4">No hay productos registrados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};