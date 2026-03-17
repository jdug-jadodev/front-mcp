# One Spec (Root Spec)

## Objetivo

Implementar validación de tokens en el frontend antes de mostrar formularios de cambio de contraseña. Los usuarios deben recibir feedback inmediato sobre si un enlace es válido, expirado o ya fue usado — evitando que llenen formularios con un token inválido.

## Alcance / No alcance

**Alcance:**
- Crear servicio reutilizable para validar tokens contra endpoint `GET /auth/validate-token`
- Modificar páginas `/create-password` y `/reset-password` para validar tokens antes de mostrar formulario
- Implementar estados visuales claros: validando, éxito, error (expirado/usado/no encontrado)
- Refactorizar extracción de tokens de URL en un hook reutilizable `useTokenFromUrl`
- Añadir cobertura de pruebas manuales y automatizadas

**No alcance:**
- Cambios en el backend (endpoint ya existe)
- Persistencia de tokens en `localStorage` (ya fue eliminada en remediación anterior)
- Integración con terceros o sistemas externos
- Cambios en política de expiración de tokens

## Definiciones (lenguaje de dominio)

- **Token:** JWT de un único uso, enviado por correo para crear/restablecer contraseña. Tiene tipo (`password_creation` o `password_reset`) y fecha de expiración.
- **password_creation:** Tipo de token para usuarios nuevos que nunca han puesto contraseña.
- **password_reset:** Tipo de token para usuarios existentes que olvidaron su contraseña.
- **Validación de token:** Llamada al backend para verificar estado (válido, expirado, usado, no encontrado, tipo incorrecto).
- **TokenValidationResult:** Interfaz TypeScript que contiene el resultado de una validación (valid, status, message, email).
- **useTokenFromUrl:** Hook React que extrae token de query parameters y limpia la URL del historial.

## Principios / Reglas no negociables

- **Validación antes de UI:** Nunca mostrar formulario de contraseña sin validar token primero.
- **Seguridad en URLs:** Remover tokens de la barra de direcciones tras extraerlos (usando `window.history.replaceState`).
- **Codificación de URLs:** Usar `encodeURIComponent(token)` al construir URLs (los JWT contienen caracteres especiales como `.`, `-`, `_`).
- **Manejo de errores robusto:** Tratar fallos de red como errores genéricos sin exponer detalles técnicos.
- **Mensajes en español:** Todos los mensajes al usuario deben estar en español según el repo.
- **Sin persistencia de tokens:** Tokens nunca se guardan en `localStorage`, solo en memoria durante la sesión.

## Límites

- Se implementará únicamente en frontend (React, TypeScript, biblioteca estándar del proyecto).
- Endpoint `/auth/validate-token` ya existe en backend; no se modifica.
- Tiempos de timeout para validación: máximo 10 segundos antes de mostrar error de red.
- Navegadores soportados: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+.

## Eventos y estados (visión raíz)

### Estados de una validación de token:

1. **initial** — Token no validado aún. Si hay token en URL, transicionar a `validating`.
2. **validating** — Llamada HTTP en progreso. Mostrar skeleton o spinner.
3. **valid** — Token es válido. Mostrar formulario con email del usuario.
4. **expired** — Token expiró (> 24h desde emisión). Mostrar enlace para solicitar nuevo.
5. **used** — Token ya fue consumido. Mostrar enlace a login.
6. **not_found** — Token no existe en base de datos. Mostrar error genérico.
7. **invalid_type** — Token es para otro tipo de operación. Mostrar error genérico.
8. **error** — Error de red o servidor. Mostrar mensaje de reintento.
9. **no_token** — No hay token en la URL. Mostrar error y enlace a solicitud.

### Flujo de eventos:

```
URL con token
    ↓
useEffect monta → extrae token con useTokenFromUrl()
    ↓
Llamar validatePasswordToken(token, type)
    ↓
    ├─→ Respuesta 200, valid=true     → estado='valid', mostrar formulario
    ├─→ Respuesta 200, status=expired → estado='expired', mostrar enlace
    ├─→ Respuesta 200, status=used    → estado='used', mostrar enlace
    ├─→ Respuesta 200, status=*       → estado=status, mostrar error
    └─→ Error de red, timeout        → estado='error', mostrar reintento
```

## Criterios de aceptación (root)

### CA1: Servicio de validación de tokens
- [ ] Función `validatePasswordToken(token: string, type: TokenType)` existe en `src/lib/api.ts`
- [ ] Retorna `TokenValidationResult` con campos: `valid`, `status`, `message`, `email?`
- [ ] Usa `encodeURIComponent(token)` para construir URL
- [ ] Maneja errores de red y devuelve `status: 'error'`
- [ ] Timeout configurado a 10 segundos máximo
- [ ] Testeado con todos los casos del archivo TESTING_MANUAL_VALIDATE_TOKEN.md

### CA2: Página CreatePassword
- [ ] Valida token del URL antes de montarse completamente
- [ ] Extrae token con `useTokenFromUrl('token')`
- [ ] Muestra spinner durante validación
- [ ] Si `valid=true`: muestra formulario con email, texto "Creando contraseña para {email}"
- [ ] Si `status=expired`: muestra pantalla con mensaje y botón "Solicitar nuevo enlace" → `/forgot-password`
- [ ] Si `status=used`: muestra pantalla con mensaje y botón "Ir al login" → `/login`
- [ ] Si otro error: muestra pantalla genérica y botón "Ir al login" → `/login`
- [ ] Si no hay token en URL: muestra error con enlace a `/forgot-password`
- [ ] Formulario de contraseña mantiene funcionalidad existente (POST /auth/create-password)

### CA3: Página ResetPassword
- [ ] Mismo comportamiento que CA2, pero con `type: 'password_reset'`
- [ ] Text diferenciado: "Restableciendo contraseña para {email}"
- [ ] Opciones de redirección iguales (expired → solicitar, used → login, etc.)

### CA4: Hook useTokenFromUrl
- [ ] Ubicado en `src/hooks/useTokenFromUrl.ts`
- [ ] Firma: `function useTokenFromUrl(paramName = 'token'): string | null`
- [ ] Extrae parámetro de query string
- [ ] Limpia URL con `window.history.replaceState()` sin causar navegación
- [ ] Ejecuta limpieza en `useEffect` al montar
- [ ] Retorna `null` si no hay parámetro

### CA5: Pruebas y documentación
- [ ] Todos los posibles estados de validación testeados manualmente (ver TESTING_MANUAL_VALIDATE_TOKEN.md)
- [ ] Casos: token válido, expirado, usado, no encontrado, tipo incorrecto, parámetros faltantes
- [ ] Screenshot o video de cada estado visible
- [ ] Documento actualizado con paso a paso de ejecución
- [ ] Errores de CSP resueltos (si aplica)

### CA6: Seguridad
- [ ] Sin `console.log` que expongan tokens o emails en logs
- [ ] Tokens nunca persisten en `localStorage`
- [ ] URL limpiada de tokens antes de que usuario pueda verla
- [ ] Mensajes de error sin exponer detalles técnicos de backend

## Trazabilidad

| Requisito | Archivo | Estado | Notas |
|-----------|---------|--------|-------|
| Servicio validación | `src/lib/api.ts` | Pendiente | Función `validatePasswordToken` |
| Página CreatePassword | `src/pages/CreatePassword.tsx` | Pendiente | Con validación previa a formulario |
| Página ResetPassword | `src/pages/ResetPassword.tsx` | Pendiente | Con validación previa a formulario |
| Hook extracción | `src/hooks/useTokenFromUrl.ts` | Pendiente | Nueva creación |
| Testing manual | `TESTING_MANUAL_VALIDATE_TOKEN.md` | Completado | Archivo ya proporciona casos |
| Integración | `src/services/authService.ts` | Pendiente | Reutilizar servicio existente |
| Configuración API | `src/config/` | Revisado | Usar `import.meta.env.VITE_API_URL` |

---

# Especificación Ejecutable - Implementación Detallada

## Fase 1: Servicio de validación de tokens

### Tarea 1.1: Crear interfaz `TokenValidationResult`

**Ubicación:** `src/lib/api.ts` (al inicio del archivo)

**Código:**
```typescript
export interface TokenValidationResult {
  valid: boolean;
  status: 'valid' | 'expired' | 'used' | 'not_found' | 'invalid_type' | 'error';
  message: string;
  email?: string;
}
```

**Notas:**
- Interfaz define contrato de respuesta del backend
- Campo `email` solo presente cuando `valid=true`

### Tarea 1.2: Crear función `validatePasswordToken`

**Ubicación:** `src/lib/api.ts` (después de la interfaz)

**Código:**
```typescript
/**
 * Valida un token de cambio de contraseña contra el backend.
 * 
 * @param token - JWT del usuario (viene en URL)
 * @param type - Tipo de operación ('password_creation' | 'password_reset')
 * @returns Resultado de validación con estado del token
 */
export async function validatePasswordToken(
  token: string,
  type: 'password_creation' | 'password_reset'
): Promise<TokenValidationResult> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      return {
        valid: false,
        status: 'error',
        message: 'Configuración de API no disponible'
      };
    }

    // Codificar token por seguridad (contiene caracteres especiales)
    const url = `${apiUrl}/auth/validate-token?token=${encodeURIComponent(
      token
    )}&type=${type}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Respuesta exitosa del backend
    if (response.ok) {
      const json = await response.json();
      if (json.status === 'success' && json.data) {
        return json.data;
      }
    }

    // Respuesta con error del backend
    if (!response.ok) {
      const json = await response.json();
      return {
        valid: false,
        status: 'error',
        message: json.message || 'Error al validar el enlace. Intenta de nuevo.'
      };
    }

    // Respuesta no esperada
    return {
      valid: false,
      status: 'error',
      message: 'Ocurrió un error inesperado'
    };
  } catch (error) {
    // Error de red, timeout, o CORS
    console.error('Error validating token:', error instanceof Error ? error.message : 'unknown');
    return {
      valid: false,
      status: 'error',
      message: 'No se pudo verificar el enlace. Revisa tu conexión e intenta de nuevo.'
    };
  }
}
```

**Testing:**
- Caso exitoso: token válido retorna `valid=true, status='valid', email=...`
- Caso expirado: retorna `valid=false, status='expired'`
- Caso timeout: retorna `valid=false, status='error'`

---

## Fase 2: Hook de extracción de token

### Tarea 2.1: Crear hook `useTokenFromUrl`

**Ubicación:** `src/hooks/useTokenFromUrl.ts` (nuevo archivo)

**Código:**
```typescript
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook que extrae un parámetro de query string y limpia la URL del historial.
 * Útil para tokens de un solo uso que no deben aparecer en el historial del navegador.
 *
 * @param paramName - Nombre del parámetro a extraer (default: 'token')
 * @returns Token extraído o null si no existe
 *
 * @example
 * const token = useTokenFromUrl('token');
 * // Extrae ?token=... y limpia la URL
 */
export function useTokenFromUrl(paramName = 'token'): string | null {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const extractedToken = searchParams.get(paramName);
    
    if (extractedToken) {
      // Guardar el token en estado
      setToken(extractedToken);

      // Limpiar token de la URL sin causar navegación
      const newParams = new URLSearchParams(searchParams);
      newParams.delete(paramName);

      // Construir nueva URL sin el token
      const newUrl = newParams.toString()
        ? `${window.location.pathname}?${newParams.toString()}`
        : window.location.pathname;

      // Reemplazar en el historial (no causa reload)
      window.history.replaceState({}, document.title, newUrl);
    }
    // Solo ejecutar una vez al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramName]);

  return token;
}
```

**Notas:**
- No usa `setSearchParams` de React Router (sería UX invasiva)
- Usa `window.history.replaceState` para cambio silencioso
- Token se extrae correctamente antes de limpiar
- Eslint-disable es necesario para evitar dependencia infinita de `searchParams`

**Testing:**
- Abrir `/create-password?token=abc123`
- Verificar que URL se limpia a `/create-password`
- Verificar que token es accesible via hook

---

## Fase 3: Página CreatePassword

### Tarea 3.1: Refactorizar CreatePassword.tsx

**Ubicación:** `src/pages/CreatePassword.tsx`

**Estructura de componente:**
```typescript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validatePasswordToken, TokenValidationResult } from '../lib/api';
import { useTokenFromUrl } from '../hooks/useTokenFromUrl';
import Button from '../components/Button';
import Card from '../components/Card';

type ValidationState = 'validating' | 'valid' | 'expired' | 'used' | 'invalid' | 'no_token' | 'error';

export default function CreatePassword() {
  const navigate = useNavigate();
  const token = useTokenFromUrl('token');

  const [validationState, setValidationState] = useState<ValidationState>('validating');
  const [validationResult, setValidationResult] = useState<TokenValidationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  // 1. Validar token al montar
  useEffect(() => {
    if (!token) {
      setValidationState('no_token');
      return;
    }

    // Iniciar validación
    setValidationState('validating');
    
    validatePasswordToken(token, 'password_creation').then((result) => {
      setValidationResult(result);
      
      if (result.valid) {
        setValidationState('valid');
      } else {
        // Mapear status de respuesta a nuestro estado
        switch (result.status) {
          case 'expired':
            setValidationState('expired');
            break;
          case 'used':
            setValidationState('used');
            break;
          default:
            setValidationState('invalid');
        }
      }
    });
  }, [token]);

  // 2. Resolver el formulario si token es válido
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Token no disponible');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // POST /auth/create-password
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/create-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.message || 'Error al crear contraseña');
      }

      // Éxito: redirigir a login
      navigate('/login', {
        state: { message: 'Contraseña creada. Por favor, inicia sesión.' }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDERIZACIÓN ---

  // Estado: Validando
  if (validationState === 'validating') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
            <p className="text-sm text-gray-500 text-center">
              Verificando tu enlace...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Estado: No hay token en URL
  if (validationState === 'no_token') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <div className="space-y-6 text-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Enlace no válido</h1>
              <p className="mt-2 text-gray-600">
                No se encontró un enlace de creación de contraseña.
              </p>
            </div>
            <Button
              onClick={() => navigate('/forgot-password')}
              className="w-full"
            >
              Solicitar un nuevo enlace
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Estado: Token expirado
  if (validationState === 'expired') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <div className="space-y-6 text-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Enlace expirado</h1>
              <p className="mt-2 text-gray-600">
                El enlace de creación de contraseña ya no es válido.
              </p>
            </div>
            <Button
              onClick={() => navigate('/forgot-password')}
              className="w-full"
            >
              Solicitar un nuevo enlace
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Estado: Token ya usado
  if (validationState === 'used') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <div className="space-y-6 text-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Enlace ya utilizado</h1>
              <p className="mt-2 text-gray-600">
                Este enlace ya fue usado para crear una contraseña.
              </p>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Ir al inicio de sesión
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Estado: Token inválido / error genérico
  if (validationState === 'invalid' || validationState === 'error') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <div className="space-y-6 text-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Error</h1>
              <p className="mt-2 text-gray-600">
                {validationResult?.message || 
                 'No se pudo procesar tu solicitud. Intenta de nuevo.'}
              </p>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Ir al inicio de sesión
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Estado: Válido - Mostrar formulario
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Crear contraseña</h1>
            <p className="mt-2 text-sm text-gray-600">
              Creando contraseña para: <strong>{validationResult?.email}</strong>
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700">
              Confirmar contraseña
            </label>
            <input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Creando contraseña...' : 'Crear contraseña'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

**Cambios principales:**
- `useTokenFromUrl()` para extraer y limpiar token
- `useEffect` para validar antes de montar formulario
- Estados visuales distintos según resultado de validación
- Manejo de errores robusto
- Mensajes en español

---

## Fase 4: Página ResetPassword

### Tarea 4.1: Refactorizar ResetPassword.tsx

**Ubicación:** `src/pages/ResetPassword.tsx`

Seguir el mismo patrón que CreatePassword, pero:
- Usar `validatePasswordToken(token, 'password_reset')`
- Cambiar textos: "Restablecer contraseña" en lugar de "Crear contraseña"
- Usar "nueva contraseña" en lugar de "contraseña"
- Endpoint POST `/auth/reset-password` en lugar de `/auth/create-password`
- Mensaje de éxito: "Contraseña actualizada. Inicia sesión."

**Pseudocódigo diferencias:**
```typescript
// En lugar de:
validatePasswordToken(token, 'password_creation')

// Usar:
validatePasswordToken(token, 'password_reset')

// En lugar de:
POST /auth/create-password

// Usar:
POST /auth/reset-password

// En lugar de:
"Creando contraseña para: {email}"

// Usar:
"Restableciendo contraseña para: {email}"
```

---

## Fase 5: Configuración y validación

### Tarea 5.1: Verificar variables de entorno

**Ubicación:** `.env.local` (o configuración actual)

**Requerido:**
```
VITE_API_URL=http://localhost:4000  # o URL del backend en producción
```

**Verificación:**
```bash
echo $VITE_API_URL  # Debe mostrar algo como http://localhost:4000
```

### Tarea 5.2: Verificar importaciones

Asegurarse de que todos los imports existen:
- `React`, `useState`, `useEffect` desde `react`
- `useNavigate`, `useSearchParams` desde `react-router-dom`
- Componentes `Button`, `Card`, `FormError` desde carpeta `components`

### Tarea 5.3: ESLint y TypeScript

Ejecutar validaciones:
```bash
npm run lint -- --fix  # Corregir problemas automáticos
npm run build         # Verificar no hay errores TypeScript
```

---

## Fase 6: Plan de pruebas

### test-plan.md

Crear documento `PLAN_PRUEBAS_VALIDACION_TOKENS.md` con:

1. **Prueba manual: Token válido**
   - Pasos: Crear usuario, copiar enlace de correo, abrir en navegador
   - Resultado esperado: Formulario visible, email mostrado
   - Estado: [ ] Pass / [ ] Fail

2. **Prueba manual: Token expirado**
   - Pasos: Esperar 24+ horas o editar BD
   - Resultado esperado: Pantalla "Enlace expirado", botón a solicitud
   - Estado: [ ] Pass / [ ] Fail

3. **Prueba manual: Token usado**
   - Pasos: Crear usuario, consumir token, intentar reutilizar
   - Resultado esperado: Pantalla "Enlace ya utilizado", botón a login
   - Estado: [ ] Pass / [ ] Fail

4. **Prueba manual: Sin token en URL**
   - Pasos: Abrir `/create-password` sin parámetros
   - Resultado esperado: Pantalla "Enlace no válido"
   - Estado: [ ] Pass / [ ] Fail

5. **Prueba manual: Error de red**
   - Pasos: Simular offline (DevTools > Network throttling)
   - Resultado esperado: Pantalla "No se pudo verificar"
   - Estado: [ ] Pass / [ ] Fail

6. **Prueba de seguridad: URL limpiada**
   - Pasos: Abrir enlace con token, verificar barra de direcciones
   - Resultado esperado: Token no visible en URL
   - Estado: [ ] Pass / [ ] Fail

7. **Prueba de seguridad: Sin logs sensibles**
   - Pasos: Abrir DevTools > Console
   - Resultado esperado: No hay tokens o emails en logs
   - Estado: [ ] Pass / [ ] Fail

### Casos de prueba (de TESTING_MANUAL_VALIDATE_TOKEN.md)

Referencia directa a tests que ya existen:
- Test 1: Token válido ✓
- Test 2: Token expirado ✓
- Test 3: Token usado ✓
- Test 4: Token no encontrado ✓
- Test 5: Tipo incorrecto ✓
- Test 6-9: Parámetros faltantes/inválidos ✓

---

## Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|--------|-----------|
| Timeout de validación bloquea UI | Media | Alto | Mostrar spinner, timeout 10s |
| Token no limpiado de URL | Baja | Alto | Validar en dev tools |
| CORS bloquea request | Baja | Alto | Verificar headers backend |
| Usuario navega antes de validar | Media | Bajo | No permitir, o volver a validar |
| Token expirado cambio frecuente | Baja | Medio | Documentar tiempo en correo |

---

## Criterios de definición de listo (DoD)

- [ ] PR creado en rama `feat/token-validation`
- [ ] Código revieweado y aprobado
- [ ] Todos los tests manuales pasan
- [ ] No hay errores de ESLint ni TypeScript
- [ ] No hay regresiones en flujos existentes
- [ ] Documentación actualizada
- [ ] Screenshots de cada estado visual
- [ ] Checklist de seguridad completado

---

## Referencias y archivos asociados

- [PLAN_FRONTEND_VALIDACION_TOKENS.md](PLAN_FRONTEND_VALIDACION_TOKENS.md) — Contrato de API y tareas base
- [TESTING_MANUAL_VALIDATE_TOKEN.md](TESTING_MANUAL_VALIDATE_TOKEN.md) — Casos de prueba endpoint
- [ANALISIS_AUTENTICACION_FRONTEND.md](ANALISIS_AUTENTICACION_FRONTEND.md) — Contexto de autenticación
- [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) — Validaciones de seguridad
- [PLAN_REMEDIACION_SEGURIDAD.md](PLAN_REMEDIACION_SEGURIDAD.md) — Contexto de remediaciones previas

---

**Especificación generada:** 17 de Marzo, 2026  
**Estado:** Listo para ejecución  
**Responsable:** Equipo Frontend MCP

