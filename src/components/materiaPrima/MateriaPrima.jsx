import React, {useState} from "react";

export const MateriaPrima = ({materia, onSave, onCancel}) => {
    const[formData, setFormData] = useState(materia || {
        nombre: "",
        cantidad: "",
        unidad: "kg",
        minStock: "",
        costoUnitario: "",
        proveedor: ""
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            cantidad: parseFloat(formData.cantidad),
            minStock: parseFloat(formData.minStock),
            costoUnitario: parseFloat(formData.costoUnitario)
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Cantidad</label>
                    <input
                        type="number"
                        required
                        step="0.01"
                        value={formData.cantidad}
                        onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Unidad</label>
                    <select
                        value={formData.unidad}
                        onChange={(e) => setFormData({...formData, unidad: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="kg">kg</option>
                        <option value="L">L</option>
                        <option value="mL">mL</option>
                        <option value="unidades">unidades</option>
                    </select>
                </div>    
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Stock Mínimo</label>
                <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.minStock}
                    onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Costo por Unidad (MXN)</label>
                <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.costoUnitario}
                    onChange={(e) => setFormData({...formData, costoUnitario: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Proveedor</label>
                <input
                    type="text"
                    required
                    value={formData.proveedor}
                    onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <div className="flex gap-2 pt-4">
                <button
                    type="submit"
                    className="flex-1 bg-blue-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    Guardar
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
};