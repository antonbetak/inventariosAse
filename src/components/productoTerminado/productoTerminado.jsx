import React, {useState} from "react";

export const ProductoTerminado = ({producto, onSave, onCancel}) => {
    const[fromData, setFormData] = useState(producto || {
        nombre: "",
        cantidad: "",
        unidad: "kg",
        precioVenta: "",
        descripcion: ""
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...fromData,
            cantidad: parseFloat(fromData.cantidad),
            precioVenta: parseFloat(fromData.precioVenta)
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
           {/* Nombre del producto */}
            <div>
                <label className="block text-sm font-medium mb-1">Nombre del producto</label>
                <input
                    type="text"
                    required
                    value={fromData.nombre}
                    onChange={(e) => setFormData({...fromData, nombre: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Cantidad */}
                <div>
                    <label className="block text-sm font-medium mb-1">Cantidad</label>
                    <input
                        type="number"
                        required
                        step="0.01"
                        value={fromData.cantidad}
                        onChange={(e) => setFormData({...fromData, cantidad: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {/* Unidad */}
                <div>
                    <label className="block text-sm font-medium mb-1">Unidad</label>
                    <select
                        value={fromData.unidad}
                        onChange={(e) => setFormData({...fromData, unidad: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="kg">kg</option>
                        <option value="litros">litros</option>
                        <option value="unidades">unidades</option>
                    </select>
                </div>
            </div>

            {/* Precio de venta */}
            <div>
                <label className="block text-sm font-medium mb-1">Precio de Venta</label>
                <input
                    type="number"
                    required
                    step="0.01"
                    value={fromData.precioVenta}
                    onChange={(e) => setFormData({...fromData, precioVenta: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Descripción */}
            <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                    value={fromData.descripcion}
                    onChange={(e) => setFormData({...fromData, descripcion: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <div className="flex gap-2 pt-4">
                <button
                    type="submit"
                    className="flex-1 bg-blue-300 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                    Guardar
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}