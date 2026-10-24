import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const DEFAULTS = { id_config: null, modo_oscuro: false, idioma: 'es', notificaciones: true };
const PreferencesContext = createContext(null);

/** Carga las preferencias del usuario, aplica el tema y permite guardarlas. */
export function PreferencesProvider({ children }) {
  const { user, services } = useAuth();
  const [preferences, setPreferences] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    services.settings
      .get(user.id_usuario)
      .then((cfg) => !cancelled && setPreferences(cfg))
      .catch(() => {}) // 404: aún no hay configuración; se usan los valores por defecto
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [services, user.id_usuario]);

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.modo_oscuro ? 'dark' : 'light';
  }, [preferences.modo_oscuro]);

  const save = useCallback(
    async ({ modo_oscuro, idioma, notificaciones }) => {
      const data = { modo_oscuro, idioma, notificaciones };
      const saved = preferences.id_config
        ? await services.settings.update(preferences.id_config, data)
        : await services.settings.create(data);
      setPreferences(saved);
      return saved;
    },
    [preferences.id_config, services],
  );

  const value = useMemo(() => ({ preferences, loaded, save }), [preferences, loaded, save]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences debe usarse dentro de PreferencesProvider');
  return ctx;
}
