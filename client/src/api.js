// Capa única de comunicación con el backend. Todos los errores salen como Error con mensaje legible.
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'voltstone_token';

export const auth = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (t) => sessionStorage.setItem(TOKEN_KEY, t),
  clear: () => sessionStorage.removeItem(TOKEN_KEY)
};

export async function request(path, { method = 'GET', body, admin = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (admin && auth.get()) headers.Authorization = `Bearer ${auth.get()}`;

  let res;
  try {
    res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    // fetch solo falla por red caída o servidor dormido (Render gratis tarda ~50 s en despertar)
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión o espera unos segundos e intenta de nuevo.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && admin) auth.clear(); // sesión vencida: se fuerza nuevo login
    throw new Error(data?.error?.message || `Error ${res.status}`);
  }
  return data;
}
