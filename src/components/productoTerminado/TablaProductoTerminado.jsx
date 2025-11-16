import React from "react";

import {Plus, Edit2, Trash2} from "lucide-react"; 

export const TablaProductoTerminado = ({
    producto, 
    onAdd, 
    onEdit, 
    onDelete
}) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Tabla de Salidas</h2>
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
                            <th className="px-4 py-3 text-left text-sm font-semibold">Desripción</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Cantidad</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Precio de Venta</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {producto.map((producto) => (
                            <tr key={producto.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{producto.nombre}</td>
                                <td className="px-4 py-3">{producto.descripcion}</td>
                                <td className="px-4 py-3">
                                    {producto.cantidad} {producto.unidad}
                                </td>
                                <td className="px-4 py-3">${producto.precioVenta.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => onEdit(producto)}
                                        className="text-blue-600 hover:text-blue-800 p-1"
                                        title="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(producto.id)}
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
                {producto.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                        No hay productos registrados.
                    </div>
                )}
            </div>
        </div>
    );
};