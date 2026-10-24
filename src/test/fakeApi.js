/** Servidor falso en memoria: un fetch que imita la API de BeAware para las pruebas. */
export function createFakeApi({ users = [], stats = [], configs = [] } = {}) {
  const state = { users, stats, configs, calls: [] };
  const json = (status, body) =>
    Promise.resolve({ status, ok: status < 400, json: () => Promise.resolve(body) });

  async function fetchImpl(url, { method = 'GET', body } = {}) {
    const path = new URL(url).pathname.replace('/api', '');
    const data = body ? JSON.parse(body) : undefined;
    state.calls.push({ method, path, data });
    if (method === 'POST' && path === '/usuarios/login/') {
      const u = state.users.find(
        (x) => x.correo === data.correo && x.contrasena === data.contrasena,
      );
      if (!u) return json(401, { error: 'Correo o contraseña inválidos' });
      const { contrasena: _c, ...usuario } = u;
      return json(200, { token: 'tok', token_type: 'Bearer', usuario });
    }
    if (method === 'POST' && path === '/usuarios/') {
      if (state.users.some((x) => x.correo === data.correo))
        return json(400, { error: 'El correo ya está registrado' });
      state.users.push({ id_usuario: state.users.length + 1, limite_diario: 60, ...data });
      return json(201, {});
    }
    if (path === '/estadisticas/' && method === 'GET') return json(200, state.stats);
    if (path === '/estadisticas/' && method === 'POST') {
      const s = {
        id_estadistica: state.stats.length + 1,
        id_usuario: 1,
        estado: data.tiempo_uso > 60 ? 'EXCEDIDO' : 'DENTRO_DEL_LIMITE',
        ...data,
      };
      state.stats.push(s);
      return json(201, s);
    }
    const stat = path.match(/^\/estadisticas\/(\d+)\/$/);
    if (stat) {
      const i = state.stats.findIndex((s) => s.id_estadistica === Number(stat[1]));
      if (method === 'DELETE') {
        state.stats.splice(i, 1);
        return Promise.resolve({ status: 204, ok: true });
      }
      if (method === 'PATCH') {
        state.stats[i] = {
          ...state.stats[i],
          ...data,
          estado: data.tiempo_uso > 60 ? 'EXCEDIDO' : 'DENTRO_DEL_LIMITE',
        };
        return json(200, state.stats[i]);
      }
    }
    if (path.startsWith('/configuraciones/usuario/')) {
      return state.configs[0]
        ? json(200, state.configs[0])
        : json(404, { error: 'Configuración no encontrada' });
    }
    if (path === '/configuraciones/' && method === 'POST') {
      state.configs[0] = { id_config: 1, ...data };
      return json(201, state.configs[0]);
    }
    if (path.match(/^\/configuraciones\/\d+\/$/) && method === 'PATCH') {
      state.configs[0] = { ...state.configs[0], ...data };
      return json(200, state.configs[0]);
    }
    if (path.match(/^\/usuarios\/\d+\/$/) && method === 'PATCH') {
      const u = state.users[0];
      Object.assign(u, data);
      const { contrasena: _c, ...usuario } = u;
      return json(200, usuario);
    }
    return json(404, { error: 'No encontrado' });
  }
  return { fetchImpl, state };
}

export const usuario = (extra = {}) => ({
  id_usuario: 1,
  nombre: 'Ana Pérez',
  correo: 'ana@mail.com',
  contrasena: 'secreto1',
  limite_diario: 60,
  ...extra,
});
