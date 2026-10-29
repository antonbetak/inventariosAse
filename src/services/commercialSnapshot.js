// The application shows operating inventory. QA records remain in the database
// for audit purposes and cannot enter pickers, totals, or operational forms.
export function commercialSnapshot(snapshot) {
  const result = { ...snapshot };
  for (const key of ['rawMaterials', 'finishedProducts', 'movements', 'sales', 'expenses', 'batches', 'actualLosses']) {
    result[key] = (snapshot[key] ?? []).filter(row => !row.es_prueba);
  }
  const rawIds = new Set(result.rawMaterials.map(row => String(row.id)));
  result.lossSamples = (snapshot.lossSamples ?? []).filter(row => rawIds.has(String(row.insumo_id)));
  return result;
}
