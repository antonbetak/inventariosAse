import { commercialSales } from './commercial.js';
import { inventoryService } from "./inventoryService.js";
export const reportsService = {
  async getSummary(snapshot, options = {}) {
    const source = snapshot ?? (await inventoryService.getSnapshot());
    const allowed = row => options.includeTests || !row.es_prueba;
    const data = {...source, rawMaterials: source.rawMaterials.filter(allowed), finishedProducts: source.finishedProducts.filter(allowed), movements: source.movements.filter(allowed)};
    const sales = commercialSales(data.sales, options);
    const insumos = data.rawMaterials.map((i) => {
      const punto_reorden = Number(i.punto_reorden ?? Math.ceil(i.consumo_promedio * 2 + i.stock_minimo));
      return {
        ...i,
        punto_reorden,
        enRiesgo: punto_reorden > 0 && i.stock_actual <= punto_reorden,
      };
    });
    const rawValue = insumos.reduce(
        (s, i) => s + (i.costo_pendiente || i.costo_unidad == null ? 0 : i.stock_actual * i.costo_unidad),
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
      ["entrada", "salida"].includes(m.tipo) && m.valor_conocido!==false,
    )) {
      const day = m.fecha.slice(0, 10);
      if (!movementDays.has(day))
        movementDays.set(day, { fecha: day, entradas: 0, salidas: 0 });
      movementDays.get(day)[m.tipo === "entrada" ? "entradas" : "salidas"] +=
        m.valor_conocido===false ? 0 : m.valor;
    }
    return {
      sales,
      salesTotal: sales.total,
      salesUnits: sales.units,
      projectedLossCost: (data.projections??[]).reduce((sum,p)=>sum+Number(p.costo_merma),0),
      insumos,
      rawValue,
      rawValueComplete: insumos.every(i=>!i.costo_pendiente&&i.costo_unidad!=null),
      productValueComplete: data.finishedProducts.every(p=>!p.stock_pendiente),
      productValue,
      totalValue: insumos.some(i=>i.costo_pendiente||i.costo_unidad==null)||data.finishedProducts.some(p=>p.stock_pendiente)?null:rawValue + productValue,
      resumen: { necesitanReorden: insumos.filter((i) => i.enRiesgo).length },
      resumenEntradas: { registros: insumos.length, valor: rawValue },
      resumenSalidas: {
        registros: entradas.length,
        valor: entradas.some(i=>i.valor_conocido===false)?null:entradas.reduce((s, i) => s + i.valor, 0),
      },
      reporteCompleto: { totalItems: insumos.length, valorTotal: rawValue },
      datosGrafica,
      topMerma: insumos.filter(i=>i.merma_mensual!=null)
        .sort((a, b) => b.merma_mensual - a.merma_mensual)
        .slice(0, 3),
      movementDays: [...movementDays.values()]
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .slice(-7),
      history: insumos.every(i=>!i.costo_pendiente&&i.costo_unidad!=null)?data.history:[],
      activity: [...data.movements]
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .slice(0, 6),
    };
  },
  async getExportRows(snapshot, options = {}) {
    const { insumos } = await this.getSummary(snapshot, options);
    return insumos.map((i) => ({
      Nombre: i.nombre,
      Categoría: i.categoria,
      "Stock actual": i.stock_actual,
      "Stock mínimo (SS)": i.stock_minimo,
      "Consumo promedio": i.consumo_promedio,
      "Punto de reorden": i.punto_reorden,
      Unidad: i.unidad_medida,
      "Costo unidad": i.costo_pendiente || i.costo_unidad == null ? "Pendiente" : i.costo_unidad,
      "Valor en inventario": i.costo_pendiente || i.costo_unidad == null ? "Pendiente" : (i.stock_actual * i.costo_unidad).toFixed(2),
      "Muestra de merma (%) — periodo sin validar": i.merma_mensual==null?"Pendiente":(i.merma_mensual * 100).toFixed(2),
      "En riesgo": i.enRiesgo ? "Sí" : "No",
    }));
  },
};
