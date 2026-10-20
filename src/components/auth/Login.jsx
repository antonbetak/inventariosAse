import React, { useEffect, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  Droplets,
  Boxes,
  ChartNoAxesCombined,
  ArrowUpRight,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { authService } from "../../services/authService";
import { Brand } from "../ui/Brand";

export const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const artRef = useRef(null);
  useEffect(() => {
    const art = artRef.current;
    if (!art) return;
    let visible = true;
    const sync = () =>
      art.classList.toggle("is-motion-paused", !visible || document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(art);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const session = await authService.login(
        formData.email,
        formData.password,
      );
      onLogin(session);
      setCargando(false);
    } catch (err) {
      console.error("Error de login:", err);
      setError(err.message);
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-branding">
        <Brand href="#login-form" />
        <div className="login-story">
          <span className="login-pill">
            <span className="status-dot" /> AGUA. CLARIDAD. EQUILIBRIO.
          </span>
          <h1>
            Pureza y control
            <br />
            en cada <em>operación.</em>
          </h1>
          <p>
            Del primer insumo a la última entrega.
            <br />
            Gestiona cada recurso con la claridad del agua.
          </p>
          <div className="login-art" ref={artRef} aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="water-ripple ripple-one" />
            <div className="water-ripple ripple-two" />
            <div className="art-core">
              <Droplets size={76} strokeWidth={1} />
            </div>
            <div className="art-label label-top">
              <Boxes size={19} />
              <span>
                Cada recurso cuenta<small>Inventario en equilibrio</small>
              </span>
            </div>
            <div className="art-label label-bottom">
              <ChartNoAxesCombined size={20} />
              <span>
                Un flujo más claro
                <small>Recursos · Producción · Distribución</small>
              </span>
              <ArrowUpRight size={17} />
            </div>
          </div>
        </div>
        <div className="login-brand-footer">
          <span>Sanaté Inventarios / 2.0</span>
          <span>Operación limpia. Decisiones claras.</span>
        </div>
      </section>
      <section className="login-form-side">
        <div className="login-mobile-brand">
          <Brand href="#login-form" />
        </div>
        <div className="login-card glass-card">
          <span className="icon-capsule">
            <LockKeyhole size={22} />
          </span>
          <p className="eyebrow">SANATÉ INVENTARIOS</p>
          <h2>Bienvenido a Sanaté</h2>
          <p className="muted">
            Tu operación fluye mejor cuando todo está claro.
          </p>
          <form id="login-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="login-email">Correo electrónico</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Tu correo registrado"
                  disabled={cargando}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="login-password">Contraseña</label>
              <div className="input-with-icon">
                <LockKeyhole size={18} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Tu contraseña"
                  disabled={cargando}
                />
                <button
                  type="button"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>
            {error && (
              <div role="alert" className="error-message">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={cargando}
              className="button button-primary login-submit"
            >
              {cargando ? (
                <>
                  <span className="spinner" />
                  Ingresando…
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowUpRight size={18} />
                </>
              )}
            </button>
          </form>
          <div className="login-secure">
            <ShieldCheck size={15} />
            Cada recurso, cada movimiento, bajo control.
          </div>
        </div>
        <p className="login-copyright">
          Sanaté Inventarios · Tu operación, en equilibrio.
        </p>
      </section>
    </div>
  );
};
