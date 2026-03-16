import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * useTokenFromUrl
 * Extrae un token (por defecto `token`) de la query string al montar el componente
 * y lo elimina del historial del navegador inmediatamente.
 */
export function useTokenFromUrl(paramName = 'token'): string | null {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get(paramName);
    if (t) {
      setToken(t);
      try {
        const newParams = new URLSearchParams(searchParams as unknown as string);
        newParams.delete(paramName);
        const qs = newParams.toString();
        const newUrl = `${window.location.pathname}${qs ? '?' + qs : ''}`;
        window.history.replaceState({}, document.title, newUrl);
      } catch {
        // ignore
      }
    }
    // Intentionally run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return token;
}
