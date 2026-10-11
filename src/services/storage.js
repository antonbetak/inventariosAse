import {
  mockRawMaterials,
  mockFinishedProducts,
  mockMovements,
} from "../data/mockInventory.js";
import { mockDashboardHistory } from "../data/mockReports.js";
export const STORAGE_KEYS = Object.freeze({
  session: "sanate_mock_session",
  inventory: "sanate_inventory_demo_v1",
  navigation: "sanate_active_tab",
  dashboard: "sanate_dashboard_demo_v1",
});
export const INVENTORY_EVENT = "sanate:inventory-changed";
export function readInventory() {
  const stored = localStorage.getItem(STORAGE_KEYS.inventory);
  if (!stored) {
    const seed = structuredClone({
      version: 1,
      rawMaterials: mockRawMaterials,
      finishedProducts: mockFinishedProducts,
      movements: mockMovements,
      history: mockDashboardHistory,
    });
    localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(seed));
    return seed;
  }
  let data;
  try {
    data = JSON.parse(stored);
  } catch {
    throw new Error(
      "Los datos guardados no se pueden leer. Conserva una copia antes de limpiar el almacenamiento.",
    );
  }
  if (
    data.version !== 1 ||
    !["rawMaterials", "finishedProducts", "movements", "history"].every((k) =>
      Array.isArray(data[k]),
    )
  )
    throw new Error(
      "Formato de inventario no compatible. No se sobrescribieron tus datos.",
    );
  return data;
}
export function writeInventory(data) {
  try {
    localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(data));
  } catch {
    throw new Error(
      "No se pudo guardar. Revisa el espacio y los permisos de almacenamiento del navegador.",
    );
  }
  window.dispatchEvent(new Event(INVENTORY_EVENT));
}
