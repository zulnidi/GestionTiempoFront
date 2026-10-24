import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toISODate } from './lib/usage';
import { createFakeApi, usuario } from './test/fakeApi';
import { loginSession, renderApp } from './test/render';

const today = toISODate();
const stat = (extra = {}) => ({
  id_estadistica: 1,
  id_usuario: 1,
  fecha: today,
  tiempo_uso: 30,
  estado: 'DENTRO_DEL_LIMITE',
  ...extra,
});

describe('autenticación', () => {
  it('redirige al login si no hay sesión', async () => {
    renderApp('/', createFakeApi().fetchImpl);
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('valida el formulario de login', async () => {
    renderApp('/login', createFakeApi().fetchImpl);
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Ingresa un correo válido')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'true');
  });

  it('muestra el error de credenciales inválidas', async () => {
    renderApp('/login', createFakeApi({ users: [usuario()] }).fetchImpl);
    await userEvent.type(screen.getByLabelText('Correo'), 'ana@mail.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'incorrecta');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña inválidos');
  });

  it('inicia sesión y muestra el panel; luego cierra sesión', async () => {
    renderApp('/login', createFakeApi({ users: [usuario()] }).fetchImpl);
    await userEvent.type(screen.getByLabelText('Correo'), 'ana@mail.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreto1');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('heading', { name: /Hola, Ana/ })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('beaware.session')).token).toBe('tok');
    await userEvent.click(screen.getByRole('button', { name: 'Salir' }));
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(localStorage.getItem('beaware.session')).toBeNull();
  });

  it('registra una cuenta nueva y entra directamente', async () => {
    const api = createFakeApi();
    renderApp('/registro', api.fetchImpl);
    await userEvent.type(screen.getByLabelText('Nombre'), 'Luis Gómez');
    await userEvent.type(screen.getByLabelText('Correo'), 'luis@mail.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreto1');
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByRole('heading', { name: /Hola, Luis/ })).toBeInTheDocument();
    expect(api.state.calls.find((c) => c.path === '/usuarios/').data).toMatchObject({
      limite_diario: 120,
    });
  });

  it('valida el registro y muestra errores del servidor', async () => {
    renderApp('/registro', createFakeApi({ users: [usuario()] }).fetchImpl);
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(
      await screen.findByText('El nombre debe tener al menos 2 caracteres'),
    ).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Nombre'), 'Ana Pérez');
    await userEvent.type(screen.getByLabelText('Correo'), 'ana@mail.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreto1');
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El correo ya está registrado');
  });
});

describe('panel', () => {
  it('muestra el uso de hoy, el límite y el historial', async () => {
    loginSession(usuario());
    renderApp('/', createFakeApi({ stats: [stat()] }).fetchImpl);
    const hoy = await screen.findByRole('region', { name: 'Hoy' });
    expect(within(hoy).getByText('de 1 h')).toBeInTheDocument();
    expect(within(hoy).getByText(/^30 min/)).toBeInTheDocument();
    expect(within(hoy).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    expect(within(hoy).getByText(/te quedan 30 min/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Uso de los últimos 7 días/ })).toBeInTheDocument();
  });

  it('indica cuando se excede el límite', async () => {
    loginSession(usuario());
    renderApp(
      '/',
      createFakeApi({ stats: [stat({ tiempo_uso: 90, estado: 'EXCEDIDO' })] }).fetchImpl,
    );
    expect(await screen.findByText(/Límite excedido \(\+30 min\)/)).toBeInTheDocument();
  });

  it('registra los minutos de hoy cuando aún no hay registro', async () => {
    loginSession(usuario());
    const api = createFakeApi();
    renderApp('/', api.fetchImpl);
    expect(await screen.findByText(/Aún no tienes registros/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));
    expect(await screen.findByText('Ingresa los minutos de uso')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Registrar minutos de hoy'), '45');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));
    await waitFor(() => expect(api.state.stats).toHaveLength(1));
    expect(api.state.stats[0]).toMatchObject({ fecha: today, tiempo_uso: 45 });
    expect(await screen.findByRole('button', { name: 'Actualizar' })).toBeInTheDocument();
  });

  it('actualiza el registro de hoy si ya existe', async () => {
    loginSession(usuario());
    const api = createFakeApi({ stats: [stat()] });
    renderApp('/', api.fetchImpl);
    await userEvent.type(await screen.findByLabelText('Actualizar minutos de hoy'), '80');
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
    await waitFor(() => expect(api.state.stats[0].tiempo_uso).toBe(80));
    const hoy = await screen.findByRole('region', { name: 'Hoy' });
    expect(await within(hoy).findByText(/Límite excedido/)).toBeInTheDocument();
  });

  it('elimina un registro tras confirmar', async () => {
    loginSession(usuario());
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const api = createFakeApi({ stats: [stat()] });
    renderApp('/', api.fetchImpl);
    await userEvent.click(
      await screen.findByRole('button', { name: `Eliminar registro del ${today}` }),
    );
    await waitFor(() => expect(api.state.stats).toHaveLength(0));
    expect(await screen.findByText(/Aún no tienes registros/)).toBeInTheDocument();
  });

  it('muestra un error con reintento cuando falla la carga', async () => {
    loginSession(usuario());
    let fail = true;
    const api = createFakeApi({ stats: [stat()] });
    const fetchImpl = (url, init) =>
      fail && url.includes('estadisticas')
        ? Promise.reject(new TypeError('x'))
        : api.fetchImpl(url, init);
    renderApp('/', fetchImpl);
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar');
    fail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('region', { name: 'Hoy' })).toBeInTheDocument();
  });

  it('cierra la sesión si el token ya no es válido', async () => {
    loginSession(usuario());
    renderApp('/', () =>
      Promise.resolve({
        status: 401,
        ok: false,
        json: () => Promise.resolve({ error: 'El token expiró' }),
      }),
    );
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });
});

describe('ajustes', () => {
  it('guarda límite, idioma y modo oscuro (crea la configuración la primera vez)', async () => {
    loginSession(usuario());
    const api = createFakeApi({ users: [usuario()] });
    renderApp('/ajustes', api.fetchImpl);
    const limite = await screen.findByLabelText('Límite diario (minutos)');
    await userEvent.clear(limite);
    await userEvent.type(limite, '90');
    await userEvent.selectOptions(screen.getByLabelText('Idioma'), 'en');
    await userEvent.click(screen.getByLabelText('Modo oscuro'));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Ajustes guardados')).toBeInTheDocument();
    expect(api.state.users[0].limite_diario).toBe(90);
    expect(api.state.configs[0]).toMatchObject({ idioma: 'en', modo_oscuro: true });
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('valida el límite diario', async () => {
    loginSession(usuario());
    renderApp('/ajustes', createFakeApi({ users: [usuario()] }).fetchImpl);
    const limite = await screen.findByLabelText('Límite diario (minutos)');
    await userEvent.clear(limite);
    await userEvent.type(limite, '0');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText(/entre 1 y 1440/)).toBeInTheDocument();
  });

  it('carga la configuración existente y la actualiza', async () => {
    loginSession(usuario());
    const api = createFakeApi({
      users: [usuario()],
      configs: [{ id_config: 7, modo_oscuro: false, idioma: 'fr', notificaciones: true }],
    });
    renderApp('/ajustes', api.fetchImpl);
    expect(await screen.findByLabelText('Idioma')).toHaveValue('fr');
    await userEvent.click(screen.getByLabelText('Recibir notificaciones'));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(api.state.configs[0].notificaciones).toBe(false));
  });
});

it('muestra 404 en rutas desconocidas', async () => {
  renderApp('/nada', createFakeApi().fetchImpl);
  expect(await screen.findByText('404')).toBeInTheDocument();
});
