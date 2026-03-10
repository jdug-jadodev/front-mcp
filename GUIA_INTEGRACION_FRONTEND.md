# 🎨 Guía de Integración Frontend

**Microservicio de Autenticación - Loggin-MCP**

> Documentación completa para que el equipo frontend integre los endpoints de autenticación y configure las pantallas con las redirecciones esperadas.

---

## 📋 Tabla de Contenidos

1. [Información General](#información-general)
2. [Configuración Base](#configuración-base)
3. [Flujos de Usuario](#flujos-de-usuario)
4. [Endpoints API](#endpoints-api)
5. [Pantallas Requeridas](#pantallas-requeridas)
6. [Manejo de Tokens](#manejo-de-tokens)
7. [Códigos de Error](#códigos-de-error)
8. [Ejemplos de Código](#ejemplos-de-código)
9. [Checklist de Implementación](#checklist-de-implementación)

---

## 📡 Información General

| Propiedad | Valor |
|-----------|-------|
| **Base URL** | `http://localhost:4000` (desarrollo) |
| **Content-Type** | `application/json` |
| **Autenticación** | Bearer Token (JWT) |
| **Duración del Token** | 15 horas |

### Headers Requeridos

```javascript
// Para endpoints públicos
const headers = {
  'Content-Type': 'application/json'
};

// Para endpoints protegidos (admin)
const headersAuth = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};
```

---

## ⚙️ Configuración Base

### Variables de Entorno Frontend

```env
# URL del backend
VITE_API_URL=http://localhost:3000

# Rutas internas de la app
VITE_LOGIN_PATH=/login
VITE_CREATE_PASSWORD_PATH=/create-password
VITE_RESET_PASSWORD_PATH=/reset-password
VITE_DASHBOARD_PATH=/dashboard
```

### Configuración de Axios/Fetch

```javascript
// api.js - Configuración base
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = {
  baseURL: API_URL,
  
  async post(endpoint, data, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};
```

---

## 🔄 Flujos de Usuario

### Flujo 1: Usuario Nuevo (Primera Vez)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Admin registra │────▶│ Usuario recibe  │────▶│ Usuario crea    │
│  email          │     │ email con link  │     │ contraseña      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Dashboard     │◀────│    Login        │◀────│  Redirige a     │
│                 │     │                 │     │  /login         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Pasos detallados:**

1. **Admin** usa endpoint `/auth/register-email` para registrar nuevo usuario
2. **Sistema** envía email automático con link: `{APP_BASE_URL}/create-password?token=xxx`
3. **Usuario** hace clic en el link → Frontend extrae el `token` de la URL
4. **Usuario** ingresa contraseña en formulario → Frontend llama `/auth/create-password`
5. **Sistema** responde éxito → Frontend redirige a `/login`
6. **Usuario** hace login → Frontend guarda token → Redirige a `/dashboard`

### Flujo 2: Login Normal

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Pantalla       │────▶│ POST /login     │────▶│ Guardar token   │
│  Login          │     │                 │     │ en localStorage │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │   Dashboard     │
                                                │                 │
                                                └─────────────────┘
```

### Flujo 3: Recuperación de Contraseña

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Usuario olvida  │────▶│ POST /forgot-   │────▶│ Email con link  │
│ contraseña      │     │ password        │     │ (válido 15 min) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   /login        │◀────│ POST /reset-    │◀────│ Formulario      │
│  (redirigir)    │     │ password        │     │ nueva contraseña│
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 🌐 Endpoints API

### 1. Verificar Email

Verifica si un email existe y si ya tiene contraseña.

| Propiedad | Valor |
|-----------|-------|
| **URL** | `POST /auth/check-email` |
| **Auth** | No requerida |
| **Uso** | Validar email antes de mostrar formulario de login o crear contraseña |

**Request:**
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Response 200 (existe):**
```json
{
  "status": "success",
  "exists": true,
  "hasPassword": true,
  "email": "usuario@ejemplo.com"
}
```

**Response 200 (no tiene contraseña):**
```json
{
  "status": "success",
  "exists": true,
  "hasPassword": false,
  "email": "usuario@ejemplo.com"
}
```

**Response 404 (no existe):**
```json
{
  "status": "error",
  "message": "Email not found",
  "code": "EMAIL_NOT_FOUND",
  "timestamp": "2026-03-10T..."
}
```

**Lógica Frontend:**
```javascript
async function handleCheckEmail(email) {
  const result = await api.post('/auth/check-email', { email });
  
  if (result.status === 'error') {
    // Email no registrado - mostrar error
    showError('Email no registrado en el sistema');
    return;
  }
  
  if (result.exists && result.hasPassword) {
    // Mostrar formulario de login
    showLoginForm();
  } else if (result.exists && !result.hasPassword) {
    // Usuario necesita crear contraseña primero
    showMessage('Revisa tu correo para crear tu contraseña');
  }
}
```

---

### 2. Crear Contraseña

Permite a un usuario nuevo crear su contraseña por primera vez.

| Propiedad | Valor |
|-----------|-------|
| **URL** | `POST /auth/create-password` |
| **Auth** | No requerida (el token viene del email) |
| **Uso** | Pantalla `/create-password?token=xxx` |

**Request (con token del email):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "password": "MiContraseña123"
}
```

**Request alternativo (legacy, sin token):**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "MiContraseña123"
}
```

**Response 201 (éxito):**
```json
{
  "status": "success",
  "userId": "uuid-del-usuario",
  "email": "usuario@ejemplo.com",
  "message": "Password created successfully"
}
```

**Response 400 (contraseña débil):**
```json
{
  "status": "error",
  "message": "Password must be at least 8 characters long",
  "code": "WEAK_PASSWORD",
  "timestamp": "2026-03-10T..."
}
```

**Response 409 (ya tiene contraseña):**
```json
{
  "status": "error",
  "message": "User already has a password",
  "code": "ALREADY_HAS_PASSWORD",
  "timestamp": "2026-03-10T..."
}
```

**Validaciones de Contraseña:**
| Regla | Descripción |
|-------|-------------|
| Mínimo 8 caracteres | `password.length >= 8` |
| Máximo 72 caracteres | `password.length <= 72` |
| Al menos 1 mayúscula | `/[A-Z]/.test(password)` |
| Al menos 1 minúscula | `/[a-z]/.test(password)` |
| Al menos 1 número | `/[0-9]/.test(password)` |
| No contener el email | `!password.includes(email)` |

**Lógica Frontend:**
```javascript
// En la pantalla /create-password
async function handleCreatePassword() {
  // Extraer token de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (!token) {
    showError('Token inválido o expirado');
    redirect('/login');
    return;
  }
  
  const result = await api.post('/auth/create-password', {
    token,
    password: passwordInput.value
  });
  
  if (result.status === 'success') {
    showSuccess('Contraseña creada exitosamente');
    redirect('/login');
  } else {
    showError(result.message);
  }
}
```

---

### 3. Login

Autentica al usuario y devuelve un JWT.

| Propiedad | Valor |
|-----------|-------|
| **URL** | `POST /auth/login` |
| **Auth** | No requerida |
| **Uso** | Pantalla `/login` |

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "MiContraseña123"
}
```

**Response 200 (éxito):**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "uuid-del-usuario",
    "email": "usuario@ejemplo.com"
  },
  "expiresIn": "15h"
}
```

**Response 401 (credenciales inválidas):**
```json
{
  "status": "error",
  "message": "Invalid credentials",
  "code": "INVALID_CREDENTIALS",
  "timestamp": "2026-03-10T..."
}
```

**Lógica Frontend:**
```javascript
async function handleLogin(email, password) {
  const result = await api.post('/auth/login', { email, password });
  
  if (result.status === 'success') {
    // Guardar token
    localStorage.setItem('authToken', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    
    // Redirigir al dashboard
    redirect('/dashboard');
  } else {
    showError('Credenciales incorrectas');
  }
}
```

---

### 4. Registrar Email (Solo Admin)

Registra un nuevo usuario y envía email de bienvenida.

| Propiedad | Valor |
|-----------|-------|
| **URL** | `POST /auth/register-email` |
| **Auth** | Requerida (Bearer Token de admin) |
| **Uso** | Panel de administración |

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Request:**
```json
{
  "email": "nuevo.usuario@ejemplo.com"
}
```

**Response 201 (éxito):**
```json
{
  "status": "success",
  "userId": "uuid-del-nuevo-usuario",
  "email": "nuevo.usuario@ejemplo.com",
  "message": "User created and email sent",
  "emailSent": true
}
```

**Response 409 (email ya existe):**
```json
{
  "status": "error",
  "message": "Email already registered",
  "code": "EMAIL_ALREADY_EXISTS"
}
```

**Response 401 (no autenticado):**
```json
{
  "status": "error",
  "message": "No authorization token provided",
  "code": "UNAUTHORIZED"
}
```

**Response 403 (no es admin):**
```json
{
  "status": "error",
  "message": "Access denied. Admin privileges required",
  "code": "FORBIDDEN"
}
```

**Lógica Frontend (Panel Admin):**
```javascript
async function handleRegisterUser(email) {
  const token = localStorage.getItem('authToken');
  
  const result = await api.post('/auth/register-email', 
    { email },
    { headers: { 'Authorization': `Bearer ${token}` }}
  );
  
  if (result.status === 'success') {
    showSuccess(`Usuario ${email} registrado. Se envió email de bienvenida.`);
  } else if (result.code === 'EMAIL_ALREADY_EXISTS') {
    showError('Este email ya está registrado');
  } else if (result.code === 'FORBIDDEN') {
    showError('No tienes permisos de administrador');
  }
}
```

---

### 5. Olvidé mi Contraseña

Solicita un email para restablecer la contraseña.

| Propiedad | Valor |
|-----------|-------|
| **URL** | `POST /auth/forgot-password` |
| **Auth** | No requerida |
| **Uso** | Pantalla `/forgot-password` |

**Request:**
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Response 200 (siempre éxito por seguridad):**
```json
{
  "status": "success",
  "message": "If the email exists, you will receive recovery instructions",
  "emailSent": true
}
```

> ⚠️ **Nota de Seguridad:** Este endpoint siempre retorna 200, incluso si el email no existe. Esto evita que atacantes descubran qué emails están registrados.

**Lógica Frontend:**
```javascript
async function handleForgotPassword(email) {
  const result = await api.post('/auth/forgot-password', { email });
  
  // Siempre mostrar mensaje de éxito (por seguridad)
  showSuccess('Si el email existe, recibirás instrucciones para restablecer tu contraseña');
  
  // Redirigir a login después de unos segundos
  setTimeout(() => redirect('/login'), 3000);
}
```

---

### 6. Restablecer Contraseña

Cambia la contraseña usando el token del email.

| Propiedad | Valor |
|-----------|-------|
| **URL** | `POST /auth/reset-password` |
| **Auth** | No requerida (el token viene del email) |
| **Uso** | Pantalla `/reset-password?token=xxx` |

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "newPassword": "MiNuevaContraseña456"
}
```

**Response 200 (éxito):**
```json
{
  "status": "success",
  "message": "Password updated"
}
```

**Response 400 (token inválido/expirado):**
```json
{
  "status": "error",
  "message": "Token invalid or expired",
  "code": "INVALID_TOKEN"
}
```

**Response 400 (token ya usado):**
```json
{
  "status": "error",
  "message": "Token already used",
  "code": "TOKEN_ALREADY_USED"
}
```

**Response 400 (contraseña débil):**
```json
{
  "status": "error",
  "message": "Password must be at least 8 characters long",
  "code": "WEAK_PASSWORD"
}
```

**Lógica Frontend:**
```javascript
// En la pantalla /reset-password
async function handleResetPassword() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (!token) {
    showError('Token inválido o expirado');
    redirect('/login');
    return;
  }
  
  const result = await api.post('/auth/reset-password', {
    token,
    newPassword: newPasswordInput.value
  });
  
  if (result.status === 'success') {
    showSuccess('Contraseña actualizada exitosamente');
    redirect('/login');
  } else if (result.code === 'INVALID_TOKEN') {
    showError('El enlace ha expirado. Solicita uno nuevo.');
    redirect('/forgot-password');
  } else if (result.code === 'TOKEN_ALREADY_USED') {
    showError('Este enlace ya fue utilizado');
    redirect('/login');
  } else {
    showError(result.message);
  }
}
```

---

## 📱 Pantallas Requeridas

### Mapa de Rutas

| Ruta | Pantalla | Auth | Descripción |
|------|----------|------|-------------|
| `/login` | Login | No | Formulario de inicio de sesión |
| `/forgot-password` | Olvidé Contraseña | No | Solicitar email de recuperación |
| `/create-password` | Crear Contraseña | No* | Primera vez (token en URL) |
| `/reset-password` | Restablecer | No* | Cambiar contraseña (token en URL) |
| `/dashboard` | Dashboard | Sí | Página principal autenticada |
| `/admin/users` | Gestión Usuarios | Sí (Admin) | Registrar nuevos usuarios |

*Requieren token válido en la URL

### 1. Pantalla de Login (`/login`)

**Componentes:**
- Input email
- Input password (con toggle mostrar/ocultar)
- Botón "Iniciar Sesión"
- Link "¿Olvidaste tu contraseña?" → `/forgot-password`

**Validaciones Frontend:**
```javascript
const validateLogin = (email, password) => {
  const errors = {};
  
  if (!email) errors.email = 'Email requerido';
  if (!password) errors.password = 'Contraseña requerida';
  if (email && !isValidEmail(email)) errors.email = 'Email inválido';
  
  return errors;
};
```

**Flujo:**
1. Usuario ingresa credenciales
2. Click en "Iniciar Sesión"
3. **Si éxito:** Guardar token → Redirigir a `/dashboard`
4. **Si error:** Mostrar mensaje de error

---

### 2. Pantalla Olvidé Contraseña (`/forgot-password`)

**Componentes:**
- Input email
- Botón "Enviar instrucciones"
- Link "Volver al login" → `/login`

**Flujo:**
1. Usuario ingresa email
2. Click en "Enviar"
3. Mostrar mensaje: "Si el email existe, recibirás instrucciones"
4. Redirigir a `/login` después de 3 segundos

---

### 3. Pantalla Crear Contraseña (`/create-password?token=xxx`)

**Componentes:**
- Mensaje de bienvenida
- Input nueva contraseña
- Input confirmar contraseña
- Indicador de fortaleza de contraseña
- Lista de requisitos de contraseña
- Botón "Crear contraseña"

**Validaciones Frontend:**
```javascript
const validatePassword = (password, confirmPassword) => {
  const errors = {};
  
  if (password.length < 8) 
    errors.password = 'Mínimo 8 caracteres';
  if (!/[A-Z]/.test(password)) 
    errors.password = 'Debe tener al menos una mayúscula';
  if (!/[a-z]/.test(password)) 
    errors.password = 'Debe tener al menos una minúscula';
  if (!/[0-9]/.test(password)) 
    errors.password = 'Debe tener al menos un número';
  if (password !== confirmPassword) 
    errors.confirmPassword = 'Las contraseñas no coinciden';
  
  return errors;
};
```

**Flujo:**
1. Extraer token de URL al cargar página
2. Si no hay token → Redirigir a `/login` con error
3. Usuario ingresa contraseña
4. Click en "Crear"
5. **Si éxito:** Mostrar mensaje → Redirigir a `/login`
6. **Si token expirado:** Mostrar error → Contactar admin

---

### 4. Pantalla Restablecer Contraseña (`/reset-password?token=xxx`)

**Componentes:**
- Input nueva contraseña
- Input confirmar contraseña
- Indicador de fortaleza
- Botón "Cambiar contraseña"
- Mensaje: "El enlace expira en 15 minutos"

**Flujo:**
1. Extraer token de URL
2. Si no hay token → Redirigir a `/forgot-password`
3. Usuario ingresa nueva contraseña
4. Click en "Cambiar"
5. **Si éxito:** Redirigir a `/login`
6. **Si token expirado/usado:** Redirigir a `/forgot-password`

---

### 5. Panel Admin - Registrar Usuario (`/admin/users`)

**Componentes:**
- Input email del nuevo usuario
- Botón "Registrar Usuario"
- Tabla de usuarios registrados (opcional)

**Flujo:**
1. Admin ingresa email
2. Click en "Registrar"
3. **Si éxito:** Mostrar confirmación
4. **Si email duplicado:** Mostrar error

---

## 🔐 Manejo de Tokens

### Almacenamiento

```javascript
// Guardar token después del login
const saveAuth = (token, user) => {
  localStorage.setItem('authToken', token);
  localStorage.setItem('user', JSON.stringify(user));
};

// Obtener token
const getToken = () => localStorage.getItem('authToken');

// Obtener usuario
const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Limpiar sesión (logout)
const clearAuth = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};
```

### Verificación de Sesión

```javascript
// Hook o función para verificar si el usuario está autenticado
const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  
  // Verificar si el token no ha expirado (lado cliente)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // convertir a milliseconds
    return Date.now() < exp;
  } catch {
    return false;
  }
};
```

### Interceptor para Requests Autenticados

```javascript
// Interceptor que agrega token automáticamente
const authFetch = async (url, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, { ...options, headers });
  
  // Si recibimos 401, limpiar sesión y redirigir
  if (response.status === 401) {
    clearAuth();
    window.location.href = '/login';
    return;
  }
  
  return response.json();
};
```

### Protección de Rutas

```javascript
// React Router ejemplo
const PrivateRoute = ({ children }) => {
  const authenticated = isAuthenticated();
  
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Uso
<Route 
  path="/dashboard" 
  element={
    <PrivateRoute>
      <Dashboard />
    </PrivateRoute>
  } 
/>
```

---

## ❌ Códigos de Error

| Código | HTTP | Descripción | Acción Frontend |
|--------|------|-------------|-----------------|
| `MISSING_FIELD` | 400 | Campo requerido faltante | Mostrar qué campo falta |
| `MISSING_FIELDS` | 400 | Múltiples campos faltantes | Mostrar lista de campos |
| `WEAK_PASSWORD` | 400 | Contraseña no cumple requisitos | Mostrar requisitos |
| `EMAIL_NOT_FOUND` | 404 | Email no registrado | "Email no encontrado" |
| `INVALID_CREDENTIALS` | 401 | Email o contraseña incorrectos | "Credenciales incorrectas" |
| `UNAUTHORIZED` | 401 | No hay token o es inválido | Redirigir a login |
| `TOKEN_EXPIRED` | 401 | Token JWT expirado | Redirigir a login |
| `INVALID_TOKEN` | 400/401 | Token malformado o inválido | Redirigir según contexto |
| `TOKEN_ALREADY_USED` | 400 | Token de un solo uso ya usado | "Enlace ya utilizado" |
| `ALREADY_HAS_PASSWORD` | 409 | Usuario ya tiene contraseña | Redirigir a login |
| `EMAIL_ALREADY_EXISTS` | 409 | Email ya registrado (admin) | "Email ya existe" |
| `FORBIDDEN` | 403 | Sin permisos de admin | "Acceso denegado" |
| `INTERNAL_ERROR` | 500 | Error del servidor | "Error interno, intenta más tarde" |

---

## 💻 Ejemplos de Código

### Servicio de Autenticación Completo

```javascript
// services/authService.js
const API_URL = import.meta.env.VITE_API_URL;

export const authService = {
  async checkEmail(email) {
    const res = await fetch(`${API_URL}/auth/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async createPassword(token, password) {
    const res = await fetch(`${API_URL}/auth/create-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    return res.json();
  },

  async forgotPassword(email) {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async resetPassword(token, newPassword) {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    return res.json();
  },

  async registerEmail(email, adminToken) {
    const res = await fetch(`${API_URL}/auth/register-email`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ email })
    });
    return res.json();
  }
};
```

### Componente de Login (React)

```jsx
// components/LoginForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.login(email, password);

      if (result.status === 'success') {
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        navigate('/dashboard');
      } else {
        setError(result.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Iniciar Sesión</h1>
      
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Cargando...' : 'Iniciar Sesión'}
      </button>
      
      <a href="/forgot-password">¿Olvidaste tu contraseña?</a>
    </form>
  );
}
```

### Componente Crear Contraseña (React)

```jsx
// components/CreatePasswordForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';

export function CreatePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const validatePassword = () => {
    if (password.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(password)) return 'Debe tener una mayúscula';
    if (!/[a-z]/.test(password)) return 'Debe tener una minúscula';
    if (!/[0-9]/.test(password)) return 'Debe tener un número';
    if (password !== confirmPassword) return 'Las contraseñas no coinciden';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authService.createPassword(token, password);

      if (result.status === 'success') {
        alert('Contraseña creada exitosamente');
        navigate('/login');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Crear Contraseña</h1>
      
      <p>Tu contraseña debe tener:</p>
      <ul>
        <li>Mínimo 8 caracteres</li>
        <li>Al menos una mayúscula</li>
        <li>Al menos una minúscula</li>
        <li>Al menos un número</li>
      </ul>
      
      {error && <div className="error">{error}</div>}
      
      <input
        type="password"
        placeholder="Nueva contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      <input
        type="password"
        placeholder="Confirmar contraseña"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creando...' : 'Crear Contraseña'}
      </button>
    </form>
  );
}
```

---

## ✅ Checklist de Implementación

### Pantallas Básicas
- [ ] `/login` - Formulario de inicio de sesión
- [ ] `/forgot-password` - Solicitar recuperación
- [ ] `/create-password?token=xxx` - Crear contraseña (primera vez)
- [ ] `/reset-password?token=xxx` - Restablecer contraseña
- [ ] `/dashboard` - Página protegida de ejemplo

### Funcionalidades
- [ ] Servicio de API configurado con base URL
- [ ] Almacenamiento de token en localStorage
- [ ] Función para verificar si sesión está activa
- [ ] Interceptor para agregar token a requests
- [ ] Protección de rutas privadas (redirect a login)
- [ ] Manejo de error 401 (logout automático)

### Validaciones
- [ ] Validación de email (formato)
- [ ] Validación de contraseña (8+ chars, mayúscula, minúscula, número)
- [ ] Confirmación de contraseña (match)
- [ ] Mostrar requisitos de contraseña en UI

### UX/UI
- [ ] Loading states en botones
- [ ] Mensajes de error claros
- [ ] Mensajes de éxito/confirmación
- [ ] Redirecciones automáticas
- [ ] Link "Volver" en pantallas secundarias

### Panel Admin (opcional)
- [ ] `/admin/users` - Registrar nuevos usuarios
- [ ] Verificar rol de admin antes de mostrar
- [ ] Formulario de registro de email

---

## 📞 Soporte

Si tienes dudas sobre la integración:

1. Verifica que el backend esté corriendo en `http://localhost:3000`
2. Usa herramientas como Postman para probar endpoints directamente
3. Revisa la consola del navegador para errores de red
4. Verifica que el token JWT no haya expirado (15 horas de validez)

---

*Documento generado el 10 de marzo de 2026*
