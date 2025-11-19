// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Local } from './hooks/Local';
import { generarId } from './utils/generarId';

// Firebase Auth
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './utils/firebase';

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
import { Reportes } from './components/Reportes/Reportes';

function App() {
  // Estado de autenticación
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true); // para saber si ya checamos Firebase

  // Pestaña activa: la cargamos de localStorage para “recordar” dónde estabas
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem('activeTab') || 'Dashboard'
  );

  // Estados principales
  const [materiaPrima, setMateriaPrima] = Local('rawMaterials', []);
  const [productoTerminado, setProductoTerminado] = Local('products', []);

  // Popup
  const [isPopUpOpen, setIsPopUpOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [popUpType, setPopUpType] = useState('');

  // ============================
  // 🔐 Escuchar la sesión de Firebase
  // ============================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Si hay usuario en Firebase, lo guardamos en el estado
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          nombre: 'Administrador',
        });
      } else {
        setUser(null);
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // ============================
  // 💾 Guardar la pestaña activa en localStorage
  // ============================
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // ============================
  // 🔓 Logout (cerrar sesión)
  // ============================
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    }
    setUser(null);
    setActiveTab('Dashboard');
  };

  // ============================
  // Materia prima (estado local)
  // ============================
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

  // ============================
  // Producto terminado (estado local)
  // ============================
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

  // ============================
  // Render
  // ============================

  // Mientras revisamos con Firebase si hay sesión activa
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  // Si no hay usuario logueado, mostramos login
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // Si hay usuario, mostramos la app
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Header user={user} onLogout={handleLogout} />

      <Navegacion activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="w-full py-8">
        {activeTab === 'Dashboard' && (
          <Dashboard
            materiaPrima={materiaPrima}
            productoTerminado={productoTerminado}
          />
        )}

        {activeTab === 'Materia Prima' && (
          <TablaMateriaPrima
            onAdd={handleNuevaMateriaPrima}
            onEdit={handleEditarMateriaPrima}
            onDelete={eliminarMateriaPrima}
          />
        )}

        {activeTab === 'Producto Terminado' && (
          <TablaProductoTerminado
            onAdd={handleNuevoProductoTerminado}
            onEdit={handleEditarProductoTerminado}
            onDelete={eliminarProductoTerminado}
          />
        )}

        {activeTab === 'Reportes' && <Reportes />}
      </main>

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
