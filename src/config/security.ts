// Seguridad y configuración de comportamiento en cliente
export const COOLDOWN_MS = Number(import.meta.env.VITE_COOLDOWN_MS) || 2000;
export const DEBOUNCE_MS = Number(import.meta.env.VITE_DEBOUNCE_MS) || 300;
export const ENABLE_RECAPTCHA = import.meta.env.VITE_ENABLE_RECAPTCHA === 'true';
export const RECAPTCHA_KEY = import.meta.env.VITE_RECAPTCHA_KEY || '';

// Endpoints considerados sensibles (útil para aplicar reglas específicas)
export const SENSITIVE_ENDPOINTS = [
  '/auth/login',
  '/auth/create-password',
  '/auth/reset-password',
  '/auth/forgot-password',
  '/admin/users'
];
