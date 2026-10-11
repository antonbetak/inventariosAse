import {
  readInventory,
  writeInventory,
  INVENTORY_EVENT,
  STORAGE_KEYS,
} from "./storage.js";
import { mockRecipes } from "../data/mockInventory.js";
const id = () => crypto.randomUUID();
const number = (value, label) => {
  if (
    value === "" ||
    value == null ||
    !Number.isFinite(Number(value)) ||
    Number(value) < 0
  )
    throw new Error(`${label} debe ser un número mayor o igual a cero.`);
  return Number(value);
};
const text = (value, label) => {
  const result = String(value ?? "").trim();
  if (!result) throw new Error(`Completa ${label}.`);
  return result;
};
function normalizeRaw(input) {
  return {
    ...input,
    nombre: text(input.nombre, "el nombre"),
    categoria: text(input.categoria, "la categoría"),
    unidad_medida: text(input.unidad_medida, "la unidad"),
    stock_actual: number(input.stock_actual, "Stock"),
    stock_minimo: number(input.stock_minimo, "Stock mínimo"),
    costo_unidad: number(input.costo_unidad, "Costo"),
    consumo_promedio: number(input.consumo_promedio ?? 0, "Consumo"),
    merma_mensual: number(input.merma_mensual ?? 0, "Merma"),
  };
}
function normalizeProduct(input) {
  return {
    ...input,
    nombre: text(input.nombre, "el nombre"),
    categoria: text(input.categoria, "la categoría"),
    unidad: text(input.unidad, "la unidad"),
    cantidad: number(input.cantidad, "Cantidad"),
    stock_minimo: number(input.stock_minimo ?? 0, "Stock mínimo"),
    precioVenta: number(input.precioVenta, "Precio"),
  };
}
function captureHistory(data) {
  const materiaPrima = data.rawMaterials.reduce(
      (s, i) => s + i.stock_actual * i.costo_unidad,
      0,
    ),
    productoTerminado = data.finishedProducts.reduce(
      (s, i) => s + i.cantidad * i.precioVenta,
      0,
    );
  const sample = {
    fecha: new Date().toISOString(),
    materiaPrima,
    productoTerminado,
    total: materiaPrima + productoTerminado,
  };
  const last = data.history.at(-1);
  if (last?.fecha.slice(0, 10) === sample.fecha.slice(0, 10))
    data.history[data.history.length - 1] = sample;
  else data.history.push(sample);
}
function movement(data, item, { tipo, entidad, cantidad, descripcion }) {
  data.movements.unshift({
    id: id(),
    registroId: item.id,
    nombre: item.nombre,
    tipo,
    entidad,
    cantidad,
    unidad: entidad === "materia" ? item.unidad_medida : item.unidad,
    valor:
      cantidad * (entidad === "materia" ? item.costo_unidad : item.precioVenta),
    fecha: new Date().toISOString(),
    descripcion,
  });
}
function save(data) {
  captureHistory(data);
  writeInventory(data);
}
function find(data, key, itemId) {
  const item = data[key].find((i) => i.id === itemId);
  if (!item) throw new Error("El registro ya no existe. Actualiza la página.");
  return item;
}
export const inventoryService = {
  recipeNames: Object.freeze(Object.keys(mockRecipes)),
  async getSnapshot() {
    return readInventory();
  },
  async getRawMaterials() {
    return readInventory().rawMaterials;
  },
  async getFinishedProducts() {
    return readInventory().finishedProducts;
  },
  subscribe(callback) {
    const changed = (e) => {
      if (e.type !== "storage" || e.key === STORAGE_KEYS.inventory) callback();
    };
    window.addEventListener(INVENTORY_EVENT, changed);
    window.addEventListener("storage", changed);
    return () => {
      window.removeEventListener(INVENTORY_EVENT, changed);
      window.removeEventListener("storage", changed);
    };
  },
  async createRawMaterial(input) {
    const data = readInventory();
    const item = {
      ...normalizeRaw(input),
      id: id(),
      createdAt: new Date().toISOString(),
    };
    data.rawMaterials.push(item);
    movement(data, item, {
      tipo: "entrada",
      entidad: "materia",
      cantidad: item.stock_actual,
      descripcion: "Materia prima creada",
    });
    save(data);
    return item;
  },
  async updateRawMaterial(itemId, input) {
    const data = readInventory(),
      old = find(data, "rawMaterials", itemId);
    const item = {
      ...normalizeRaw({ ...old, ...input }),
      id: old.id,
      createdAt: old.createdAt,
      updatedAt: new Date().toISOString(),
    };
    data.rawMaterials = data.rawMaterials.map((i) =>
      i.id === itemId ? item : i,
    );
    movement(data, item, {
      tipo: "ajuste",
      entidad: "materia",
      cantidad: item.stock_actual - old.stock_actual,
      descripcion: "Materia prima actualizada",
    });
    save(data);
    return item;
  },
  async deleteRawMaterial(itemId) {
    const data = readInventory(),
      item = find(data, "rawMaterials", itemId);
    data.rawMaterials = data.rawMaterials.filter((i) => i.id !== itemId);
    movement(data, item, {
      tipo: "eliminación",
      entidad: "materia",
      cantidad: item.stock_actual,
      descripcion: "Materia prima eliminada",
    });
    save(data);
  },
  async registerRawMaterialEntry(itemId, quantity) {
    const data = readInventory(),
      item = find(data, "rawMaterials", itemId);
    const cantidad = number(quantity, "Cantidad");
    if (cantidad <= 0) throw new Error("La entrada debe ser mayor a cero.");
    item.stock_actual += cantidad;
    item.updatedAt = new Date().toISOString();
    movement(data, item, {
      tipo: "entrada",
      entidad: "materia",
      cantidad,
      descripcion: "Entrada de materia prima",
    });
    save(data);
    return item;
  },
  async getRecipe(name, quantity) {
    const data = readInventory(),
      recipe = mockRecipes[name];
    if (!recipe)
      throw new Error(
        "No hay receta para este nombre. Puedes agregar insumos manualmente.",
      );
    const amount = number(quantity, "Cantidad");
    if (!amount) throw new Error("Captura una cantidad mayor a cero.");
    return recipe.map((r) => {
      const item = find(data, "rawMaterials", r.id);
      return {
        id: item.id,
        nombre: item.nombre,
        cantidadUsada: Number((r.cantidadPorUnidad * amount).toFixed(4)),
        unidad: item.unidad_medida,
      };
    });
  },
  async createFinishedProduct(input) {
    const data = readInventory(),
      item = {
        ...normalizeProduct(input),
        id: id(),
        creadoEn: new Date().toISOString(),
      };
    const used = new Map();
    for (const ins of item.insumos ?? []) {
      const qty = number(ins.cantidadUsada, "Cantidad de insumo");
      if (!qty) throw new Error("La cantidad de insumo debe ser mayor a cero.");
      used.set(ins.id, (used.get(ins.id) || 0) + qty);
    }
    // Validate all consumption before a single local write; never leave a partial recipe.
    for (const [rawId, qty] of used) {
      const raw = find(data, "rawMaterials", rawId);
      if (qty > raw.stock_actual)
        throw new Error(
          `Stock insuficiente de ${raw.nombre}. Disponible: ${raw.stock_actual}`,
        );
    }
    for (const [rawId, qty] of used) {
      const raw = find(data, "rawMaterials", rawId);
      raw.stock_actual = Number((raw.stock_actual - qty).toFixed(4));
      movement(data, raw, {
        tipo: "salida",
        entidad: "materia",
        cantidad: qty,
        descripcion: `Producción: ${item.nombre}`,
      });
    }
    data.finishedProducts.push(item);
    movement(data, item, {
      tipo: "entrada",
      entidad: "producto",
      cantidad: item.cantidad,
      descripcion: "Producto registrado",
    });
    save(data);
    return item;
  },
  async updateFinishedProduct(itemId, input) {
    const data = readInventory(),
      old = find(data, "finishedProducts", itemId);
    const item = {
      ...normalizeProduct({ ...old, ...input }),
      id: old.id,
      creadoEn: old.creadoEn,
      insumos: old.insumos,
      updatedAt: new Date().toISOString(),
    };
    data.finishedProducts = data.finishedProducts.map((i) =>
      i.id === itemId ? item : i,
    );
    movement(data, item, {
      tipo: "ajuste",
      entidad: "producto",
      cantidad: item.cantidad - old.cantidad,
      descripcion: "Producto actualizado",
    });
    save(data);
    return item;
  },
  async deleteFinishedProduct(itemId) {
    const data = readInventory(),
      item = find(data, "finishedProducts", itemId);
    data.finishedProducts = data.finishedProducts.filter(
      (i) => i.id !== itemId,
    );
    movement(data, item, {
      tipo: "eliminación",
      entidad: "producto",
      cantidad: item.cantidad,
      descripcion: "Producto eliminado",
    });
    save(data);
  },
};
