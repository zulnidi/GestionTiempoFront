/** Servicios de la API de BeAware. Reciben el cliente para poder probarse sin red. */
export function createServices(client) {
  const { request } = client;
  return {
    auth: {
      login: (correo, contrasena) =>
        request('/usuarios/login/', { method: 'POST', body: { correo, contrasena } }),
      register: (data) => request('/usuarios/', { method: 'POST', body: data }),
      me: () => request('/usuarios/me/'),
    },
    stats: {
      list: () => request('/estadisticas/'),
      create: (data) => request('/estadisticas/', { method: 'POST', body: data }),
      update: (id, data) => request(`/estadisticas/${id}/`, { method: 'PATCH', body: data }),
      remove: (id) => request(`/estadisticas/${id}/`, { method: 'DELETE' }),
    },
    settings: {
      get: (userId) => request(`/configuraciones/usuario/${userId}/`),
      create: (data) => request('/configuraciones/', { method: 'POST', body: data }),
      update: (id, data) => request(`/configuraciones/${id}/`, { method: 'PATCH', body: data }),
    },
    users: {
      update: (id, data) => request(`/usuarios/${id}/`, { method: 'PATCH', body: data }),
    },
  };
}
