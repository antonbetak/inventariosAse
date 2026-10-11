import { createDashboardSeed } from "../data/mockDashboard.js";
import { STORAGE_KEYS } from "./storage.js";
const KEY = STORAGE_KEYS.dashboard;
function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    throw new Error(
      "No se pudo guardar la agenda. Revisa el almacenamiento del navegador.",
    );
  }
  return data;
}
function read() {
  const stored = localStorage.getItem(KEY);
  if (!stored) return save(createDashboardSeed());
  let data;
  try {
    data = JSON.parse(stored);
  } catch {
    throw new Error(
      "No se puede leer la agenda guardada. Tus datos no se sobrescribieron.",
    );
  }
  if (
    data?.version !== 1 ||
    !Array.isArray(data.events) ||
    !Array.isArray(data.tasks) ||
    !data.events.every(
      (e) =>
        e &&
        typeof e.id === "string" &&
        typeof e.title === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
        typeof e.time === "string",
    ) ||
    !data.tasks.every(
      (t) =>
        t &&
        typeof t.id === "string" &&
        typeof t.title === "string" &&
        typeof t.completed === "boolean" &&
        ["Alta", "Media", "Baja"].includes(t.priority),
    )
  ) {
    throw new Error(
      "Formato de agenda no compatible. Tus datos no se sobrescribieron.",
    );
  }
  return data;
}
export const dashboardService = {
  async getSnapshot() {
    return read();
  },
  async toggleTask(id) {
    const data = read();
    const task = data.tasks.find((t) => t.id === id);
    if (!task) throw new Error("La tarea ya no está disponible.");
    task.completed = !task.completed;
    return save(data);
  },
  async addTask(title, priority = "Media") {
    const clean = String(title).trim();
    if (!clean || clean.length > 120)
      throw new Error("Escribe una tarea de hasta 120 caracteres.");
    if (!["Alta", "Media", "Baja"].includes(priority))
      throw new Error("Prioridad no válida.");
    const data = read();
    data.tasks.push({
      id: crypto.randomUUID(),
      title: clean,
      priority,
      completed: false,
    });
    return save(data);
  },
  async deleteTask(id) {
    const data = read();
    data.tasks = data.tasks.filter((t) => t.id !== id);
    return save(data);
  },
};
