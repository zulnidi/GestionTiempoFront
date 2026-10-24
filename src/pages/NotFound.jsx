import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="auth-card">
      <h1>404</h1>
      <p className="lead">Esta página no existe.</p>
      <Link to="/" className="btn btn-primary">
        Volver al inicio
      </Link>
    </main>
  );
}
