import {
  DEMO_DATE,
  mockRawMaterials,
  mockFinishedProducts,
} from "./mockInventory.js";
const finalRaw = mockRawMaterials.reduce(
  (sum, i) => sum + i.stock_actual * i.costo_unidad,
  0,
);
const finalProduct = mockFinishedProducts.reduce(
  (sum, i) => sum + i.cantidad * i.precioVenta,
  0,
);
// Synthetic historical series, clearly labelled as demo in the interface.
export const mockDashboardHistory = Array.from({ length: 90 }, (_, i) => {
  const factor = i === 89 ? 1 : 0.72 + i * 0.003 + Math.sin(i * 0.24) * 0.025;
  const materiaPrima = Math.round(finalRaw * factor * 100) / 100;
  const productoTerminado = Math.round(finalProduct * factor * 100) / 100;
  return {
    fecha: new Date(Date.parse(DEMO_DATE) - (89 - i) * 86400000).toISOString(),
    materiaPrima,
    productoTerminado,
    total: Math.round((materiaPrima + productoTerminado) * 100) / 100,
  };
});
