// A month is the reconciliation boundary: imported months and live operations
// are displayed separately and are never added into a purported profit figure.
export function commercialSales(sales = [], { from = '', to = '', includeTests = false, origin = 'all', productId = '' } = {}) {
  const selected = sales.filter(s => {
    const month = `${s.anio}-${String(s.mes).padStart(2, '0')}`;
    return (includeTests || !s.es_prueba) && (!productId || s.producto_id === productId) && (!from || month >= from) && (!to || month <= to) && (origin === 'all' || s.origen === origin);
  });
  const rows = selected.map(s => ({ ...s, periodo: `${s.anio}-${String(s.mes).padStart(2, '0')}`, ingreso: Number(s.ingreso), unidades: Number(s.unidades) }));
  const historical = rows.filter(s => s.origen === 'historico');
  const operational = rows.filter(s => s.origen === 'operacion');
  const keys = new Set(historical.map(s => `${s.producto_id}:${s.periodo}`));
  const overlap = operational.some(s => keys.has(`${s.producto_id}:${s.periodo}`));
  const sum = items => items.reduce((n, s) => n + Math.round(s.ingreso * 100), 0) / 100;
  const period = items => items.length ? [...new Set(items.map(s=>s.periodo))].sort().join(', ') : 'Sin ventas en el periodo';
  return { historicalPeriod:period(historical), operationalPeriod:period(operational), rows: rows.sort((a,b) => a.periodo.localeCompare(b.periodo) || a.nombre.localeCompare(b.nombre)), historicalTotal: sum(historical), operationalTotal: sum(operational), overlap, total: overlap ? null : sum(rows), units: rows.reduce((n,s) => n+s.unidades,0), period: rows.length ? [...new Set(rows.map(s=>s.periodo))].sort().join(', ') : 'Sin ventas en el periodo' };
}
