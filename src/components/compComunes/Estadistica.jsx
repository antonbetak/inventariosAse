import React from "react";

export const Estadistica = ({icon: Icon, title, value, color}) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 hover:shadow-xl transition-shadow duration-300" style={{borderLeftColor: color}}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-gray-500 text-sm mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
      <div className="p-3 rounded-full ml-4" style={{backgroundColor: `${color}15`}}>
        <Icon size={44} color={color} strokeWidth={2} />
      </div>
    </div>
  </div>
);