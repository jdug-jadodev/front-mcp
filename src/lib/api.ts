const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface ApiOptions {
  headers?: Record<string, string>;
}

export const api = {
  baseURL: API_URL,

  async post<T = unknown, U = unknown>(endpoint: string, data: T, options: ApiOptions = {}): Promise<U> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      body: JSON.stringify(data)
    });
    if (response.status === 401) {
      clearAuth();
      window.location.href = '/login';
      return Promise.reject('Unauthorized');
    }
    return response.json();
  }
};

// Funciones de almacenamiento de sesión/token
export interface AuthUser {
  userId: string;
  email: string;
  [key: string]: unknown;
}
export const saveAuth = (token: string, user: AuthUser) => {
  localStorage.setItem('authToken', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getToken = () => localStorage.getItem('authToken');

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const clearAuth = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

// Verificación de sesión
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() < exp;
  } catch {
    return false;
  }
};
