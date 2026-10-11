import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { createDashboardSeed, dateKey } from "../src/data/mockDashboard.js";
import { dashboardService } from "../src/services/dashboardService.js";
const key = "sanate_dashboard_demo_v1";
beforeEach(() => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, String(v)),
  };
});
test("relative agenda dates cross month/year boundaries without UTC date shifts", () => {
  const seed = createDashboardSeed(new Date(2026, 11, 31));
  assert.equal(seed.events[0].date, "2026-12-31");
  assert.equal(seed.events[2].date, "2027-01-01");
  assert.equal(seed.events[5].date, "2027-01-07");
  assert.equal(dateKey(new Date(2028, 1, 29)), "2028-02-29");
});
test("task completion, creation and deletion persist without touching inventory", async () => {
  localStorage.setItem("sanate_inventory_demo_v1", "untouched");
  const original = await dashboardService.getSnapshot();
  await dashboardService.toggleTask(original.tasks[0].id);
  assert.equal((await dashboardService.getSnapshot()).tasks[0].completed, true);
  await dashboardService.addTask(" Revisar filtros ", "Alta");
  const latest = await dashboardService.getSnapshot();
  const task = latest.tasks.at(-1);
  assert.equal(task.title, "Revisar filtros");
  assert.equal(task.priority, "Alta");
  await dashboardService.deleteTask(task.id);
  assert.equal(
    (await dashboardService.getSnapshot()).tasks.length,
    original.tasks.length,
  );
  assert.equal(localStorage.getItem("sanate_inventory_demo_v1"), "untouched");
});
test("invalid tasks and corrupt storage never overwrite existing agenda", async () => {
  await dashboardService.getSnapshot();
  const stored = localStorage.getItem(key);
  await assert.rejects(dashboardService.addTask("   "));
  await assert.rejects(dashboardService.addTask("Valid title", "Urgent"));
  await assert.rejects(dashboardService.toggleTask("missing"));
  assert.equal(localStorage.getItem(key), stored);
  localStorage.setItem(key, "broken");
  await assert.rejects(dashboardService.getSnapshot());
  assert.equal(localStorage.getItem(key), "broken");
});
test("failed task writes leave persisted completion intact", async () => {
  const original = await dashboardService.getSnapshot();
  const stored = localStorage.getItem(key);
  localStorage.setItem = () => {
    throw new Error("Quota");
  };
  await assert.rejects(
    dashboardService.toggleTask(original.tasks[0].id),
    /No se pudo guardar/,
  );
  assert.equal(localStorage.getItem(key), stored);
});
