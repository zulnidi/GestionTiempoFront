import { ApiError, createClient } from './client';

const response = (status, body) =>
  Promise.resolve({
    status,
    ok: status < 400,
    json: () =>
      body === undefined ? Promise.reject(new Error('sin cuerpo')) : Promise.resolve(body),
  });

describe('createClient', () => {
  it('envía token y cuerpo JSON y devuelve los datos', async () => {
    const fetchImpl = vi.fn(() => response(200, { ok: 1 }));
    const { request } = createClient({ getToken: () => 'abc', baseUrl: 'http://x/api', fetchImpl });
    expect(await request('/a/', { method: 'POST', body: { n: 1 } })).toEqual({ ok: 1 });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('http://x/api/a/');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer abc',
      'Content-Type': 'application/json',
    });
    expect(init.body).toBe('{"n":1}');
  });
  it('204 devuelve null', async () => {
    const { request } = createClient({
      baseUrl: 'http://x',
      fetchImpl: () => Promise.resolve({ status: 204, ok: true }),
    });
    expect(await request('/a/', { method: 'DELETE' })).toBeNull();
  });
  it('usa el mensaje del servidor o uno por defecto', async () => {
    const mk = (status, body) =>
      createClient({ baseUrl: 'http://x', fetchImpl: () => response(status, body) }).request('/a/');
    await expect(mk(400, { error: 'Dato inválido' })).rejects.toMatchObject({
      message: 'Dato inválido',
      status: 400,
    });
    await expect(mk(403, {})).rejects.toMatchObject({ message: expect.stringMatching(/permiso/) });
    await expect(mk(500, undefined)).rejects.toMatchObject({ message: 'Error del servidor' });
  });
  it('401 con token cierra la sesión', async () => {
    const onUnauthorized = vi.fn();
    const { request } = createClient({
      getToken: () => 't',
      onUnauthorized,
      baseUrl: 'http://x',
      fetchImpl: () => response(401, { error: 'El token expiró' }),
    });
    await expect(request('/a/')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
  it('un 401 sin token (login fallido) no cierra sesión', async () => {
    const onUnauthorized = vi.fn();
    const { request } = createClient({
      onUnauthorized,
      baseUrl: 'http://x',
      fetchImpl: () => response(401, { error: 'mal' }),
    });
    await expect(request('/a/')).rejects.toThrow('mal');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
  it('error de red', async () => {
    const { request } = createClient({
      baseUrl: 'http://x',
      fetchImpl: () => Promise.reject(new TypeError('fail')),
    });
    await expect(request('/a/')).rejects.toMatchObject({
      message: 'No se pudo conectar con el servidor',
      status: 0,
    });
  });
});
