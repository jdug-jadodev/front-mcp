# One Spec (Root Spec)

## Objetivo

Implementar un sistema de **logout dual con revocación completa de tokens** que invalide simultáneamente:
1. El JWT del Backend de Login (Loggin-MCP)
2. El access_token OAuth del MCP Server

Al completar el logout, VSCode perderá acceso inmediato al MCP Server, y el usuario será completamente desconectado de ambos sistemas. Actualmente, el logout solo limpia el localStorage sin revocar tokens en los servidores, permitiendo que tokens válidos continúen siendo funcionales hasta su expiración natural.

## Alcance / No alcance

### Alcance:

- ✅ Implementar método `logout()` en `authService.ts` para revocar JWT en Backend de Login
- ✅ Implementar método `revokeMCPToken()` en `authService.ts` para revocar access_token en MCP Server
- ✅ Implementar método `revokeMCPRefreshToken()` en `authService.ts` para revocar refresh_token en MCP Server
- ✅ Refactorizar función `handleLogout()` en `Dashboard.tsx` para ejecutar revocación dual
- ✅ Implementar manejo de timeouts (5 segundos) para evitar bloqueos de UI
- ✅ Implementar limpieza completa de localStorage y sessionStorage
- ✅ Implementar estados de loading durante el proceso de logout
- ✅ Implementar logs detallados para monitoreo del proceso
- ✅ Implementar resiliencia: logout local funciona aunque fallen las revocaciones remotas
- ✅ Configurar variables de entorno necesarias (`VITE_API_URL`, `VITE_MCP_URL`)
- ✅ Actualizar UI con feedback visual (spinner, mensajes)

### No alcance:

- ❌ Cambios en el Backend de Login (endpoint `/auth/logout` ya existe)
- ❌ Implementación del endpoint `/oauth/revoke` en MCP Server (será implementado por equipo MCP)
- ❌ Migración a cookies HttpOnly (requiere cambios backend)
- ❌ Sistema de confirmación previa al logout (puede añadirse opcionalmente)
- ❌ Sistema de notificaciones toast (puede añadirse opcionalmente)
- ❌ Revocación de tokens de terceros sistemas
- ❌ Blacklist de tokens en frontend

## Definiciones (lenguaje de dominio)

- **JWT (JSON Web Token):** Token de autenticación emitido por el Backend de Login tras login exitoso. Contiene `jti` (JWT ID único) y campo `exp` (timestamp de expiración). Almacenado en `localStorage.authToken`.

- **jti (JWT ID):** Identificador único del JWT usado por el backend para blacklist. Al hacer logout, el `jti` se registra en base de datos como revocado.

- **access_token:** Token OAuth emitido por MCP Server tras flujo OAuth. Da acceso a VSCode para consultar prompts. Almacenado en `localStorage.mcp_access_token`.

- **refresh_token:** Token OAuth de larga duración para renovar access_tokens. Más crítico de revocar por seguridad. Almacenado en `localStorage.mcp_refresh_token`.

- **oauth_request:** ID temporal de solicitud OAuth almacenado en `sessionStorage` durante el flujo de callback.

- **Logout dual:** Proceso que revoca tokens en AMBOS sistemas (Backend Login + MCP Server) antes de limpiar localStorage.

- **Revocación:** Acción de invalidar un token en el servidor, haciéndolo no funcional inmediatamente aunque no haya expirado.

- **Blacklist:** Lista de tokens revocados mantenida por el backend. Consultas futuras con tokens en blacklist reciben 401 Unauthorized.

- **Timeout:** Límite de tiempo (5s) para esperar respuesta del servidor. Si se excede, el logout continúa localmente.

- **Resiliencia:** Capacidad del logout de completarse localmente aunque fallen las revocaciones remotas (red caída, servidor no disponible).

## Principios / Reglas no negociables

1. **Revocación antes de limpieza:** Los tokens DEBEN ser revocados en servidores ANTES de limpiar localStorage. Si falla la revocación, continuar con limpieza local.

2. **Nunca bloquear UI indefinidamente:** Usar timeouts de 5 segundos máximo. Si un servidor no responde, continuar con el proceso.

3. **Orden de revocación:**
   ```
   1. JWT Backend Login (más importante)
   2. Refresh token MCP (más crítico por duración)
   3. Access token MCP
   4. Limpieza localStorage/sessionStorage
   5. Redirección a /login
   ```

4. **Limpieza completa obligatoria:** Independientemente del resultado de las revocaciones, SIEMPRE limpiar:
   - `localStorage.authToken`
   - `localStorage.token_expires_at`
   - `localStorage.user`
   - `localStorage.mcp_access_token`
   - `localStorage.mcp_refresh_token`
   - `localStorage.mcp_token_expires_at`
   - `sessionStorage.oauth_request`
   - Variable en memoria `inMemoryAuthToken`

5. **Logging obligatorio:** Cada paso del logout debe loguearse en consola para debugging. NO loguear tokens completos, solo estado.

6. **Resiliencia obligatoria:** El logout DEBE funcionar en escenarios adversos:
   - Sin conexión de red
   - Backend no disponible
   - MCP Server no disponible
   - Timeout de servidores

7. **Seguridad en logs:** NUNCA loguear tokens completos en consola. Solo estados y fragmentos finales.

8. **UI no bloqueante:** Mostrar estado de loading, deshabilitar botón, pero no bloquear toda la UI.

9. **Redirección garantizada:** SIEMPRE redirigir a `/login` al finalizar, sin importar errores.

10. **Codificación de tokens:** Usar `encodeURIComponent()` para tokens en URLs (aunque actualmente no se usan en query params, mantener buena práctica).

## Límites

**Tecnológicos:**
- React 19.2.0 con TypeScript 5.9.3
- React Router DOM 7.13.1 para navegación
- Fetch API nativo (no Axios para revocación)
- localStorage y sessionStorage del navegador
- Timeouts máximos: 5 segundos por operación de revocación

**Externos:**
- Backend de Login debe tener endpoint `POST /auth/logout` funcional (actualmente disponible)
- MCP Server debe implementar endpoint `POST /oauth/revoke` (en desarrollo, coordinarse)
- Navegadores soportados: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

**De infraestructura:**
- Variables de entorno requeridas: `VITE_API_URL`, `VITE_MCP_URL`
- Despliegue en Vercel (front-mcp-gules.vercel.app)
- Backend Login en https://loggin-mcp.onrender.com
- MCP Server en https://mcp-promps.onrender.com

**Funcionales:**
- No se implementa confirmación previa (puede añadirse después)
- No se implementa sistema de notificaciones persistentes
- No se implementa retry automático de revocaciones fallidas

## Eventos y estados (visión raíz)

### Flujo de estados del logout:

```
┌─────────────────────────────────────────────────────────────┐
│ ESTADO: Usuario autenticado en Dashboard                    │
│ Tokens: JWT + MCP access_token + MCP refresh_token          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Usuario hace clic en "Cerrar sesión"
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ ESTADO: isLoggingOut = true                                  │
│ UI: Botón deshabilitado, spinner visible                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Extraer tokens de localStorage
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ EVENTO: Revocar JWT en Backend Login                         │
│ Acción: POST /auth/logout con Authorization header           │
│ Timeout: 5 segundos                                          │
├─────────────────┬───────────────────────────────────────────┤
│ Éxito (200)     │ Error/Timeout                              │
│ loginRevoked=✓  │ loginRevoked=✗ → Continuar                 │
└─────────────────┴───────────────┬───────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ EVENTO: Revocar refresh_token MCP (si existe)                │
│ Acción: POST /oauth/revoke con token_type_hint=refresh_token│
│ Timeout: 5 segundos                                          │
├─────────────────┬───────────────────────────────────────────┤
│ Éxito (200)     │ Error/Timeout → Continuar                  │
└─────────────────┴───────────────┬───────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ EVENTO: Revocar access_token MCP                             │
│ Acción: POST /oauth/revoke con token_type_hint=access_token │
│ Timeout: 5 segundos                                          │
├─────────────────┬───────────────────────────────────────────┤
│ Éxito (200)     │ Error/Timeout                              │
│ mcpRevoked=✓    │ mcpRevoked=✗ → Continuar                   │
└─────────────────┴───────────────┬───────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ EVENTO: Limpieza de almacenamiento                           │
│ Acción: Eliminar todas las keys de localStorage/session      │
│         Limpiar inMemoryAuthToken                            │
└─────────────────┬───────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ EVENTO: Logging de resultado                                 │
│ - Logout completo exitoso (JWT✓ + MCP✓)                     │
│ - Logout parcial (JWT✓ o MCP✓)                              │
│ - Logout local solamente (ambos ✗)                           │
└─────────────────┬───────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ ESTADO FINAL: Usuario desconectado                           │
│ Acción: navigate('/login')                                   │
│ UI: Pantalla de login                                        │
└─────────────────────────────────────────────────────────────┘
```

### Efectos en VSCode:

```
┌─────────────────────────────────────────────────────────────┐
│ ANTES del logout:                                            │
│ VSCode → @mis-prompts revisar-codigo → ✅ Funciona           │
└─────────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ DESPUÉS del logout (access_token revocado):                  │
│ VSCode → @mis-prompts revisar-codigo → ❌ Error 401          │
│ VSCode solicita re-autenticación                             │
└─────────────────────────────────────────────────────────────┘
```

## Criterios de aceptación (root)

### CA1: Servicio de revocación - Backend Login

**Ubicación:** `src/services/authService.ts`

**Pre-requisitos:**
- Variable de entorno `VITE_API_URL` configurada

**Implementación:**

```typescript
/**
 * Revoca el JWT en el Backend de Login
 * El backend registra el jti del token en blacklist
 * 
 * @param token - JWT a revocar
 * @returns Resultado de la operación
 */
async logout(token: string): Promise<{ status: 'success' } | { status: 'error'; message: string }> {
  try {
    const AUTH_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    console.log('🔐 Revocando JWT en Backend de Login...');
    
    const response = await fetch(`${AUTH_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      console.log('✅ JWT revocado en Backend de Login');
      return { status: 'success' };
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error revocando JWT:', errorData);
      return {
        status: 'error',
        message: errorData.message || 'Error al revocar token'
      };
    }
  } catch (error) {
    console.error('❌ Error de red revocando JWT:', error);
    return {
      status: 'error',
      message: 'Error de red al cerrar sesión'
    };
  }
}
```

**Criterios:**
- [ ] Función `logout()` existe en objeto `authService`
- [ ] Usa variable de entorno `VITE_API_URL`
- [ ] Hace POST a `/auth/logout` con header Authorization
- [ ] Maneja respuestas 200 (éxito)
- [ ] Maneja respuestas 4xx/5xx (error del servidor)
- [ ] Maneja errores de red (catch)
- [ ] Retorna objeto con `status: 'success' | 'error'`
- [ ] Loguea estado en consola sin exponer token completo
- [ ] NO lanza excepciones (siempre retorna objeto)

---

### CA2: Servicio de revocación - MCP Server (access_token)

**Ubicación:** `src/services/authService.ts`

**Pre-requisitos:**
- Variable de entorno `VITE_MCP_URL` configurada
- Endpoint `/oauth/revoke` implementado en MCP Server

**Implementación:**

```typescript
/**
 * Revoca el access_token OAuth del MCP Server
 * Esto invalida inmediatamente el acceso de VSCode
 * 
 * @param mcpAccessToken - Access token OAuth a revocar
 * @returns Resultado de la operación
 */
async revokeMCPToken(mcpAccessToken: string): Promise<{ status: 'success' } | { status: 'error'; message: string }> {
  try {
    const MCP_BASE_URL = import.meta.env.VITE_MCP_URL || 'https://mcp-promps.onrender.com';
    console.log('🔐 Revocando access_token en MCP Server...');
    
    const response = await fetch(`${MCP_BASE_URL}/oauth/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${mcpAccessToken}`
      },
      body: new URLSearchParams({
        token: mcpAccessToken,
        token_type_hint: 'access_token'
      })
    });
    
    if (response.ok) {
      console.log('✅ Access token de MCP revocado');
      return { status: 'success' };
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error revocando token de MCP:', errorData);
      return {
        status: 'error',
        message: errorData.message || 'Error al revocar token de MCP'
      };
    }
  } catch (error) {
    console.error('❌ Error de red revocando token de MCP:', error);
    return {
      status: 'error',
      message: 'Error de red al revocar token de MCP'
    };
  }
}
```

**Criterios:**
- [ ] Función `revokeMCPToken()` existe en objeto `authService`
- [ ] Usa variable de entorno `VITE_MCP_URL`
- [ ] Hace POST a `/oauth/revoke` con Content-Type correcto
- [ ] Envía body como URLSearchParams con `token` y `token_type_hint=access_token`
- [ ] Incluye header Authorization con Bearer token
- [ ] Maneja respuestas 200, errores y excepciones
- [ ] Retorna objeto estandarizado
- [ ] Loguea estados apropiadamente

---

### CA3: Servicio de revocación - MCP Server (refresh_token)

**Ubicación:** `src/services/authService.ts`

**Implementación:**

```typescript
/**
 * Revoca el refresh_token OAuth del MCP Server
 * Más crítico de revocar por su larga duración
 * 
 * @param mcpRefreshToken - Refresh token a revocar
 * @param mcpAccessToken - Access token para autenticación
 * @returns Resultado de la operación
 */
async revokeMCPRefreshToken(
  mcpRefreshToken: string, 
  mcpAccessToken: string
): Promise<{ status: 'success' } | { status: 'error'; message: string }> {
  try {
    const MCP_BASE_URL = import.meta.env.VITE_MCP_URL || 'https://mcp-promps.onrender.com';
    console.log('🔐 Revocando refresh_token en MCP Server...');
    
    const response = await fetch(`${MCP_BASE_URL}/oauth/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${mcpAccessToken}`
      },
      body: new URLSearchParams({
        token: mcpRefreshToken,
        token_type_hint: 'refresh_token'
      })
    });
    
    if (response.ok) {
      console.log('✅ Refresh token de MCP revocado');
      return { status: 'success' };
    } else {
      return {
        status: 'error',
        message: 'Error al revocar refresh token de MCP'
      };
    }
  } catch (error) {
    console.error('❌ Error revocando refresh token de MCP:', error);
    return {
      status: 'error',
      message: 'Error de red'
    };
  }
}
```

**Criterios:**
- [ ] Función `revokeMCPRefreshToken()` existe
- [ ] Acepta dos parámetros: refresh_token y access_token
- [ ] Usa `token_type_hint=refresh_token`
- [ ] Maneja errores sin propagar excepciones

---

### CA4: Variables de entorno

**Ubicación:** `.env` o `.env.local`

**Configuración requerida:**

```env
# Backend de autenticación (Loggin-MCP)
VITE_API_URL=https://loggin-mcp.onrender.com

# MCP Server OAuth
VITE_MCP_URL=https://mcp-promps.onrender.com

# OAuth callback (ya existente)
VITE_MCP_CALLBACK=https://mcp-promps.onrender.com/oauth/callback
```

**Criterios:**
- [ ] Variable `VITE_API_URL` configurada con URL del Backend Login
- [ ] Variable `VITE_MCP_URL` configurada con URL del MCP Server
- [ ] Variables accesibles via `import.meta.env` en código
- [ ] Valores para desarrollo local también configurados (opcional)

---

### CA5: Función withTimeout helper

**Ubicación:** Dentro de `src/pages/Dashboard.tsx` (puede extraerse a utils después)

**Implementación:**

```typescript
/**
 * Ejecuta una promesa con timeout
 * Evita que el logout se bloquee indefinidamente
 * 
 * @param promise - Promesa a ejecutar
 * @param timeoutMs - Tiempo máximo en milisegundos
 * @returns Promesa que resuelve o rechaza por timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    )
  ]);
}
```

**Criterios:**
- [ ] Función `withTimeout` implementada
- [ ] Acepta una promesa genérica y un timeout en ms
- [ ] Usa `Promise.race()` para competir contra timeout
- [ ] Rechaza con Error('Timeout') si se excede el tiempo
- [ ] Tipo genérico `<T>` para reutilización

---

### CA6: Refactorización completa de handleLogout

**Ubicación:** `src/pages/Dashboard.tsx`

**Imports necesarios:**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { clearAuth, getToken } from '../lib/api';
```

**Estado adicional:**

```typescript
const [isLoggingOut, setIsLoggingOut] = useState(false);
```

**Función handleLogout completa:**

```typescript
/**
 * Logout completo: revoca tokens en AMBOS sistemas
 * 1. Backend de Login (Loggin-MCP) - revoca JWT
 * 2. MCP Server - revoca access_token y refresh_token OAuth
 * 
 * Al completar, VSCode pierde acceso al MCP inmediatamente.
 */
const handleLogout = async () => {
  setIsLoggingOut(true);
  
  console.log('🚪 ===== INICIANDO LOGOUT COMPLETO =====');
  
  // 1. Obtener todos los tokens almacenados
  const loginToken = localStorage.getItem('authToken');
  const mcpAccessToken = localStorage.getItem('mcp_access_token');
  const mcpRefreshToken = localStorage.getItem('mcp_refresh_token');
  
  let loginRevoked = false;
  let mcpRevoked = false;
  
  // 2. Revocar JWT del Backend de Login
  if (loginToken) {
    try {
      console.log('📡 Paso 1/3: Revocando JWT en Backend de Login...');
      const result = await withTimeout(
        authService.logout(loginToken),
        5000 // 5 segundos de timeout
      );
      
      if (result.status === 'success') {
        console.log('✅ JWT revocado correctamente');
        loginRevoked = true;
      } else {
        console.warn('⚠️ No se pudo revocar JWT:', result.message);
      }
    } catch (error) {
      console.error('❌ Error/Timeout revocando JWT:', error);
      // Continuar con el logout aunque falle
    }
  } else {
    console.log('ℹ️ No hay JWT del Backend de Login para revocar');
  }
  
  // 3. Revocar tokens de MCP Server
  if (mcpAccessToken) {
    try {
      // 3.1. Revocar refresh_token primero (más importante para seguridad)
      if (mcpRefreshToken) {
        console.log('📡 Paso 2/3: Revocando refresh_token de MCP...');
        await withTimeout(
          authService.revokeMCPRefreshToken(mcpRefreshToken, mcpAccessToken),
          5000
        ).catch(err => console.warn('⚠️ Error revocando refresh_token:', err));
      }
      
      // 3.2. Revocar access_token
      console.log('📡 Paso 3/3: Revocando access_token de MCP...');
      const result = await withTimeout(
        authService.revokeMCPToken(mcpAccessToken),
        5000
      );
      
      if (result.status === 'success') {
        console.log('✅ Access token de MCP revocado correctamente');
        mcpRevoked = true;
      } else {
        console.warn('⚠️ No se pudo revocar access_token de MCP:', result.message);
      }
    } catch (error) {
      console.error('❌ Error/Timeout revocando tokens de MCP:', error);
      // Continuar con el logout aunque falle
    }
  } else {
    console.log('ℹ️ No hay access_token de MCP para revocar');
  }
  
  // 4. Limpiar TODOS los datos del localStorage
  console.log('🧹 Limpiando almacenamiento local...');
  localStorage.removeItem('authToken');
  localStorage.removeItem('token_expires_at');
  localStorage.removeItem('user');
  localStorage.removeItem('mcp_access_token');
  localStorage.removeItem('mcp_refresh_token');
  localStorage.removeItem('mcp_token_expires_at');
  sessionStorage.removeItem('oauth_request');
  
  // También limpiar memoria (clearAuth de api.ts)
  clearAuth();
  
  // 5. Log del resultado
  if (loginRevoked && mcpRevoked) {
    console.log('✅ ===== LOGOUT COMPLETO EXITOSO =====');
    console.log('   JWT revocado: ✓');
    console.log('   MCP token revocado: ✓');
    console.log('   VSCode perderá acceso al MCP');
  } else if (loginRevoked || mcpRevoked) {
    console.log('🔶 ===== LOGOUT PARCIAL =====');
    console.log(`   JWT revocado: ${loginRevoked ? '✓' : '✗'}`);
    console.log(`   MCP token revocado: ${mcpRevoked ? '✓' : '✗'}`);
  } else {
    console.log('⚠️ ===== LOGOUT LOCAL SOLAMENTE =====');
    console.log('   No se pudieron revocar tokens remotos');
    console.log('   Tokens expirarán naturalmente');
  }
  
  setIsLoggingOut(false);
  
  // 6. Redirigir a login
  navigate('/login');
};
```

**Criterios:**
- [ ] Estado `isLoggingOut` controlado correctamente
- [ ] Extrae tokens de localStorage al inicio
- [ ] Variables `loginRevoked` y `mcpRevoked` para tracking
- [ ] Revoca JWT con timeout de 5s
- [ ] Revoca refresh_token de MCP con timeout de 5s (si existe)
- [ ] Revoca access_token de MCP con timeout de 5s
- [ ] Cada revocación en bloque try-catch individual
- [ ] NO detiene el proceso si falla una revocación
- [ ] Limpia 7 keys específicas de localStorage/sessionStorage
- [ ] Llama a `clearAuth()` de api.ts
- [ ] Loguea resultado final con emojis claros
- [ ] Setea `isLoggingOut=false` antes de navegar
- [ ] Siempre redirige a `/login` sin importar errores

---

### CA7: Actualización del botón de logout en Dashboard

**Ubicación:** `src/pages/Dashboard.tsx` - JSX del componente

**Implementación:**

```tsx
<Button 
  variant="ghost" 
  onClick={handleLogout}
  disabled={isLoggingOut}
  className={isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}
>
  {isLoggingOut ? (
    <>
      {/* Spinner SVG */}
      <svg className="animate-spin h-5 w-5 mr-2 inline-block" viewBox="0 0 24 24">
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4" 
          fill="none" 
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
        />
      </svg>
      Cerrando sesión...
    </>
  ) : (
    'Cerrar Sesión'
  )}
</Button>
```

**Criterios:**
- [ ] Botón deshabilitado cuando `isLoggingOut=true`
- [ ] Muestra spinner SVG durante logout
- [ ] Texto cambia a "Cerrando sesión..." durante proceso
- [ ] Clases de Tailwind para opacidad y cursor
- [ ] Spinner con animación `animate-spin`
- [ ] UI intuitiva que previene doble-clic

---

### CA8: Testing manual - Flujo completo exitoso

**Pre-requisitos:**
- Usuario logueado en Dashboard
- VSCode con MCP configurado y funcionando
- DevTools abierto en pestaña Console

**Pasos:**

1. **Verificar estado inicial:**
   - [ ] Abrir DevTools → Application → Local Storage
   - [ ] Confirmar existen: `authToken`, `mcp_access_token`, `user`
   - [ ] En VSCode usar comando con @mis-prompts
   - [ ] Confirmar que funciona correctamente

2. **Ejecutar logout:**
   - [ ] Hacer clic en botón "Cerrar Sesión"
   - [ ] Observar spinner y texto "Cerrando sesión..."
   - [ ] Botón deshabilitado durante proceso

3. **Verificar logs en consola:**
   - [ ] Ver mensaje: `🚪 ===== INICIANDO LOGOUT COMPLETO =====`
   - [ ] Ver mensaje: `📡 Paso 1/3: Revocando JWT en Backend de Login...`
   - [ ] Ver mensaje: `✅ JWT revocado correctamente`
   - [ ] Ver mensaje: `📡 Paso 2/3: Revocando refresh_token de MCP...`
   - [ ] Ver mensaje: `📡 Paso 3/3: Revocando access_token de MCP...`
   - [ ] Ver mensaje: `✅ Access token de MCP revocado correctamente`
   - [ ] Ver mensaje: `🧹 Limpiando almacenamiento local...`
   - [ ] Ver mensaje: `✅ ===== LOGOUT COMPLETO EXITOSO =====`

4. **Verificar limpieza:**
   - [ ] Verificar Local Storage vacío de keys de auth
   - [ ] Verificar Session Storage sin `oauth_request`

5. **Verificar redirección:**
   - [ ] Usuario redirigido a `/login`
   - [ ] URL es `http://localhost:5173/login` o producción

6. **Verificar revocación en VSCode:**
   - [ ] Volver a VSCode
   - [ ] Intentar usar comando con @mis-prompts
   - [ ] Debe mostrar error 401 o solicitar re-autenticación

---

### CA9: Testing manual - Resiliencia sin red

**Pasos:**

1. **Simular red caída:**
   - [ ] DevTools → Network → Throttling → Offline
   - [ ] Hacer logout

2. **Verificar comportamiento:**
   - [ ] Ver timeouts en consola
   - [ ] Ver mensaje: `⚠️ ===== LOGOUT LOCAL SOLAMENTE =====`
   - [ ] Confirmar localStorage limpio
   - [ ] Confirmar redirección a `/login`
   - [ ] Proceso no se bloquea indefinidamente

3. **Restaurar red:**
   - [ ] Throttling → Online
   - [ ] Intentar nuevo login
   - [ ] Debe funcionar normalmente

---

### CA10: Testing manual - Backend no disponible

**Pasos:**

1. **Simular backend caído:**
   - [ ] Detener backend temporalmente (o cambiar VITE_API_URL a URL inválida)
   - [ ] Hacer logout

2. **Verificar comportamiento:**
   - [ ] Timeout de 5s activado
   - [ ] Ver mensaje de error en consola
   - [ ] Logout local se completa
   - [ ] Redirección exitosa

---

### CA11: Despliegue y configuración

**Vercel (Producción):**

1. **Variables de entorno:**
   - [ ] En Vercel Dashboard → Settings → Environment Variables
   - [ ] Añadir `VITE_API_URL=https://loggin-mcp.onrender.com`
   - [ ] Añadir `VITE_MCP_URL=https://mcp-promps.onrender.com`
   - [ ] Añadir para todos los entornos (Production, Preview, Development)

2. **Re-deploy:**
   - [ ] Hacer commit del código
   - [ ] Push a main
   - [ ] Vercel auto-deploy
   - [ ] Verificar build exitoso

3. **Testing en producción:**
   - [ ] Abrir https://front-mcp-gules.vercel.app
   - [ ] Login con usuario real
   - [ ] Hacer logout
   - [ ] Verificar logs en consola
   - [ ] Verificar revocación funcionó

---

### CA12: Coordinación con equipo MCP Server

**Comunicación requerida:**

1. **Antes de implementar:**
   - [ ] Confirmar que endpoint `/oauth/revoke` está implementado
   - [ ] Confirmar formato de request esperado
   - [ ] Confirmar respuestas esperadas (200, 4xx, 5xx)

2. **Durante desarrollo:**
   - [ ] Notificar que frontend está listo
   - [ ] Coordinar testing conjunto
   - [ ] Compartir logs de errores si los hay

3. **Después de despliegue:**
   - [ ] Confirmar que revocación funciona end-to-end
   - [ ] Verificar que VSCode pierde acceso correctamente
   - [ ] Documentar cualquier issue encontrado

**Criterios:**
- [ ] Equipo MCP notificado del inicio de implementación
- [ ] Endpoint `/oauth/revoke` confirmado disponible
- [ ] Testing conjunto realizado
- [ ] Documentación de integración completada

## Trazabilidad

| Requisito | Archivo | Líneas | Estado | Notas |
|-----------|---------|--------|--------|-------|
| Método logout() | `src/services/authService.ts` | ~90-120 | ⏳ Pendiente | Revocar JWT en Backend Login |
| Método revokeMCPToken() | `src/services/authService.ts` | ~122-155 | ⏳ Pendiente | Revocar access_token MCP |
| Método revokeMCPRefreshToken() | `src/services/authService.ts` | ~157-185 | ⏳ Pendiente | Revocar refresh_token MCP |
| Función withTimeout() | `src/pages/Dashboard.tsx` | ~15-23 | ⏳ Pendiente | Helper para timeouts |
| Estado isLoggingOut | `src/pages/Dashboard.tsx` | ~12 | ⏳ Pendiente | Control de UI loading |
| handleLogout completo | `src/pages/Dashboard.tsx` | ~45-140 | ⏳ Pendiente | Lógica principal de logout dual |
| Actualización botón UI | `src/pages/Dashboard.tsx` | ~180-200 | ⏳ Pendiente | Spinner y estados |
| Variables de entorno | `.env` | N/A | ⏳ Pendiente | VITE_API_URL, VITE_MCP_URL |
| Vercel env vars | Vercel Dashboard | N/A | ⏳ Pendiente | Configuración en producción |
| Testing manual exitoso | TESTING.md | N/A | ⏳ Pendiente | Documento de validación |
| Testing resiliencia | TESTING.md | N/A | ⏳ Pendiente | Casos de error |
| Coordinación MCP | Slack/Email | N/A | ⏳ Pendiente | Comunicación con equipo |

### Archivos de referencia:

- **[PLAN_TRABAJO_FRONTEND.md](PLAN_TRABAJO_FRONTEND.md)** - Plan de trabajo original, 4 fases detalladas
- **[SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)** - Contexto de mejoras de seguridad
- **[src/services/authService.ts](src/services/authService.ts)** - Servicio actual de autenticación
- **[src/lib/api.ts](src/lib/api.ts)** - Cliente HTTP y funciones de token
- **[src/pages/Dashboard.tsx](src/pages/Dashboard.tsx)** - Componente con botón de logout

### Dependencias externas:

- **Backend Login:** https://loggin-mcp.onrender.com (endpoint `/auth/logout` disponible)
- **MCP Server:** https://mcp-promps.onrender.com (endpoint `/oauth/revoke` en desarrollo)
- **Frontend Prod:** https://front-mcp-gules.vercel.app

### Métricas de éxito:

- ✅ Tiempo de logout < 6 segundos (con red normal)
- ✅ 0% bloqueos indefinidos de UI
- ✅ 100% limpieza de localStorage tras logout
- ✅ 100% redirección a /login tras logout
- ✅ VSCode pierde acceso inmediatamente tras logout exitoso
- ✅ Logout local funciona al 100% aunque fallen revocaciones remotas

---

**Especificación completada:** 18 de marzo de 2026  
**Tiempo estimado de implementación:** 4 horas (según PLAN_TRABAJO_FRONTEND.md)  
**Prioridad:** 🔴 CRÍTICA  
**Estado:** ✅ Listo para ejecución

---

## Anexo A: Orden de ejecución sugerido

1. **Setup inicial (15 min):**
   - Actualizar archivo `.env` con variables

2. **Implementar servicios (45 min):**
   - Añadir método `logout()` en authService.ts
   - Añadir método `revokeMCPToken()` en authService.ts  
   - Añadir método `revokeMCPRefreshToken()` en authService.ts
   - Commit: "feat: add token revocation services"

3. **Refactorizar Dashboard (90 min):**
   - Añadir función `withTimeout()`
   - Añadir estado `isLoggingOut`
   - Refactorizar `handleLogout()` completo
   - Actualizar botón con spinner
   - Commit: "feat: implement dual logout with token revocation"

4. **Testing local (45 min):**
   - Ejecutar flujo completo exitoso
   - Probar sin red
   - Probar con backend caído
   - Documentar resultados

5. **Despliegue (30 min):**
   - Configurar variables en Vercel
   - Merge a main
   - Verificar deploy exitoso
   - Testing en producción

6. **Coordinación (15 min):**
   - Notificar equipo MCP Server
   - Compartir logs
   - Documentar cualquier issue

**Total:** ~4 horas
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

