import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { PreferencesProvider } from '../auth/PreferencesContext';

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <PreferencesProvider>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <header className="topbar">
        <span className="brand">⏱ BeAware</span>
        <nav aria-label="Principal">
          <NavLink to="/" end>
            Mi día
          </NavLink>
          <NavLink to="/ajustes">Ajustes</NavLink>
        </nav>
        <div className="who">
          <span>{user.nombre}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Salir
          </button>
        </div>
      </header>
      <main id="contenido" className="container">
        <Outlet />
      </main>
    </PreferencesProvider>
  );
}
