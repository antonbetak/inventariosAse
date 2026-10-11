// Illustrative demo data only. Never used to represent a production inventory.
export const DEMO_DATE = "2026-10-10T18:00:00.000Z";
const rawRows = [
  ["Alcohol etílico", "Ingredientes", 480, 120, 42, "L", 12, 0.015],
  ["Glicerina", "Ingredientes", 85, 30, 78, "kg", 3, 0.01],
  ["Agua purificada", "Ingredientes", 2400, 500, 1.8, "L", 95, 0.005],
  ["Carbómero", "Ingredientes", 7, 12, 310, "kg", 0.8, 0.025],
  ["Fragancia lavanda", "Fragancias", 18, 8, 260, "L", 0.5, 0.02],
  ["Fragancia cítrica", "Fragancias", 4, 6, 245, "L", 0.4, 0.018],
  ["Aceite esencial", "Fragancias", 0, 4, 580, "L", 0.2, 0.03],
  ["Envase PET 500 ml", "Empaque", 1800, 500, 3.5, "pzas", 75, 0.012],
  ["Envase PET 1 L", "Empaque", 740, 300, 5.8, "pzas", 35, 0.01],
  ["Atomizador", "Empaque", 110, 150, 4.2, "pzas", 12, 0.008],
  ["Etiqueta adhesiva", "Empaque", 3200, 800, 0.85, "pzas", 130, 0.015],
  ["Caja corrugada", "Empaque", 260, 80, 14, "pzas", 10, 0.02],
  ["Conservador", "Ingredientes", 22, 10, 195, "kg", 0.6, 0.01],
  ["Colorante", "Ingredientes", 0, 3, 150, "L", 0.1, 0.04],
  ["Tensioactivo", "Ingredientes", 160, 60, 64, "kg", 5, 0.02],
  ["Aloe vera", "Ingredientes", 46, 20, 135, "kg", 1.5, 0.025],
  ["Tapa de rosca", "Empaque", 2100, 600, 1.2, "pzas", 95, 0.006],
  ["Esencia eucalipto", "Fragancias", 11, 5, 280, "L", 0.3, 0.018],
];
export const mockRawMaterials = rawRows.map(
  (
    [
      nombre,
      categoria,
      stock_actual,
      stock_minimo,
      costo_unidad,
      unidad_medida,
      consumo_promedio,
      merma_mensual,
    ],
    i,
  ) => ({
    id: `raw-${i + 1}`,
    nombre,
    categoria,
    stock_actual,
    stock_minimo,
    costo_unidad,
    unidad_medida,
    consumo_promedio,
    merma_mensual,
    proveedor: i % 2 ? "Suministros del Centro" : "Distribuidora Sanaté",
    createdAt: new Date(
      Date.parse(DEMO_DATE) - (20 - i) * 86400000,
    ).toISOString(),
  }),
);
const productRows = [
  ["Gel antibacterial 500 ml", "Higiene", 420, 100, 49],
  ["Gel antibacterial 1 L", "Higiene", 180, 60, 89],
  ["Jabón líquido 500 ml", "Higiene", 310, 80, 38],
  ["Jabón líquido 1 L", "Higiene", 160, 50, 68],
  ["Sanitizante 500 ml", "Desinfección", 240, 70, 45],
  ["Sanitizante 1 L", "Desinfección", 95, 40, 79],
  ["Limpiador multiusos 1 L", "Limpieza", 360, 100, 42],
  ["Limpiador lavanda 1 L", "Limpieza", 30, 50, 46],
  ["Shampoo aloe vera 500 ml", "Cuidado personal", 120, 40, 79],
  ["Crema corporal 500 ml", "Cuidado personal", 80, 30, 119],
  ["Gel antibacterial bolsillo", "Higiene", 0, 60, 25],
  ["Jabón líquido cítrico 1 L", "Higiene", 210, 60, 72],
  ["Desengrasante 1 L", "Limpieza", 150, 50, 59],
  ["Limpiador eucalipto 1 L", "Limpieza", 25, 40, 48],
  ["Agua purificada 1 L", "Bebidas", 520, 120, 12],
  ["Garrafón de 20 litros", "Bebidas", 85, 25, 35],
];
export const mockFinishedProducts = productRows.map(
  ([nombre, categoria, cantidad, stock_minimo, precioVenta], i) => ({
    id: `product-${i + 1}`,
    nombre,
    categoria,
    cantidad,
    stock_minimo,
    precioVenta,
    unidad: "unidades",
    descripcion: `Lote demo SAN-${String(i + 1).padStart(3, "0")}`,
    creadoEn: new Date(Date.parse(DEMO_DATE) - i * 9 * 3600000).toISOString(),
    insumos: [],
  }),
);
export const mockMovements = Array.from({ length: 18 }, (_, i) => {
  const entrada = i % 3 !== 0;
  const item = entrada
    ? mockRawMaterials[i % mockRawMaterials.length]
    : mockFinishedProducts[i % mockFinishedProducts.length];
  const cantidad = entrada ? 20 + i * 3 : 10 + i;
  return {
    id: `movement-${i + 1}`,
    tipo: entrada ? "entrada" : "salida",
    entidad: entrada ? "materia" : "producto",
    registroId: item.id,
    nombre: item.nombre,
    cantidad,
    unidad: entrada ? item.unidad_medida : item.unidad,
    valor: cantidad * (entrada ? item.costo_unidad : item.precioVenta),
    fecha: new Date(Date.parse(DEMO_DATE) - i * 5 * 3600000).toISOString(),
    descripcion: entrada
      ? "Entrada de insumo · demo"
      : "Salida de producto · demo",
  };
});
// Per-unit example recipes; production formulas must be supplied by the future API.
export const mockRecipes = {
  "Gel antibacterial 500 ml": [
    { id: "raw-1", cantidadPorUnidad: 0.35 },
    { id: "raw-2", cantidadPorUnidad: 0.008 },
    { id: "raw-3", cantidadPorUnidad: 0.14 },
    { id: "raw-8", cantidadPorUnidad: 1 },
    { id: "raw-11", cantidadPorUnidad: 1 },
  ],
  "Jabón líquido 1 L": [
    { id: "raw-3", cantidadPorUnidad: 0.8 },
    { id: "raw-15", cantidadPorUnidad: 0.15 },
    { id: "raw-9", cantidadPorUnidad: 1 },
    { id: "raw-17", cantidadPorUnidad: 1 },
  ],
};
