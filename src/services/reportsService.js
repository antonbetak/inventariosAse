import { inventoryService } from "./inventoryService.js";
export const reportsService = {
  async getSummary(snapshot) {
    const data = snapshot ?? (await inventoryService.getSnapshot());
    const insumos = data.rawMaterials.map((i) => {
      const punto_reorden = Number(i.punto_reorden ?? Math.ceil(i.consumo_promedio * 2 + i.stock_minimo));
      return {
        ...i,
        punto_reorden,
        enRiesgo: punto_reorden > 0 && i.stock_actual <= punto_reorden,
      };
    });
    const rawValue = insumos.reduce(
        (s, i) => s + i.stock_actual * i.costo_unidad,
        0,
      ),
      productValue = data.finishedProducts.reduce(
        (s, p) => s + (p.stock_pendiente ? 0 : p.cantidad * p.precioVenta),
        0,
      );
    const entradas = data.movements.filter((m) => m.tipo === "salida");
    const datosGrafica = [...insumos]
      .filter((i) => i.punto_reorden > 0)
      .sort(
        (a, b) =>
          a.stock_actual / a.punto_reorden - b.stock_actual / b.punto_reorden,
      )
      .slice(0, 7);
    const movementDays = new Map();
    for (const m of data.movements.filter((m) =>
      ["entrada", "salida"].includes(m.tipo),
    )) {
      const day = m.fecha.slice(0, 10);
      if (!movementDays.has(day))
        movementDays.set(day, { fecha: day, entradas: 0, salidas: 0 });
      movementDays.get(day)[m.tipo === "entrada" ? "entradas" : "salidas"] +=
        m.valor;
    }
    return {
      salesTotal: (data.sales??[]).reduce((sum,s)=>sum+Number(s.ingreso),0),
      salesUnits: (data.sales??[]).reduce((sum,s)=>sum+Number(s.unidades),0),
      projectedLossCost: (data.projections??[]).reduce((sum,p)=>sum+Number(p.costo_merma),0),
      insumos,
      rawValue,
      productValue,
      totalValue: rawValue + productValue,
      resumen: { necesitanReorden: insumos.filter((i) => i.enRiesgo).length },
      resumenEntradas: { registros: insumos.length, valor: rawValue },
      resumenSalidas: {
        registros: entradas.length,
        valor: entradas.reduce((s, i) => s + i.valor, 0),
      },
      reporteCompleto: { totalItems: insumos.length, valorTotal: rawValue },
      datosGrafica,
      topMerma: [...insumos]
        .sort((a, b) => b.merma_mensual - a.merma_mensual)
        .slice(0, 3),
      movementDays: [...movementDays.values()]
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .slice(-7),
      history: data.history,
      activity: [...data.movements]
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .slice(0, 6),
    };
  },
  async getExportRows(snapshot) {
    const { insumos } = await this.getSummary(snapshot);
    return insumos.map((i) => ({
      Nombre: i.nombre,
      Categoría: i.categoria,
      "Stock actual": i.stock_actual,
      "Stock mínimo (SS)": i.stock_minimo,
      "Consumo promedio": i.consumo_promedio,
      "Punto de reorden": i.punto_reorden,
      Unidad: i.unidad_medida,
      "Costo unidad": i.costo_unidad,
      "Valor en inventario": (i.stock_actual * i.costo_unidad).toFixed(2),
      "Merma mensual (%)": (i.merma_mensual * 100).toFixed(2),
      "En riesgo": i.enRiesgo ? "Sí" : "No",
    }));
  },
};
