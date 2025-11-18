import React from "react";
import {TrendingUp, Package, ShoppingCart, FileText} from 'lucide-react';

const tabs = [
    {id: 'Dashboard', label: 'Dashboard', icon: TrendingUp},
    {id: 'Materia Prima', label: 'Entradas', icon: Package},
    {id: 'Producto Terminado', label: 'Salidas', icon: ShoppingCart},
    {id: 'Reportes', label: 'Reportes', icon: FileText}
];

export const Navegacion = ({ activeTab, onTabChange }) => (
  <div className="w-full bg-gray-50 py-6">
    <div className="flex justify-center gap-6">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`flex flex-col items-center justify-center gap-2 w-28 h-28 p-4 font-medium text-center transition-all ${
            activeTab === id
              ? 'border-b-4 border-blue-900 text-blue-950 bg-blue-50 rounded-t-3xl shadow-md'
              : 'border-b-2 border-transparent text-gray-600 hover:text-blue-900 hover:bg-gray-100 rounded-t-3xl'
          }`}
        >
          <Icon size={25} />
          {label}
        </button>
      ))}
    </div>
  </div>
);