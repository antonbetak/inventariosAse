import { memo, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Plus,
  Trash2,
  Clock3,
} from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { SectionHeader } from "../ui/PageHeader";
import { dashboardService } from "../../services/dashboardService";
import { STORAGE_KEYS } from "../../services/storage";
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;

export const DashboardPlanner = memo(function DashboardPlanner() {
  const [today] = useState(() => new Date());
  const [month, setMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selected, setSelected] = useState(() => dateKey(today));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Media");
  useEffect(() => {
    let active = true;
    const refresh = () =>
      dashboardService
        .getSnapshot()
        .then((value) => {
          if (active) {
            setData(value);
            setError("");
          }
        })
        .catch((err) => {
          if (active) setError(err.message);
        });
    refresh();
    const onStorage = (event) => {
      if (event.key === STORAGE_KEYS.dashboard || event.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  async function mutate(action) {
    setBusy(true);
    setError("");
    try {
      setData(await action());
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function navigate(offset) {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setSelected(dateKey(next));
  }
  const first = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const events = useMemo(
    () =>
      (data?.events || [])
        .filter((e) => e.date === selected)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [data?.events, selected],
  );
  const calendarDays = useMemo(() => {
    const counts = new Map();
    for (const event of data?.events || [])
      counts.set(event.date, (counts.get(event.date) || 0) + 1);
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
      const key = dateKey(date);
      const count = counts.get(key) || 0;
      return {
        day: i + 1,
        key,
        count,
        label: `${date.toLocaleDateString("es-MX", { dateStyle: "full" })}${count ? `, ${count} recordatorios` : ""}`,
      };
    });
  }, [month, days, data?.events]);
  const tasks = data?.tasks || [];
  const completed = tasks.filter((t) => t.completed).length;
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;
  return (
    <div className="daily-workspace">
      {error && (
        <p role="alert" className="error-message planner-error">
          {error}
        </p>
      )}
      <GlassCard className="calendar-widget">
        <SectionHeader
          title="Tu agenda operativa"
          description="Recordatorios y próximos compromisos"
        >
          <CalendarDays size={20} />
        </SectionHeader>
        <div className="calendar-toolbar">
          <strong aria-live="polite">
            {month.toLocaleDateString("es-MX", {
              month: "long",
              year: "numeric",
            })}
          </strong>
          <div>
            <button
              className="calendar-today"
              onClick={() => {
                setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelected(dateKey(today));
              }}
            >
              Hoy
            </button>
            <button
              className="icon-button"
              aria-label="Mes anterior"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Mes siguiente"
              onClick={() => navigate(1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div
          className="calendar-grid"
          role="group"
          aria-label="Calendario mensual"
        >
          {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((d) => (
            <span className="weekday" key={d}>
              {d}
            </span>
          ))}
          {Array.from({ length: first }, (_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {calendarDays.map(({ day, key, count, label }) => {
            return (
              <button
                key={key}
                className={`calendar-day ${key === dateKey(today) ? "is-today" : ""} ${selected === key ? "is-selected" : ""}`}
                aria-current={key === dateKey(today) ? "date" : undefined}
                aria-pressed={selected === key}
                aria-label={label}
                onClick={() => setSelected(key)}
              >
                {day}
                {count > 0 && <i />}
              </button>
            );
          })}
        </div>
        <div className="daily-agenda" aria-live="polite">
          <h3>
            <Clock3 size={14} />{" "}
            {new Date(`${selected}T12:00:00`).toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </h3>
          {!data && !error && <p>Cargando agenda…</p>}
          {data && !events.length && (
            <p>Sin recordatorios para este día. Un espacio para planear.</p>
          )}
          {events.map((e) => (
            <div className="agenda-event" key={e.id}>
              <time>{e.time}</time>
              <div>
                <strong>{e.title}</strong>
                <small>{e.category}</small>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
      <GlassCard className="todo-widget">
        <SectionHeader
          title="Tus pendientes"
          description="Prioriza lo que sigue en tu operación"
        >
          <ListChecks size={20} />
        </SectionHeader>
        <div className="task-progress">
          <span>
            {completed} de {tasks.length} completadas
          </span>
          <strong>{progress}%</strong>
        </div>
        <progress value={progress} max="100" aria-label="Progreso de tareas" />
        {!data && !error && <p className="muted">Cargando tareas…</p>}
        {data && !tasks.length && (
          <p className="muted">Todo despejado. Agrega tu siguiente tarea.</p>
        )}
        <div className="todo-list">
          {tasks.map((task) => (
            <div
              className={`todo-row ${task.completed ? "is-complete" : ""}`}
              key={task.id}
            >
              <label>
                <input
                  type="checkbox"
                  checked={task.completed}
                  disabled={busy}
                  onChange={() =>
                    mutate(() => dashboardService.toggleTask(task.id))
                  }
                />
                <span>{task.title}</span>
              </label>
              <span
                className={`task-priority priority-${task.priority.toLowerCase()}`}
              >
                {task.priority}
              </span>
              <button
                className="task-delete"
                aria-label={`Eliminar tarea: ${task.title}`}
                disabled={busy}
                onClick={() =>
                  mutate(() => dashboardService.deleteTask(task.id))
                }
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <form
          className="task-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await mutate(() => dashboardService.addTask(title, priority)))
              setTitle("");
          }}
        >
          <input
            aria-label="Nueva tarea"
            placeholder="¿Qué sigue en tu operación?"
            value={title}
            maxLength={120}
            required
            disabled={!data || busy}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            aria-label="Prioridad de nueva tarea"
            value={priority}
            disabled={!data || busy}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option>Alta</option>
            <option>Media</option>
            <option>Baja</option>
          </select>
          <button
            className="button button-primary"
            aria-label="Agregar tarea"
            disabled={!data || busy}
          >
            <Plus size={18} />
          </button>
        </form>
        <div className="planner-note">
          Un pendiente menos. Una operación más clara.
        </div>
      </GlassCard>
    </div>
  );
});
