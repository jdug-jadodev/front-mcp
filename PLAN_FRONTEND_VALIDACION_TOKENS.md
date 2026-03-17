# 🎨 Plan de Trabajo Frontend — Validación de Tokens

**Fecha:** 17 de Marzo, 2026  
**Responsable:** Equipo Frontend  
**Referencia técnica:** [SOLUCION_BUG_TOKENS.md](SOLUCION_BUG_TOKENS.md)

---

## 📌 Contexto

Actualmente, cuando un usuario hace clic en el enlace del correo (crear o restablecer contraseña), las páginas `/create-password` y `/reset-password` muestran el formulario inmediatamente **sin verificar si el token es válido**. Esto causa que el usuario llene el formulario y recién al enviarlo descubre que el token expiró o ya fue usado.

**Tu trabajo:** Antes de mostrar el formulario, llamar al nuevo endpoint del backend para validar el token. Mostrar el formulario solo si el token es válido; de lo contrario, mostrar un mensaje informativo.

---

## 📐 Contrato de API

> Este contrato está acordado con el equipo backend. Consúltalo antes de desarrollar.

### Endpoint que consumirás

```
GET {API_BASE_URL}/auth/validate-token?token={TOKEN}&type={TYPE}
```

| Parámetro | Tipo | Obligatorio | Valores posibles |
|-----------|------|-------------|-----------------|
| `token` | `string` (query) | Sí | El JWT que viene en la URL (`?token=...`) |
| `type` | `string` (query) | Sí | `password_creation` \| `password_reset` |

> **Importante:** Usa `encodeURIComponent(token)` al construir la URL, ya que los JWT contienen caracteres especiales.

### Respuestas que recibirás

#### ✅ Token válido — `200 OK`

```json
{
  "status": "success",
  "data": {
    "valid": true,
    "status": "valid",
    "message": "Token is valid and ready to be used",
    "email": "usuario@ejemplo.com"
  }
}
```

**Acción:** Mostrar formulario de contraseña. Usar `data.email` para mostrar a qué correo corresponde.

---

#### ❌ Token expirado — `200 OK`

```json
{
  "status": "success",
  "data": {
    "valid": false,
    "status": "expired",
    "message": "This token has expired. Please request a new one."
  }
}
```

**Acción:** Mostrar pantalla de "Enlace expirado" + botón para solicitar nuevo enlace.

---

#### ❌ Token ya usado — `200 OK`

```json
{
  "status": "success",
  "data": {
    "valid": false,
    "status": "used",
    "message": "This token has already been used. Please request a new one."
  }
}
```

**Acción:** Mostrar pantalla de "Enlace ya utilizado" + botón para ir al login.

---

#### ❌ Token no encontrado — `200 OK`

```json
{
  "status": "success",
  "data": {
    "valid": false,
    "status": "not_found",
    "message": "Token not found. It may have been deleted or never existed."
  }
}
```

**Acción:** Mostrar pantalla de "Enlace inválido".

---

#### ❌ Tipo incorrecto — `200 OK`

```json
{
  "status": "success",
  "data": {
    "valid": false,
    "status": "invalid_type",
    "message": "This token cannot be used for this operation."
  }
}
```

**Acción:** Mostrar pantalla de "Enlace inválido".

---

#### ❌ Error de red / Error del servidor

Si la petición falla (500, timeout, sin conexión), tratar como error genérico.

**Acción:** Mostrar "Ocurrió un error verificando el enlace. Intenta de nuevo."

---

## ✅ Tareas

### Tarea F1 — Crear servicio de validación de token

**Qué hacer:** Crear una función reutilizable que llame al endpoint de validación.

**Interface de respuesta:**

```typescript
interface TokenValidationResult {
  valid: boolean;
  status: 'valid' | 'expired' | 'used' | 'not_found' | 'invalid_type' | 'error';
  message: string;
  email?: string;
}
```

**Función:**

```typescript
async function validatePasswordToken(
  token: string,
  type: 'password_creation' | 'password_reset'
): Promise<TokenValidationResult> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/auth/validate-token?token=${encodeURIComponent(token)}&type=${type}`
    );
    const json = await response.json();

    if (response.ok && json.status === 'success') {
      return json.data;
    }

    return {
      valid: false,
      status: 'error',
      message: json.message || 'Error validating token'
    };
  } catch (error) {
    return {
      valid: false,
      status: 'error',
      message: 'Network error. Please check your connection and try again.'
    };
  }
}
```

**Notas:**
- Usa `encodeURIComponent(token)` siempre.
- Si la petición falla por red, retorna `status: 'error'`.
- Adapta `API_BASE_URL` a tu configuración (ej: `import.meta.env.VITE_API_URL`).

---

### Tarea F2 — Modificar página `/create-password`

**Qué hacer:** Agregar validación del token al montar la página, antes de mostrar el formulario.

**Flujo de estados:**

```
URL: /create-password?token=eyJhbG...

  ┌───────────────────────┐
  │ ¿Hay token en la URL? │
  └───────┬───────────────┘
          │
    NO ───┤──── SÍ
    │           │
    ▼           ▼
  Pantalla:   Estado: "validating"
  "Enlace     Mostrar spinner o skeleton
  inválido"   Llamar: validatePasswordToken(token, 'password_creation')
                    │
                    ├─── valid=true ──────► Mostrar formulario
                    │                        Mostrar: "Creando contraseña para {email}"
                    │
                    ├─── status=expired ──► Pantalla: "El enlace expiró"
                    │                        Botón → /forgot-password
                    │
                    ├─── status=used ─────► Pantalla: "Enlace ya utilizado"
                    │                        Botón → /login
                    │
                    └─── otros ───────────► Pantalla: "Enlace inválido"
                                             Botón → /login
```

**Pseudocódigo:**

```typescript
function CreatePasswordPage() {
  const token = useSearchParams().get('token');
  const [status, setStatus] = useState<TokenStatus>('validating');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('not_found');
      setMessage('No se proporcionó un token en la URL.');
      return;
    }

    validatePasswordToken(token, 'password_creation').then((result) => {
      if (result.valid) {
        setStatus('valid');
        setEmail(result.email || '');
      } else {
        setStatus(result.status);
        setMessage(result.message);
      }
    });
  }, [token]);

  // Renderizar según status...
}
```

**Al enviar el formulario** (esto ya debería existir, no cambia):

```
POST /auth/create-password
Body: { "token": "...", "password": "..." }
```

---

### Tarea F3 — Modificar página `/reset-password`

**Qué hacer:** Mismo patrón que F2, pero con `type: 'password_reset'`.

**Flujo de estados:**

```
URL: /reset-password?token=eyJhbG...

  ┌───────────────────────┐
  │ ¿Hay token en la URL? │
  └───────┬───────────────┘
          │
    NO ───┤──── SÍ
    │           │
    ▼           ▼
  Pantalla:   Estado: "validating"
  "Enlace     Mostrar spinner o skeleton
  inválido"   Llamar: validatePasswordToken(token, 'password_reset')
                    │
                    ├─── valid=true ──────► Mostrar formulario
                    │                        Mostrar: "Restableciendo contraseña para {email}"
                    │
                    ├─── status=expired ──► Pantalla: "El enlace expiró"
                    │                        Botón → /forgot-password
                    │
                    ├─── status=used ─────► Pantalla: "Enlace ya utilizado"
                    │                        Botón → /login
                    │
                    └─── otros ───────────► Pantalla: "Enlace inválido"
                                             Botón → /login
```

**Al enviar el formulario** (esto ya debería existir, no cambia):

```
POST /auth/reset-password
Body: { "token": "...", "newPassword": "..." }
```

---

### Tarea F4 — Diseñar pantallas de estado

**Qué hacer:** Crear los componentes visuales para cada estado. Se recomienda un componente reutilizable.

**Componente sugerido:** `<TokenStatusScreen />`

```typescript
interface TokenStatusScreenProps {
  status: 'validating' | 'expired' | 'used' | 'not_found' | 'error';
  type: 'password_creation' | 'password_reset';
}
```

**Diseño de cada estado:**

#### Estado: `validating`

| Elemento | Valor |
|----------|-------|
| Icono | Spinner / Loading |
| Color | Azul / Neutro |
| Texto | "Verificando enlace..." |
| Acción | Ninguna (loading) |

#### Estado: `expired`

| Elemento | Valor |
|----------|-------|
| Icono | ⏰ Reloj |
| Color | Naranja / Warning |
| Título | "Enlace expirado" |
| Texto | "El enlace que recibiste ha expirado. Solicita uno nuevo." |
| Botón principal | "Solicitar nuevo enlace" → Navega a `/forgot-password` |
| Botón secundario | "Volver al inicio" → Navega a `/login` |

#### Estado: `used`

| Elemento | Valor |
|----------|-------|
| Icono | ✅ Check |
| Color | Verde / Info |
| Título | "Enlace ya utilizado" |
| Texto (create) | "Este enlace ya fue usado para crear tu contraseña. Intenta iniciar sesión." |
| Texto (reset) | "Este enlace ya fue usado para restablecer tu contraseña. Intenta iniciar sesión." |
| Botón principal | "Ir al login" → Navega a `/login` |

#### Estado: `not_found` / `error`

| Elemento | Valor |
|----------|-------|
| Icono | ❌ Error |
| Color | Rojo / Danger |
| Título | "Enlace inválido" |
| Texto | "El enlace no es válido o ya no existe." |
| Botón principal | "Volver al inicio" → Navega a `/login` |
| (Solo si error de red) | "Reintentar" → Volver a llamar al endpoint |

---

### Tarea F5 — Pruebas end-to-end

Probar los siguientes escenarios una vez que el backend esté desplegado:

#### Escenario 1: Flujo de registro completo

```
1. Registrar un email nuevo         → POST /auth/register-email
2. Abrir el enlace del correo       → /create-password?token=...
3. Verificar que muestra spinner     → "Verificando enlace..."
4. Verificar que muestra formulario  → Con el email del usuario
5. Crear contraseña                  → POST /auth/create-password
6. Verificar redirección al login
7. Login exitoso
```

#### Escenario 2: Token expirado

```
1. Obtener un token de password_creation viejo (de BD o esperar expiración)
2. Abrir /create-password?token=TOKEN_VIEJO
3. Verificar que muestra "Enlace expirado"
4. Verificar que botón "Solicitar nuevo enlace" navega a /forgot-password
```

#### Escenario 3: Token ya usado

```
1. Completar un flujo de registro (crear contraseña con un token)
2. Volver a abrir el mismo enlace del correo
3. Verificar que muestra "Enlace ya utilizado"
4. Verificar que botón "Ir al login" navega a /login
```

#### Escenario 4: Sin token en la URL

```
1. Abrir /create-password (sin ?token=)
2. Verificar que muestra "Enlace inválido"
```

#### Escenario 5: Flujo de recuperación completo

```
1. Solicitar recuperación             → POST /auth/forgot-password
2. Abrir el enlace del correo         → /reset-password?token=...
3. Verificar que muestra spinner       → "Verificando enlace..."
4. Verificar que muestra formulario    → Con el email del usuario
5. Restablecer contraseña             → POST /auth/reset-password
6. Verificar redirección al login
7. Login exitoso con nueva contraseña
```

---

## 📊 Resumen de Archivos

| Archivo | Acción |
|---------|--------|
| Servicio de API (ej: `src/services/auth.ts`) | **Crear/Modificar** — Agregar función `validatePasswordToken` |
| Página `/create-password` | **Modificar** — Agregar validación al montar |
| Página `/reset-password` | **Modificar** — Agregar validación al montar |
| Componente `TokenStatusScreen` (o similar) | **Crear** — Pantallas de loading, expired, used, invalid |

---

## ✅ Criterios de Aceptación

- [ ] Al abrir `/create-password?token=TOKEN_VALIDO` se muestra "Verificando..." y luego el formulario con el email.
- [ ] Al abrir `/create-password?token=TOKEN_EXPIRADO` se muestra "Enlace expirado" con botón a `/forgot-password`.
- [ ] Al abrir `/create-password?token=TOKEN_USADO` se muestra "Ya utilizado" con botón a `/login`.
- [ ] Al abrir `/create-password` (sin token) se muestra "Enlace inválido".
- [ ] Al abrir `/reset-password?token=TOKEN_VALIDO` se muestra "Verificando..." y luego el formulario.
- [ ] Al abrir `/reset-password?token=TOKEN_EXPIRADO` se muestra "Enlace expirado".
- [ ] Flujo completo de registro funciona: registrar → email → crear contraseña → login.
- [ ] Flujo completo de recuperación funciona: forgot → email → reset → login.

---

## ⚠️ Notas Importantes

- **No decodifiques el JWT en el frontend** para obtener el email. Usa siempre la respuesta del endpoint de validación. Es más seguro y consistente.
- **Siempre usa `encodeURIComponent(token)`** al poner el token en la URL del fetch.
- Todos los estados de "token inválido" retornan **HTTP 200** (no 400 ni 500). Solo errores de parámetros faltantes retornan 400.
- Los formularios de `POST /auth/create-password` y `POST /auth/reset-password` **no cambian**. Solo se agrega la validación previa.
- El spinner de "Verificando..." debe ser breve (la validación típica toma <500ms). No necesitas un timeout largo.

---

## 🔗 Dependencia con Backend

Este trabajo requiere que el endpoint `GET /auth/validate-token` esté disponible.

**Puedes empezar en paralelo:**
- F1 (servicio) y F4 (componentes de estado) los puedes desarrollar usando datos mock.
- F2 y F3 necesitan el endpoint real para la integración final.
- F5 (pruebas) requiere el endpoint desplegado.

**Coordina con backend:**
- Pide confirmación de que el endpoint está disponible en el entorno de desarrollo/staging.
- Si necesitan hacer cambios al contrato, ambos equipos deben estar de acuerdo.
