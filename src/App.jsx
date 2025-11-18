import React, { useState } from 'react';
import { Local } from './hooks/Local';
import { generarId } from './utils/generarId';

// Auth
import { Login } from './components/auth/Login';

// Componentes comunes
import { Header } from './components/compComunes/Header';
import { Navegacion } from './components/compComunes/Navegacion';
import { PopUp } from './components/compComunes/PopUp';

// Módulos
import { Dashboard } from './components/Dashboard/Dashboard';
import { TablaMateriaPrima } from './components/materiaPrima/TablaMateriaPrima';
import { MateriaPrima } from './components/materiaPrima/MateriaPrima';
import { TablaProductoTerminado } from './components/productoTerminado/TablaProductoTerminado';
import { ProductoTerminado } from './components/productoTerminado/productoTerminado';
import { Reportes } from './components/Reportes/Reportes';   // 👈 ojo con esta ruta

function App() {
  // Estado de autenticación
  const [user, setUser] = useState(null);

  // Estados principales (todavía usados por Dashboard y popup)
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [materiaPrima, setMateriaPrima] = Local('rawMaterials', []);
  const [productoTerminado, setProductoTerminado] = Local('products', []);

  // Popup
  const [isPopUpOpen, setIsPopUpOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [popUpType, setPopUpType] = useState('');

  // ---- Materia prima (estado local) ----
  const anadirMateriaPrima = (materia) => {
    const nuevaMateria = {
      ...materia,
      id: generarId(),
      createdAt: new Date().toISOString(),
    };
    setMateriaPrima([...materiaPrima, nuevaMateria]);
    setIsPopUpOpen(false);
  };

  const actualizarMateriaPrima = (materia) => {
    setMateriaPrima(
      materiaPrima.map((m) => (m.id === materia.id ? materia : m))
    );
    setIsPopUpOpen(false);
    setEditingProduct(null);
  };

  const eliminarMateriaPrima = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta materia prima?')) {
      setMateriaPrima(materiaPrima.filter((m) => m.id !== id));
    }
  };

  const handleNuevaMateriaPrima = () => {
    setPopUpType('MateriaPrima');
    setEditingProduct(null);
    setIsPopUpOpen(true);
  };

  const handleEditarMateriaPrima = (materia) => {
    setEditingProduct(materia);
    setPopUpType('MateriaPrima');
    setIsPopUpOpen(true);
  };

  // ---- Producto terminado (estado local) ----
  const anadirProductoTerminado = (producto) => {
    const nuevoProducto = {
      ...producto,
      id: generarId(),
      createdAt: new Date().toISOString(),
    };
    setProductoTerminado([...productoTerminado, nuevoProducto]);
    setIsPopUpOpen(false);
  };

  const actualizarProductoTerminado = (producto) => {
    setProductoTerminado(
      productoTerminado.map((p) => (p.id === producto.id ? producto : p))
    );
    setIsPopUpOpen(false);
    setEditingProduct(null);
  };

  const eliminarProductoTerminado = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      setProductoTerminado(productoTerminado.filter((p) => p.id !== id));
    }
  };

  const handleNuevoProductoTerminado = () => {
    setPopUpType('ProductoTerminado');
    setEditingProduct(null);
    setIsPopUpOpen(true);
  };

  const handleEditarProductoTerminado = (producto) => {
    setEditingProduct(producto);
    setPopUpType('ProductoTerminado');
    setIsPopUpOpen(true);
  };

  const handleCerrarPopUp = () => {
    setIsPopUpOpen(false);
    setEditingProduct(null);
  };

  // Si no hay usuario logueado, mostramos login
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Header user={user} onLogout={() => setUser(null)} />

      <Navegacion activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="w-full py-8">
        {/* Dashboard */}
        {activeTab === 'Dashboard' && (
          <Dashboard
            materiaPrima={materiaPrima}
            productoTerminado={productoTerminado}
          />
        )}

        {/* Entradas / Materia prima */}
        {activeTab === 'Materia Prima' && (
          <TablaMateriaPrima
            onAdd={handleNuevaMateriaPrima}
            onEdit={handleEditarMateriaPrima}
            onDelete={eliminarMateriaPrima}
          />
        )}

        {/* Salidas / Producto terminado */}
        {activeTab === 'Producto Terminado' && (
          <TablaProductoTerminado
            onAdd={handleNuevoProductoTerminado}
            onEdit={handleEditarProductoTerminado}
            onDelete={eliminarProductoTerminado}
          />
        )}

        {/* Reportes */}
        {activeTab === 'Reportes' && <Reportes />}
      </main>

      {/* Modal */}
      <PopUp
        isOpen={isPopUpOpen}
        onClose={handleCerrarPopUp}
        title={
          popUpType === 'MateriaPrima'
            ? editingProduct
              ? 'Editar Materia Prima'
              : 'Nueva Entrada de Materia Prima'
            : editingProduct
            ? 'Editar Producto'
            : 'Registrar salida de producto terminado'
        }
      >
        {popUpType === 'MateriaPrima' ? (
          <MateriaPrima
            materia={editingProduct}
            onSave={editingProduct ? actualizarMateriaPrima : anadirMateriaPrima}
            onCancel={handleCerrarPopUp}
          />
        ) : (
          <ProductoTerminado
            producto={editingProduct}
            onSave={
              editingProduct
                ? actualizarProductoTerminado
                : anadirProductoTerminado
            }
            onCancel={handleCerrarPopUp}
          />
        )}
      </PopUp>
    </div>
  );
}

export default App;
