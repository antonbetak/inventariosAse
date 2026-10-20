import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { authService } from "./services/authService";
import { inventoryService } from "./services/inventoryService";
import { STORAGE_KEYS } from "./services/storage";
import { useInventory } from "./hooks/useInventory";
import { Login } from "./components/auth/Login";
import { AppShell } from "./components/layout/AppShell";
import { GlassButton } from "./components/ui/GlassButton";
import { LoadingState, ErrorState } from "./components/ui/EmptyState";
import { PopUp } from "./components/compComunes/PopUp";
const loadDashboard = () => import("./components/Dashboard/Dashboard");
const Dashboard = lazy(() =>
  loadDashboard().then((module) => ({ default: module.Dashboard })),
);
import { TablaMateriaPrima } from "./components/materiaPrima/TablaMateriaPrima";
import { MateriaPrima } from "./components/materiaPrima/MateriaPrima";
import { TablaProductoTerminado } from "./components/productoTerminado/TablaProductoTerminado";
import { ProductoTerminado } from "./components/productoTerminado/productoTerminado";
const loadReports = () => import("./components/Reportes/Reportes");
const Reportes = lazy(() =>
  loadReports().then((module) => ({ default: module.Reportes })),
);
import { Operations } from "./components/Operations";
const tabs = ["Dashboard", "Materia Prima", "Producto Terminado", "Operaciones", "Reportes"];
function App() {
  const [user, setUser] = useState(null),
    [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const tab = localStorage.getItem(STORAGE_KEYS.navigation);
      return tabs.includes(tab) ? tab : "Dashboard";
    } catch {
      return "Dashboard";
    }
  });
  const [modal, setModal] = useState(null),
    [deleteRequest, setDeleteRequest] = useState(null),
    [notice, setNotice] = useState(""),
    [deleting, setDeleting] = useState(false),
    [deleteError, setDeleteError] = useState("");
  const { data, reports, loading, error, refresh } = useInventory(!!user);
  useEffect(() => authService.onSessionExpired(() => {
    setUser(null);
    setModal(null);
    setDeleteRequest(null);
    setNotice("");
  }), []);
  useEffect(() => {
    let active = true;
    authService
      .getSession()
      .then((session) => {
        if (active) setUser(session);
      })
      .catch(() => { if (active) setUser(null); })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.navigation, activeTab);
    } catch {
      /* Navigation remains usable without persistence. */
    }
  }, [activeTab]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!user) return;
    const warm = () => {
      void loadDashboard().catch(() => {});
      void loadReports().catch(() => {});
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(warm, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(warm, 1500);
    return () => window.clearTimeout(id);
  }, [user]);
  const openEntry = useCallback(() => setModal({ type: "entry" }), []);
  const closeModal = useCallback(() => setModal(null), []);
  const saved = () => {
    setModal(null);
    setNotice("Registro guardado. Inventario actualizado.");
  };
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setModal(null);
      setDeleteRequest(null);
      setActiveTab("Dashboard");
    } catch (e) {
      setNotice(e.message);
    }
  };
  const requestDelete = (type, item) => {
    setDeleteError("");
    setDeleteRequest({ type, item });
  };
  const remove = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      if (deleteRequest.type === "raw")
        await inventoryService.deleteRawMaterial(deleteRequest.item.id);
      else await inventoryService.deleteFinishedProduct(deleteRequest.item.id);
      setDeleteRequest(null);
      setNotice("Registro eliminado del inventario.");
    } catch (e) {
      setDeleteError(e.message);
    } finally {
      setDeleting(false);
    }
  };
  if (checking)
    return (
      <div className="auth-loading">
        <LoadingState label="Preparando tu espacio de trabajo…" />
      </div>
    );
  if (!user) return <Login onLogin={setUser} />;
  return (
    <AppShell
      user={user}
      onLogout={logout}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {(data?.rawMaterials.some(i=>i.costo_pendiente) || data?.finishedProducts.some(p=>p.stock_pendiente)) && <div className="form-info" role="status">Valuación parcial: hay costos, unidades o existencias por confirmar. Un importe de $0 no significa que todos los inventarios estén vacíos. Revisa las advertencias de cada registro.</div>}
      <Suspense fallback={<LoadingState />}>
        <div className="page-view" key={activeTab}>
          {loading ? (
            <LoadingState />
          ) : error ? (
            <>
              <ErrorState message={error} />
              <GlassButton onClick={refresh} variant="secondary">
                Reintentar
              </GlassButton>
            </>
          ) : (
            <>
              {activeTab === "Dashboard" && (
                <Dashboard
                  materiaPrima={data.rawMaterials}
                  productoTerminado={data.finishedProducts}
                  reports={reports}
                  onNavigate={setActiveTab}
                  onAdd={openEntry}
                />
              )}
              {activeTab === "Materia Prima" && (
                <TablaMateriaPrima
                  materia={data.rawMaterials}
                  onAdd={() => setModal({ type: "raw" })}
                  onEntry={() => setModal({ type: "entry" })}
                  onEdit={(item) => setModal({ type: "raw", item })}
                  onDelete={(item) => requestDelete("raw", item)}
                />
              )}
              {activeTab === "Producto Terminado" && (
                <TablaProductoTerminado
                  salidas={data.finishedProducts}
                  onAdd={() => setModal({ type: "product" })}
                  onEdit={(item) => setModal({ type: "product", item })}
                  onDelete={(item) => requestDelete("product", item)}
                />
              )}
              {activeTab === "Operaciones" && <Operations snapshot={data} onSaved={refresh} />}
              {activeTab === "Reportes" && (
                <Reportes reports={reports} snapshot={data} />
              )}
            </>
          )}
        </div>
      </Suspense>
      <PopUp
        isOpen={!!modal}
        onClose={closeModal}
        title={
          modal?.type === "entry"
            ? "Registrar entrada de materia prima"
            : modal?.type === "raw"
              ? modal.item
                ? "Editar materia prima"
                : "Nueva materia prima"
              : modal?.item
                ? "Editar producto"
                : "Registrar producto"
        }
      >
        {modal &&
          (modal.type === "product" ? (
            <ProductoTerminado
              producto={modal.item}
              rawMaterials={data?.rawMaterials ?? []}
              onSaved={saved}
              onCancel={closeModal}
            />
          ) : (
            <MateriaPrima
              materia={modal.item}
              mode={modal.type === "entry" ? "entry" : "record"}
              rawMaterials={data?.rawMaterials ?? []}
              onSaved={saved}
              onCancel={closeModal}
            />
          ))}
      </PopUp>
      <PopUp
        isOpen={!!deleteRequest}
        onClose={() => {
          if (!deleting) setDeleteRequest(null);
        }}
        title="¿Eliminar este registro?"
      >
        <p className="muted">
          Se eliminará <strong>{deleteRequest?.item.nombre}</strong> del
          inventario. El historial de movimientos se conserva. Esta acción no se
          puede deshacer.
        </p>
        {deleteError && <ErrorState message={deleteError} />}
        <div className="confirm-actions">
          <GlassButton
            disabled={deleting}
            variant="secondary"
            onClick={() => setDeleteRequest(null)}
          >
            Cancelar
          </GlassButton>
          <GlassButton disabled={deleting} variant="danger" onClick={remove}>
            {deleting ? "Eliminando…" : "Eliminar registro"}
          </GlassButton>
        </div>
      </PopUp>
      {notice && (
        <div className="save-notice glass" role="status">
          <span className="status-dot" />
          {notice}
        </div>
      )}
    </AppShell>
  );
}
export default App;
