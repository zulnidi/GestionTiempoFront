import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../auth/AuthContext';

export function renderApp(route, fetchImpl) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider fetchImpl={fetchImpl}>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

export function loginSession(usuario) {
  const { contrasena: _c, ...safe } = usuario;
  localStorage.setItem('beaware.session', JSON.stringify({ token: 'tok', usuario: safe }));
}
