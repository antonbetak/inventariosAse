export const money = (value) =>
  Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  });
export const quantity = (value) =>
  Number(value ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 3 });
export const stockStatus = (item) =>
  item.stock_pendiente ? null : Number(item.stock_actual ?? 0) <= 0
    ? "Crítico"
    : Number(item.stock_actual) <= Number(item.stock_minimo ?? 0)
      ? "Bajo"
      : "Disponible";
export function recordDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
export const dateLabel = (value) =>
  recordDate(value)?.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }) ?? "Sin fecha registrada";

export const sortProducts = (products) => [...products].sort((a, b) =>
  (b.creadoEn ?? '').localeCompare(a.creadoEn ?? '') || a.nombre.localeCompare(b.nombre),
);
