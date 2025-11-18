import React, { useState } from "react";
import logo from "../../assets/Logo.png";
import logo1 from '../../assets/BackgroundLogin.png';

export const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Credenciales temporales
    if (username === "A" && password === "A") {
      onLogin({ username });
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat bg-black/50" style={{ backgroundImage: `url(${logo1})` }}>
        
         
     
      <div className="bg-white p-8 rounded-2xl shadow-lg w-80">
        <img
                src={logo}
                alt="Sanate - Agua Alcalina Ionizada"
                style={{ height: 100, width: "auto" }}
              />
        <h2 className=" font-bold text-center mb-6 text-shadow-gray-700">
          Iniciar Sesión
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa tu usuario"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="•••••••"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full  bg-blue-500 hover:bg-blue-900 text-white py-2 rounded-md font-semibold transition"
          >
            Acceder
          </button>
        </form>
      </div>
    </div>
  );
};
