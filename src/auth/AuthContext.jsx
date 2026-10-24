import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createClient } from '../api/client';
import { createServices } from '../api/services';

const STORAGE_KEY = 'beaware.session';
const AuthContext = createContext(null);

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(session) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* almacenamiento no disponible: la sesión vive solo en memoria */
  }
}

/**
 * Sesión y servicios de API. El token se guarda en localStorage (simple y suficiente
 * para este proyecto; en producción convendría una cookie httpOnly).
 * `fetchImpl` permite inyectar un fetch falso en las pruebas.
 */
export function AuthProvider({ children, fetchImpl }) {
  const [session, setSession] = useState(readSession);
  const tokenRef = useRef(session?.token ?? null);

  const logout = useCallback(() => {
    tokenRef.current = null;
    writeSession(null);
    setSession(null);
  }, []);

  const services = useMemo(
    () =>
      createServices(
        createClient({ getToken: () => tokenRef.current, onUnauthorized: logout, fetchImpl }),
      ),
    [logout, fetchImpl],
  );

  const start = useCallback((token, usuario) => {
    tokenRef.current = token;
    const next = { token, usuario };
    writeSession(next);
    setSession(next);
  }, []);

  const login = useCallback(
    async (correo, contrasena) => {
      const { token, usuario } = await services.auth.login(correo, contrasena);
      start(token, usuario);
    },
    [services, start],
  );

  const register = useCallback(
    async ({ nombre, correo, contrasena, limite_diario }) => {
      await services.auth.register({ nombre, correo, contrasena, limite_diario });
      await login(correo, contrasena);
    },
    [services, login],
  );

  const updateUser = useCallback((usuario) => {
    setSession((s) => {
      const next = { ...s, usuario };
      writeSession(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user: session?.usuario ?? null,
      isAuthenticated: Boolean(session),
      services,
      login,
      register,
      logout,
      updateUser,
    }),
    [session, services, login, register, logout, updateUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
