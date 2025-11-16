import React, { useState } from 'react';
import { Local } from './hooks/Local';
import { generarId } from './utils/generarId';


//try de login
import { Login } from './components/auth/Login';

// Componentes comunes
import { Header } from './components/compComunes/Header';
import { Navegacion } from './components/compComunes/Navegacion';
import { PopUp } from './components/compComunes/PopUp';

// Componentes de módulos
import { Dashboard } from './components/Dashboard/Dashboard';
import { TablaMateriaPrima } from './components/materiaPrima/TablaMateriaPrima';
import { MateriaPrima } from './components/materiaPrima/MateriaPrima';
import { TablaProductoTerminado } from './components/productoTerminado/TablaProductoTerminado';
import { ProductoTerminado } from './components/productoTerminado/productoTerminado';

function App() {
  // Estado de autenticación
  const [user, setUser] = useState(null);

  // Estados principales
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [materiaPrima, setMateriaPrima] = Local('rawMaterials', []);
  const [productoTerminado, setProductoTerminado] = Local('products', []);
  
  // PopUp estados
  const [isPopUpOpen, setIsPopUpOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [popUpType, setPopUpType] = useState('');

  
  // Funciones para la materia prima
  const anadirMateriaPrima = (materia) => {
    const nuevaMateria = { 
      ...materia, 
      id: generarId(), 
      createdAt: new Date().toISOString() 
    };
    setMateriaPrima([...materiaPrima, nuevaMateria]);
    setIsPopUpOpen(false);
  };

  const actualizarMateriaPrima = (materia) => {
    setMateriaPrima(materiaPrima.map(m => m.id === materia.id ? materia : m));
    setIsPopUpOpen(false);
    setEditingProduct(null);
  };

  const eliminarMateriaPrima = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta materia prima?')) {
      setMateriaPrima(materiaPrima.filter(m => m.id !== id));
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

  // Funciones de los productos terminados
  const anadirProductoTerminado = (producto) => {
    const nuevoProducto = { 
      ...producto, 
      id: generarId(), 
      createdAt: new Date().toISOString() 
    };
    setProductoTerminado([...productoTerminado, nuevoProducto]);
    setIsPopUpOpen(false);
  };

  const actualizarProductoTerminado = (producto) => {
    setProductoTerminado(productoTerminado.map(p => p.id === producto.id ? producto : p));
    setIsPopUpOpen(false);
    setEditingProduct(null);
  };

  const eliminarProductoTerminado = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      setProductoTerminado(productoTerminado.filter(p => p.id !== id));
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

  // Se cierra el popup
  const handleCerrarPopUp = () => {
    setIsPopUpOpen(false);
    setEditingProduct(null);
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // Render para que agarre todo en la página
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Header user={user} onLogout={() => setUser(null)} />
      
      <Navegacion activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="w-full py-8">
        {/* Dashboard */}
        {activeTab === 'Dashboard' && (
          <Dashboard materiaPrima={materiaPrima} productoTerminado={productoTerminado} />
        )}

        {/* Materias Primas */}
        {activeTab === 'Materia Prima' && (
          <TablaMateriaPrima
            materia={materiaPrima}
            onAdd={handleNuevaMateriaPrima}
            onEdit={handleEditarMateriaPrima}
            onDelete={eliminarMateriaPrima}
          />
        )}

        {/* Productos */}
        {activeTab === 'Producto Terminado' && (
          <TablaProductoTerminado
            producto={productoTerminado}
            onAdd={handleNuevoProductoTerminado}
            onEdit={handleEditarProductoTerminado}
            onDelete={eliminarProductoTerminado}
          />
        )}

        {/* Reportes */}
        {activeTab === 'Reportes' && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Falta implementar, con lo que nos de luis</p>
          </div>
        )}
      </main>

      {/* Modal */}
      <PopUp
        isOpen={isPopUpOpen}
        onClose={handleCerrarPopUp}
        title={
          popUpType === 'MateriaPrima'
            ? editingProduct ? 'Editar Materia Prima' : 'Nueva Materia Prima'
            : editingProduct ? 'Editar Producto' : 'Nuevo Producto'
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
            onSave={editingProduct ? actualizarProductoTerminado : anadirProductoTerminado}
            onCancel={handleCerrarPopUp}
          />
        )}
      </PopUp>
    </div>
  );
}

export default App;