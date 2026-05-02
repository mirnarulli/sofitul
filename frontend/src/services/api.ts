import axios, { AxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 15000,
});

// ── Request interceptor: adjunta access token ────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: refresh silencioso ante 401 ───────────────────────
let isRefreshing = false;
let pendingQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function processPending(token: string | null, error: unknown = null) {
  pendingQueue.forEach(p => token ? p.resolve(token) : p.reject(error));
  pendingQueue = [];
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('usuario');
  // No redirigir si ya estamos en /login — evita loop infinito cuando
  // contextos (LogosContext, EstadosContext) hacen llamadas sin sesión activa
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Solo intentar refresh en 401, y nunca en el propio endpoint /auth/refresh o /auth/login
    const isAuthEndpoint = original.url?.includes('/auth/refresh') || original.url?.includes('/auth/login');
    if (error.response?.status !== 401 || original._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    const accessToken  = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refresh_token');

    // Sin ningún token: usuario nunca inició sesión — no redirigir, solo rechazar
    if (!accessToken && !refreshToken) {
      return Promise.reject(error);
    }

    if (!refreshToken) {
      logout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Encolar mientras hay un refresh en curso
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            if (original.headers) original.headers['Authorization'] = `Bearer ${token}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry  = true;
    isRefreshing     = true;

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
        { refresh_token: refreshToken },
      );
      const newToken        = data.access_token as string;
      const newRefreshToken = data.refresh_token as string;
      localStorage.setItem('token',         newToken);
      localStorage.setItem('refresh_token', newRefreshToken);

      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      processPending(newToken);

      if (original.headers) original.headers['Authorization'] = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      processPending(null, refreshError);
      logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
