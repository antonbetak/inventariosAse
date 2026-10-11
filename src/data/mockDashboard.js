export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
// Relative dates keep the illustrative agenda useful when the demo is opened later.
export function createDashboardSeed(reference = new Date()) {
  const events = [
    ["Reabastecer envases PET", 0, "09:00", "Compras"],
    ["Entrega mayorista", 0, "13:30", "Distribución"],
    ["Revisar stock de garrafones", 1, "10:00", "Inventario"],
    ["Mantenimiento del sistema de purificación", 3, "08:00", "Mantenimiento"],
    ["Pedido de etiquetas", 5, "12:00", "Compras"],
    ["Cierre semanal", 7, "17:00", "Operación"],
  ].map(([title, offset, time, category], index) => {
    const date = new Date(
      reference.getFullYear(),
      reference.getMonth(),
      reference.getDate() + offset,
    );
    return { id: `event-${index}`, title, date: dateKey(date), time, category };
  });
  const tasks = [
    ["Verificar stock de tapas", "Alta", false],
    ["Programar compra de filtros", "Alta", false],
    ["Revisar pedido de botellas 1L", "Media", true],
    ["Confirmar entrega a cliente mayorista", "Alta", false],
    ["Actualizar costos de materia prima", "Media", false],
    ["Hacer conteo de inventario", "Baja", false],
  ].map(([title, priority, completed], index) => ({
    id: `task-${index}`,
    title,
    priority,
    completed,
  }));
  return { version: 1, events, tasks };
}
