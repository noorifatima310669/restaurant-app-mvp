// Change this one address to your laptop LAN IP (ipconfig) for physical phones.
// EXPO_PUBLIC_API_URL is an optional non-secret override; never put database/JWT secrets here.
export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://urban-fork-api.onrender.com/api').replace(/\/+$/, '');

export function createApiClient(fetchImpl = (...args) => fetch(...args)) {
  let token = null;
  async function request(path, { method = 'GET', body, signal, auth = true } = {}) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timer = setTimeout(abort, 60000);
    try {
      let response;
      try {
        response = await fetchImpl(`${BASE_URL}${path}`, {
          method, headers: { Accept: 'application/json', 'Content-Type': 'application/json',
            ...(auth && token ? { Authorization: `Bearer ${token}` } : {}) },
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: controller.signal,
        });
      } catch (cause) {
        const error = new Error(cause.name === 'AbortError'
          ? 'Request timed out or was cancelled. Please retry.'
          : 'Cannot reach the restaurant server. Check Wi-Fi, server startup and BASE_URL.');
        error.cause = cause; throw error;
      }
      const raw = await response.text();
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; }
      catch {
        const error = new Error('Server returned an invalid response. Please retry.');
        error.status = response.status; throw error;
      }
      if (!response.ok) {
        const error = new Error(data?.message || `Request failed (${response.status})`);
        error.status = response.status; throw error;
      }
      return data;
    } finally {
      clearTimeout(timer); signal?.removeEventListener('abort', abort);
    }
  }
  return { request, setToken: value => { token = value || null; }, getToken: () => token };
}
export const api = createApiClient();
