import React from "react";
import logo from "../../assets/Logo.png";
import { LogOut } from "lucide-react";

export const Header = ({ onLogout, user }) => (
  <header className="w-full bg-white shadow-sm border-b border-gray-200 py-4 px-4">

    {/* Contenedor general */}
    <div className="flex flex-col items-center relative">

      {/* Botón salir - arriba a la derecha SOLO en pantallas md+ */}
      {user && (
        <button
          onClick={onLogout}
          className="
            hidden md:flex 
            absolute right-6 top-4 
            items-center space-x-2 
            bg-blue-500 hover:bg-blue-900 
            text-white font-semibold px-4 py-2 
            rounded-md shadow transition
          "
        >
          <LogOut size={18} />
          <span>Salir</span>
        </button>
      )}

      {/* Logo centrado SIEMPRE */}
      <img
        src={logo}
        alt="Sanate - Agua Alcalina Ionizada"
        className="h-28 object-contain mb-4"
      />

      {/* Botón salir visible en móvil (abajo, centrado o derecha) */}
      {user && (
        <button
          onClick={onLogout}
          className="
            flex md:hidden 
            self-end
            items-center space-x-2 
            bg-blue-500 hover:bg-blue-900 
            text-white font-semibold px-4 py-2 
            rounded-md shadow transition
          "
        >
          <LogOut size={18} />
          <span>Salir</span>
        </button>
      )}

    </div>
  </header>
);
