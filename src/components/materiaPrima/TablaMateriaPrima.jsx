import React from "react";

import { Plus, Edit2, Trash2 } from "lucide-react";

export const TablaMateriaPrima = ({ materia, onAdd, onEdit, onDelete }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Tabla de Entradas</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-2  bg-blue-500  text-white px-4 py-2 rounded hover:bg-blue-900 transition"
        >
          <Plus size={16} />
            Agregar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Cantidad</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Stock Mínimo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Costo por Unidad</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Proveedor</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {materia.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{m.nombre}</td>
                <td className="px-4 py-3">
                  <span className={m.cantidad <= m.stockMin ? "text-red-600 font-bold" : ""}>
                    {m.cantidad} {m.unidadMedida}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {m.stockMin} {m.unidadMedida}
                </td>
                <td className="px-4 py-3">${m.costo.toFixed(2)}</td>
                <td className="px-4 py-3">{m.proveedor}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onEdit(m)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(m.id)}
                    className="text-red-600 hover:text-red-800 p-1 ml-2"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {materia.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No hay material registrado
          </p>
        )}
      </div>
    </div>
  );
};
