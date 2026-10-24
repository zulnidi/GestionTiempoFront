import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { usePreferences } from '../auth/PreferencesContext';
import Alert from '../components/Alert';
import FormField from '../components/FormField';
import { useForm } from '../hooks/useForm';
import { validateLimit } from '../lib/validation';

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' },
];

/** Espera a que carguen las preferencias para que el formulario nazca con los valores reales. */
export default function SettingsPage() {
  const { loaded } = usePreferences();
  if (!loaded) return <p className="loading">Cargando ajustes…</p>;
  return <SettingsEditor />;
}

function SettingsEditor() {
  const { user, services, updateUser } = useAuth();
  const { preferences, save } = usePreferences();
  const [saved, setSaved] = useState(false);

  const form = useForm({
    initialValues: {
      limite_diario: String(user.limite_diario),
      modo_oscuro: preferences.modo_oscuro,
      idioma: preferences.idioma,
      notificaciones: preferences.notificaciones,
    },
    schema: { limite_diario: validateLimit },
    onSubmit: async (values) => {
      setSaved(false);
      if (Number(values.limite_diario) !== user.limite_diario) {
        updateUser(
          await services.users.update(user.id_usuario, {
            limite_diario: Number(values.limite_diario),
          }),
        );
      }
      await save(values);
      setSaved(true);
    },
  });

  return <SettingsForm form={form} saved={saved} />;
}

function SettingsForm({ form, saved }) {
  const { values, errors, handleChange } = form;
  return (
    <div>
      <h1>Ajustes</h1>
      <form className="card" onSubmit={form.handleSubmit} noValidate>
        <Alert>{form.formError}</Alert>
        <Alert tone="success">{saved ? 'Ajustes guardados' : ''}</Alert>
        <FormField
          id="limite_diario"
          label="Límite diario (minutos)"
          type="number"
          inputMode="numeric"
          min="1"
          max="1440"
          value={values.limite_diario}
          onChange={handleChange}
          error={errors.limite_diario}
        />
        <div className="field">
          <label htmlFor="idioma">Idioma</label>
          <select id="idioma" name="idioma" value={values.idioma} onChange={handleChange}>
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <label className="check">
          <input
            type="checkbox"
            name="modo_oscuro"
            checked={values.modo_oscuro}
            onChange={handleChange}
          />
          Modo oscuro
        </label>
        <label className="check">
          <input
            type="checkbox"
            name="notificaciones"
            checked={values.notificaciones}
            onChange={handleChange}
          />
          Recibir notificaciones
        </label>
        <button type="submit" className="btn btn-primary" disabled={form.submitting}>
          {form.submitting ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </div>
  );
}
