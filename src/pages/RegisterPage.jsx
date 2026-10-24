import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Alert from '../components/Alert';
import FormField from '../components/FormField';
import { useForm } from '../hooks/useForm';
import { validateEmail, validateLimit, validateName, validatePassword } from '../lib/validation';

export default function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();
  const form = useForm({
    initialValues: { nombre: '', correo: '', contrasena: '', limite_diario: '120' },
    schema: {
      nombre: validateName,
      correo: validateEmail,
      contrasena: validatePassword,
      limite_diario: validateLimit,
    },
    onSubmit: async (values) => {
      await register({
        ...values,
        nombre: values.nombre.trim(),
        correo: values.correo.trim(),
        limite_diario: Number(values.limite_diario),
      });
      navigate('/');
    },
  });
  if (isAuthenticated) return <Navigate to="/" replace />;
  const { values, errors, handleChange } = form;

  return (
    <main className="auth-card">
      <h1>Crea tu cuenta</h1>
      <p className="lead">Define cuánto tiempo quieres usar tus pantallas cada día.</p>
      <Alert>{form.formError}</Alert>
      <form onSubmit={form.handleSubmit} noValidate>
        <FormField
          id="nombre"
          label="Nombre"
          autoComplete="name"
          value={values.nombre}
          onChange={handleChange}
          error={errors.nombre}
        />
        <FormField
          id="correo"
          label="Correo"
          type="email"
          autoComplete="email"
          value={values.correo}
          onChange={handleChange}
          error={errors.correo}
        />
        <FormField
          id="contrasena"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          hint="Mínimo 6 caracteres"
          value={values.contrasena}
          onChange={handleChange}
          error={errors.contrasena}
        />
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
        <button type="submit" className="btn btn-primary" disabled={form.submitting}>
          {form.submitting ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="switch">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </main>
  );
}
