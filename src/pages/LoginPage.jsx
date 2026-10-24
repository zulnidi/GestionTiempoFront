import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Alert from '../components/Alert';
import FormField from '../components/FormField';
import { useForm } from '../hooks/useForm';
import { validateEmail, validatePassword } from '../lib/validation';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const form = useForm({
    initialValues: { correo: '', contrasena: '' },
    schema: { correo: validateEmail, contrasena: validatePassword },
    onSubmit: async ({ correo, contrasena }) => {
      await login(correo.trim(), contrasena);
      navigate('/');
    },
  });
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <main className="auth-card">
      <h1>⏱ BeAware</h1>
      <p className="lead">Inicia sesión para ver tu tiempo de hoy.</p>
      <Alert>{form.formError}</Alert>
      <form onSubmit={form.handleSubmit} noValidate>
        <FormField
          id="correo"
          label="Correo"
          type="email"
          autoComplete="email"
          value={form.values.correo}
          onChange={form.handleChange}
          error={form.errors.correo}
        />
        <FormField
          id="contrasena"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={form.values.contrasena}
          onChange={form.handleChange}
          error={form.errors.contrasena}
        />
        <button type="submit" className="btn btn-primary" disabled={form.submitting}>
          {form.submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p className="switch">
        ¿Aún no tienes cuenta? <Link to="/registro">Regístrate</Link>
      </p>
    </main>
  );
}
