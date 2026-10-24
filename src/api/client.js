const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Mensaje en español según el estado cuando el servidor no manda uno propio. */
const DEFAULT_MESSAGES = {
  401: 'Tu sesión no es válida. Inicia sesión de nuevo.',
  403: 'No tienes permiso para hacer esto.',
  404: 'No se encontró el recurso.',
};

/**
 * Cliente HTTP mínimo sobre fetch. Añade el token, serializa JSON y convierte
 * cualquier fallo en ApiError con un mensaje legible para la interfaz.
 */
export function createClient({
  getToken = () => null,
  onUnauthorized = () => {},
  baseUrl = API_URL,
  fetchImpl,
} = {}) {
  async function request(path, { method = 'GET', body } = {}) {
    const doFetch = fetchImpl || globalThis.fetch;
    const headers = { Accept: 'application/json' };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    let response;
    try {
      response = await doFetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError('No se pudo conectar con el servidor', 0);
    }

    if (response.status === 204) return null;
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 && token) onUnauthorized();
      throw new ApiError(
        data?.error || DEFAULT_MESSAGES[response.status] || 'Error del servidor',
        response.status,
      );
    }
    return data;
  }
  return { request };
}
