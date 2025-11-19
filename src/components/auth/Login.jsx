import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../utils/firebase";   // 👈 IMPORTANTE
import logo from "../../assets/Logo.png";
import logo1 from "../../assets/BackgroundLogin.png";

export const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      onLogin({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        nombre: "Administrador",
      });

      setCargando(false);
    } catch (err) {
      console.error("Error de login:", err);
      setError("Correo o contraseña incorrectos");
      setCargando(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center px-4"
      style={{
        backgroundImage: `url(${logo1})`,
      }}
    >
      <div className="max-w-md w-full">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-gray-100">

          <div className="text-center mb-6">
            <img src={logo} alt="Sanate" className="h-28 w-auto mx-auto mb-4" />
            <p className="text-gray-600 text-sm">
              Ingresa para gestionar tu inventario Sanaté
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="eduardo@sanate.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Ingresando...
                </>
              ) : (
                <>Iniciar Sesión</>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              <strong>Credenciales de prueba:</strong><br />
              Email: eduardo@sanate.com<br />
              Contraseña: edu123
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
