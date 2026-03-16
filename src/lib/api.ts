const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface ApiOptions {
  headers?: Record<string, string>;
}

export const api = {
  baseURL: API_URL,

  async post<T = unknown, U = unknown>(endpoint: string, data: T, options: ApiOptions = {}): Promise<U> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (response.status === 401) {
      clearAuth();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const text = await response.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    if (!response.ok) {
      type BodyLike = { code?: string; message?: string } & Record<string, unknown>;
      const bodyObj = (body || {}) as BodyLike;
      const code = bodyObj.code;
      if (code === 'TOKEN_ALREADY_USED' || code === 'INVALID_TOKEN') {
        const err: Error & { code?: string } = new Error(bodyObj.message || 'Invalid or already used token');
        err.code = code;
        throw err;
      }
      throw new Error(bodyObj.message || response.statusText);
    }

    return body as U;
  }
};

// Funciones de almacenamiento de sesión/token
export interface AuthUser {
  userId: string;
  email: string;
  [key: string]: unknown;
}
// Mitigación temporal: almacenar token en memoria para evitar nuevas escrituras a localStorage
let inMemoryAuthToken: string | null = null;

export const saveAuth = (token: string, user: AuthUser) => {
  inMemoryAuthToken = token; // TODO: migrate to HttpOnly cookie (backend)
  try {
    // Persist only user metadata for UX; avoid storing token in localStorage
    localStorage.setItem('user', JSON.stringify(user));
  } catch {
    // ignore
  }
};

export const getToken = () => inMemoryAuthToken;

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const clearAuth = () => {
  inMemoryAuthToken = null;
  try {
    // Remove legacy auth token keys if present (do not persist tokens anymore)
    localStorage.removeItem('authToken');
  } catch {
    // ignore
  }
};

// Safe JWT parsing helper
export const safeParseJwt = (token: string | null): Record<string, unknown> | null => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    return typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

// Verificación de sesión
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  const payload = safeParseJwt(token);
  if (!payload) return false;
  const expVal = payload.exp as unknown;
  const exp = typeof expVal === 'number' ? expVal * 1000 : (typeof expVal === 'string' ? parseInt(expVal, 10) * 1000 : NaN);
  if (!exp || Number.isNaN(exp)) return false;
  return Date.now() < exp;
};
