import React from "react";
import logo from "../../assets/Logo.png";
import { LogOut } from "lucide-react";

export const Header = ({ onLogout, user }) => (
  <header className="relative w-full bg-white shadow-sm border-b border-gray-200 py-4">
    {/* Botón logout (flotando a la derecha) */}
    {user && (
      <button
        onClick={onLogout}
        className="absolute right-6 top-6 flex items-center space-x-2 bg-blue-500 hover:bg-blue-900 text-white font-semibold px-4 py-2 rounded-md shadow transition duration-150"
      >
        <LogOut size={18} />
        <span>Salir</span>
      </button>
    )}

    {/* Contenido centrado */}
    <div className="flex flex-col items-center text-center">
      <img
        src={logo}
        alt="Sanate - Agua Alcalina Ionizada"
        style={{ height: 130, width: "auto" }}
      />
    </div>
  </header>
);
