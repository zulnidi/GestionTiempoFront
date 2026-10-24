import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Layout from './Layout';

/** Muestra el layout si hay sesión; si no, redirige al login. */
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Layout /> : <Navigate to="/login" replace />;
}
