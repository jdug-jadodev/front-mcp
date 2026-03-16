# Plan de Remediación de Seguridad — Frontend MCP

**Basado en:** Análisis de Seguridad v2.0 (brechas-seguridad.md)  
**Fecha de inicio:** 2026-03-15  
**Score actual:** 82/100  
**Meta:** 95/100  
**Vulnerabilidades totales:** 14 (1 Alta, 6 Medias, 2 Bajas, 5 Info)

---

## Índice de Fases

- **[Fase 0](#fase-0-preparación-del-entorno)** — Preparación del Entorno (1 día)
- **[Fase 1](#fase-1-remediaciones-críticas-inmediatas)** — Remediaciones Críticas Inmediatas (3-5 días)
- **[Fase 2](#fase-2-correcciones-de-código-frontend)** — Correcciones de Código Frontend (2-3 días)
- **[Fase 3](#fase-3-infraestructura-y-despliegue)** — Infraestructura y Despliegue (2-3 días)
- **[Fase 4](#fase-4-mejoras-estructurales)** — Mejoras Estructurales (5-7 días)
- **[Fase 5](#fase-5-automatización-y-ci-cd)** — Automatización y CI/CD (3-4 días)
- **[Fase 6](#fase-6-validación-y-cierre)** — Validación y Cierre (2 días)

**Duración total estimada:** 18-25 días

---

## Fase 0: Preparación del Entorno

**Objetivo:** Configurar herramientas de análisis y establecer baseline de seguridad.

**Duración:** 1 día

### Tareas

#### 0.1: Ejecutar SCA inicial (Prioridad ALTA — Hallazgo #10)
- [ ] **0.1.1** — Ejecutar `npm audit` en el proyecto
  ```powershell
  npm audit --json > reports/npm-audit-baseline.json
  ```
- [ ] **0.1.2** — Revisar vulnerabilidades críticas y altas en dependencias
- [ ] **0.1.3** — Documentar CVEs encontradas en tabla de seguimiento
- [ ] **0.1.4** — Crear issues para cada CVE con CVSS >= 7.0

#### 0.2: Configurar herramientas de seguridad
- [ ] **0.2.1** — Instalar ESLint plugin de seguridad
  ```powershell
  npm install --save-dev eslint-plugin-security
  ```
- [ ] **0.2.2** — Actualizar `eslint.config.js` con reglas de seguridad
  ```javascript
  import security from 'eslint-plugin-security';
  
  export default [
    // ... existing config
    {
      plugins: { security },
      rules: {
        'security/detect-object-injection': 'warn',
        'security/detect-non-literal-regexp': 'warn',
        'security/detect-unsafe-regex': 'error',
        'security/detect-buffer-noassert': 'error',
        'security/detect-eval-with-expression': 'error',
        'security/detect-no-csrf-before-method-override': 'error',
        'security/detect-possible-timing-attacks': 'warn'
      }
    }
  ];
  ```
- [ ] **0.2.3** — Ejecutar `npm run lint` y corregir errores de seguridad

#### 0.3: Crear estructura de seguimiento
- [ ] **0.3.1** — Crear directorio `reports/` en raíz del proyecto
- [ ] **0.3.2** — Crear archivo `SECURITY_CHECKLIST.md` con checklist de hallazgos
- [ ] **0.3.3** — Configurar rama `security/remediation` para trabajo
  ```powershell
  git checkout -b security/remediation
  ```

---

## Fase 1: Remediaciones Críticas Inmediatas

**Objetivo:** Resolver vulnerabilidades de prioridad ALTA y MEDIA con esfuerzo bajo (0-7 días).

**Duración:** 3-5 días

### Tareas

#### 1.1: Configurar Content Security Policy (Hallazgo #2 — MEDIA)
- [ ] **1.1.1** — Añadir CSP meta tag en `index.html`
  ```html
  <meta 
    http-equiv="Content-Security-Policy" 
    content="default-src 'self'; 
             script-src 'self'; 
             style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
             font-src https://fonts.gstatic.com; 
             img-src 'self' data:; 
             connect-src 'self' https://api.tudominio.com;
             frame-ancestors 'none';
             base-uri 'self';
             form-action 'self'">
  ```
  **Ubicación:** `index.html` línea 7 (después de viewport)
  
- [ ] **1.1.2** — Reemplazar `https://api.tudominio.com` con variable de entorno
  - Crear script build que inyecte CSP con `VITE_API_URL`
  
- [ ] **1.1.3** — Probar aplicación en dev con CSP activado
  - Verificar consola de navegador para errores CSP
  - Corregir recursos bloqueados (si aplica)
  
- [ ] **1.1.4** — Validar CSP con herramienta online
  - Usar: https://csp-evaluator.withgoogle.com/
  - Documentar score y ajustar si es necesario

#### 1.2: Eliminar fallback a localStorage en getToken() (Hallazgo #1 — ALTA)
- [ ] **1.2.1** — Abrir `src/lib/api.ts` línea 74
- [ ] **1.2.2** — Eliminar `|| localStorage.getItem('authToken')`
  ```typescript
  // ANTES:
  export const getToken = () => inMemoryAuthToken || localStorage.getItem('authToken');
  
  // DESPUÉS:
  export const getToken = () => inMemoryAuthToken;
  ```
- [ ] **1.2.3** — Limpiar tokens legacy de localStorage en `clearAuth()`
  ```typescript
  export const clearAuth = () => {
    inMemoryAuthToken = null;
    try {
      localStorage.removeItem('authToken'); // mantener limpieza
      localStorage.removeItem('user');
    } catch {
      // ignore
    }
  };
  ```
- [ ] **1.2.4** — Probar flujo completo de login/logout
  - Verificar que token persiste en memoria durante sesión
  - Verificar que refresh de página pierde sesión (comportamiento esperado)
  
- [ ] **1.2.5** — Actualizar documentación sobre persistencia de sesión
  - Añadir nota en README sobre comportamiento de sesión en memoria

#### 1.3: Limpiar token de URL en ResetPassword (Hallazgo #4 — MEDIA)
- [ ] **1.3.1** — Abrir `src/pages/ResetPassword.tsx`
- [ ] **1.3.2** — Añadir useEffect para limpiar URL tras obtener token
  ```typescript
  import { useEffect, useState } from 'react';
  import { useNavigate, useSearchParams } from 'react-router-dom';
  
  const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    
    // Limpiar token de URL inmediatamente
    useEffect(() => {
      if (token) {
        try {
          window.history.replaceState(null, '', window.location.pathname);
        } catch (e) {
          console.warn('No se pudo limpiar URL:', e);
        }
      }
    }, [token]);
    
    // ... resto del componente
  ```
  **Ubicación:** Después de línea 18
  
- [ ] **1.3.3** — Probar flujo de reset de contraseña
  - Verificar que token se elimina de URL tras cargar página
  - Verificar que funcionalidad sigue operando correctamente

#### 1.4: Sanitizar console.error con email (Hallazgo #9 — BAJA)
- [ ] **1.4.1** — Abrir `src/lib/validators/password.ts` línea 44
- [ ] **1.4.2** — Eliminar log de email
  ```typescript
  // ANTES:
  } catch {
    console.error('Error al validar contra el email:', options.email);
  }
  
  // DESPUÉS:
  } catch (e) {
    console.error('Error al validar contraseña:', e instanceof Error ? e.message : 'unknown');
  }
  ```
- [ ] **1.4.3** — Buscar otros `console.log/error` con datos sensibles
  ```powershell
  grep -r "console\.(log|error)" src/ --include="*.ts" --include="*.tsx"
  ```
- [ ] **1.4.4** — Revisar y sanitizar logs encontrados

#### 1.5: Actualizar dependencias con CVEs (según resultado 0.1)
- [ ] **1.5.1** — Revisar reporte `npm audit`
- [ ] **1.5.2** — Actualizar paquetes con parches disponibles
  ```powershell
  npm audit fix
  ```
- [ ] **1.5.3** — Si hay breaking changes, actualizar manualmente
  ```powershell
  npm update [paquete]@[versión-segura]
  ```
- [ ] **1.5.4** — Ejecutar tests para verificar compatibilidad
  ```powershell
  npm run build
  npm run lint
  ```
- [ ] **1.5.5** — Documentar paquetes que no se pudieron actualizar (si aplica)

---

## Fase 2: Correcciones de Código Frontend

**Objetivo:** Mejorar validaciones y limpieza de tokens en componentes.

**Duración:** 2-3 días

### Tareas

#### 2.1: Optimizar limpieza de token en CreatePassword (Hallazgo #5 — MEDIA)
- [ ] **2.1.1** — Abrir `src/pages/CreatePassword.tsx`
- [ ] **2.1.2** — Mover `replaceState` a useEffect temprano
  ```typescript
  // Limpiar token de URL inmediatamente al montar
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      try {
        window.history.replaceState(null, '', window.location.pathname);
      } catch (e) {
        console.warn('No se pudo limpiar URL:', e);
      }
    }
  }, []); // Sin dependencias — ejecutar solo al montar
  
  // Separar verificación de token en otro efecto
  useEffect(() => {
    let mounted = true;
    const doVerify = async () => {
      const token = searchParams.get('token'); // Leer desde searchParams antes de limpiar
      if (!token) {
        if (mounted) setVerified(false);
        return;
      }
      // ... resto de verificación
    };
    doVerify();
    return () => { mounted = false; };
  }, [searchParams]);
  ```
- [ ] **2.1.3** — Guardar token en estado local antes de limpiar URL
  ```typescript
  const [tokenValue, setTokenValue] = useState<string | null>(null);
  
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setTokenValue(token); // Guardar en estado
      try {
        window.history.replaceState(null, '', window.location.pathname);
      } catch (e) {
        console.warn('No se pudo limpiar URL:', e);
      }
    }
  }, [searchParams]);
  ```
- [ ] **2.1.4** — Usar `tokenValue` en lugar de `searchParams.get('token')` en el resto del componente
- [ ] **2.1.5** — Probar flujo completo de creación de contraseña

#### 2.2: Crear hook reutilizable useTokenFromUrl (Vulnerabilidades Recurrentes)
- [ ] **2.2.1** — Crear archivo `src/hooks/useTokenFromUrl.ts`
  ```typescript
  import { useEffect, useState } from 'react';
  import { useSearchParams } from 'react-router-dom';
  
  /**
   * Hook que extrae token de URL y lo limpia automáticamente del historial.
   * Previene leaks de tokens en Referer, logs, y browser history.
   * 
   * @param paramName - Nombre del query param (default: 'token')
   * @returns Token extraído o null
   */
  export function useTokenFromUrl(paramName = 'token'): string | null {
    const [searchParams] = useSearchParams();
    const [token, setToken] = useState<string | null>(null);
    
    useEffect(() => {
      const tokenValue = searchParams.get(paramName);
      if (tokenValue) {
        setToken(tokenValue);
        
        // Limpiar URL inmediatamente
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete(paramName);
          window.history.replaceState(null, '', url.pathname + url.search);
        } catch (e) {
          console.warn('No se pudo limpiar token de URL:', e);
        }
      }
    }, [searchParams, paramName]);
    
    return token;
  }
  ```
  
- [ ] **2.2.2** — Refactorizar `CreatePassword.tsx` para usar hook
  ```typescript
  import { useTokenFromUrl } from '../hooks/useTokenFromUrl';
  
  const CreatePassword: React.FC = () => {
    const token = useTokenFromUrl();
    const navigate = useNavigate();
    const [verified, setVerified] = useState<boolean | null>(null);
    // ... resto del componente sin useSearchParams
  ```
  
- [ ] **2.2.3** — Refactorizar `ResetPassword.tsx` para usar hook
  ```typescript
  import { useTokenFromUrl } from '../hooks/useTokenFromUrl';
  
  const ResetPassword = () => {
    const token = useTokenFromUrl();
    // ... resto del componente
  ```
  
- [ ] **2.2.4** — Probar ambos flujos (CreatePassword y ResetPassword)
- [ ] **2.2.5** — Documentar hook en README o en comentarios JSDoc

#### 2.3: Mejorar validación de email (Hallazgo #7 — MEDIA)
- [ ] **2.3.1** — Instalar librería de validación de email
  ```powershell
  npm install validator
  npm install --save-dev @types/validator
  ```
  
- [ ] **2.3.2** — Crear helper de validación en `src/lib/validators/email.ts`
  ```typescript
  import validator from 'validator';
  
  /**
   * Valida email usando librería validator.js (RFC 5322)
   * @param email - Email a validar
   * @returns true si es válido
   */
  export function isValidEmail(email: string): boolean {
    return validator.isEmail(email, {
      allow_display_name: false,
      require_tld: true,
      allow_utf8_local_part: false,
      require_tld: true
    });
  }
  
  /**
   * Normaliza email (lowercase, trim)
   */
  export function normalizeEmail(email: string): string {
    return validator.normalizeEmail(email, {
      all_lowercase: true,
      gmail_remove_dots: false
    }) || email.toLowerCase().trim();
  }
  ```
  
- [ ] **2.3.3** — Actualizar validación en `src/pages/Login.tsx` línea 27
  ```typescript
  import { isValidEmail } from '../lib/validators/email';
  
  const validate = () => {
    const errs: typeof fieldErrors = {}
    if (!email.trim()) errs.email = 'Correo requerido'
    else if (!isValidEmail(email)) errs.email = 'Email inválido'
    if (!password) errs.password = 'Contraseña requerida'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }
  ```
  
- [ ] **2.3.4** — Actualizar validación en otros componentes que usen email
  - `ForgotPassword.tsx`
  - `AdminUsers.tsx` (si aplica)
  
- [ ] **2.3.5** — Probar con emails edge-case:
  - `user+tag@example.com` (válido)
  - `user@sub.example.co.uk` (válido)
  - `user@example` (inválido — sin TLD)
  - `user name@example.com` (inválido — espacios)

#### 2.4: Documentar validación JWT client-side (Hallazgo #6 — INFO)
- [ ] **2.4.1** — Abrir `src/lib/api.ts` línea 94
- [ ] **2.4.2** — Añadir comentario JSDoc detallado
  ```typescript
  /**
   * Parsea payload de JWT de forma segura (solo para UI).
   * 
   * ⚠️ IMPORTANTE: Esta función NO valida la firma del JWT.
   * Es solo para extraer información del payload para decisiones de UI
   * (ej. mostrar exp timestamp, extraer claims para renderizado).
   * 
   * ✅ El BACKEND debe validar la firma y expiración en cada request.
   * ✅ No confiar en esta validación para decisiones de seguridad.
   * 
   * @param token - JWT token string
   * @returns Payload parseado o null si inválido
   */
  export const safeParseJwt = (token: string | null): Record<string, unknown> | null => {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = JSON.parse(atob(parts[1]));
      return typeof payload === 'object' && payload !== null 
        ? (payload as Record<string, unknown>) 
        : null;
    } catch {
      return null;
    }
  };
  ```
  
- [ ] **2.4.3** — Añadir comentario en `isAuthenticated()`
  ```typescript
  /**
   * Verifica si hay sesión activa (UI-only check).
   * 
   * ⚠️ Esta validación es solo para UI (mostrar/ocultar elementos).
   * El backend valida el token en cada request protegido.
   */
  export const isAuthenticated = () => {
    // ... código existente
  ```

---

## Fase 3: Infraestructura y Despliegue

**Objetivo:** Configurar headers de seguridad y manifiestos de despliegue.

**Duración:** 2-3 días

### Tareas

#### 3.1: Crear configuración de headers para Vercel (Hallazgo #3 — MEDIA)
- [ ] **3.1.1** — Crear archivo `vercel.json` en raíz del proyecto
  ```json
  {
    "buildCommand": "npm run build",
    "outputDirectory": "dist",
    "framework": "vite",
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "Permissions-Policy",
            "value": "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()"
          },
          {
            "key": "X-DNS-Prefetch-Control",
            "value": "on"
          },
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=31536000; includeSubDomains; preload"
          },
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.tudominio.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
          }
        ]
      }
    ],
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
  
- [ ] **3.1.2** — Ajustar `connect-src` en CSP con dominio real del backend
- [ ] **3.1.3** — Añadir `.vercelignore` si es necesario
  ```
  node_modules
  .env
  .env.local
  reports
  ```

#### 3.2: Crear configuración alternativa para Netlify
- [ ] **3.2.1** — Crear archivo `netlify.toml` en raíz
  ```toml
  [build]
    command = "npm run build"
    publish = "dist"
  
  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  
  [[headers]]
    for = "/*"
    [headers.values]
      X-Frame-Options = "DENY"
      X-Content-Type-Options = "nosniff"
      Referrer-Policy = "strict-origin-when-cross-origin"
      Permissions-Policy = "geolocation=(), microphone=(), camera=()"
      Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
      Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.tudominio.com; frame-ancestors 'none'"
  ```

#### 3.3: Crear Dockerfile para despliegue self-hosted (Hallazgo #12 — INFO)
- [ ] **3.3.1** — Crear archivo `Dockerfile` en raíz
  ```dockerfile
  # Build stage
  FROM node:20-alpine AS build
  
  WORKDIR /app
  
  # Copy package files
  COPY package*.json ./
  COPY pnpm-lock.yaml ./
  
  # Install pnpm and dependencies
  RUN npm install -g pnpm
  RUN pnpm install --frozen-lockfile
  
  # Copy source code
  COPY . .
  
  # Build application
  RUN pnpm run build
  
  # Production stage
  FROM nginx:alpine
  
  # Copy build artifacts
  COPY --from=build /app/dist /usr/share/nginx/html
  
  # Copy custom nginx config
  COPY nginx.conf /etc/nginx/conf.d/default.conf
  
  # Remove default nginx config
  RUN rm /etc/nginx/conf.d/default.conf || true
  
  # Expose port
  EXPOSE 80
  
  # Health check
  HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
  
  # Start nginx
  CMD ["nginx", "-g", "daemon off;"]
  ```
  
- [ ] **3.3.2** — Crear archivo `nginx.conf` en raíz
  ```nginx
  server {
      listen 80;
      server_name _;
      root /usr/share/nginx/html;
      index index.html;
  
      # Security headers
      add_header X-Frame-Options "DENY" always;
      add_header X-Content-Type-Options "nosniff" always;
      add_header Referrer-Policy "strict-origin-when-cross-origin" always;
      add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
      add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.tudominio.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;
      add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
  
      # SPA routing - todas las rutas van a index.html
      location / {
          try_files $uri $uri/ /index.html;
      }
  
      # Cache static assets
      location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
          expires 1y;
          add_header Cache-Control "public, immutable";
      }
  
      # Disable nginx version in headers
      server_tokens off;
  
      # Gzip compression
      gzip on;
      gzip_vary on;
      gzip_min_length 1024;
      gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
  }
  ```
  
- [ ] **3.3.3** — Crear `.dockerignore`
  ```
  node_modules
  dist
  .git
  .env
  .env.local
  .vscode
  reports
  *.md
  ```
  
- [ ] **3.3.4** — Probar build de Docker localmente
  ```powershell
  docker build -t front-mcp:test .
  docker run -p 8080:80 front-mcp:test
  # Abrir http://localhost:8080 y verificar
  ```
  
- [ ] **3.3.5** — Verificar headers de seguridad con curl
  ```powershell
  curl -I http://localhost:8080
  # Verificar que aparecen X-Frame-Options, CSP, etc.
  ```

#### 3.4: Crear docker-compose.yml para desarrollo
- [ ] **3.4.1** — Crear `docker-compose.yml`
  ```yaml
  version: '3.8'
  
  services:
    frontend:
      build:
        context: .
        dockerfile: Dockerfile
      ports:
        - "8080:80"
      environment:
        - NODE_ENV=production
      restart: unless-stopped
      networks:
        - app-network
  
  networks:
    app-network:
      driver: bridge
  ```
  
- [ ] **3.4.2** — Documentar comandos en README
  ```markdown
  ## Docker Deployment
  
  ### Build and run
  ```bash
  docker-compose up -d
  ```
  
  ### Stop
  ```bash
  docker-compose down
  ```
  ```

---

## Fase 4: Mejoras Estructurales

**Objetivo:** Implementar mejoras de validación, diccionarios de contraseñas, y migraciones arquitecturales.

**Duración:** 5-7 días

### Tareas

#### 4.1: Implementar diccionario de contraseñas comunes (Hallazgo #13 — INFO)
- [ ] **4.1.1** — Descargar lista de top 1000 contraseñas comunes
  - Fuente: https://github.com/danielmiessler/SecLists/blob/master/Passwords/Common-Credentials/10-million-password-list-top-1000.txt
  - Guardar en `src/assets/common-passwords-1000.txt`
  
- [ ] **4.1.2** — Crear script de build para convertir a JSON
  ```javascript
  // scripts/build-password-dict.js
  const fs = require('fs');
  const path = require('path');
  
  const inputPath = path.join(__dirname, '../src/assets/common-passwords-1000.txt');
  const outputPath = path.join(__dirname, '../src/assets/common-passwords.json');
  
  const passwords = fs.readFileSync(inputPath, 'utf-8')
    .split('\n')
    .map(p => p.trim().toLowerCase())
    .filter(Boolean);
  
  fs.writeFileSync(outputPath, JSON.stringify(passwords, null, 2));
  console.log(`✅ Generated ${passwords.length} common passwords`);
  ```
  
- [ ] **4.1.3** — Añadir script a `package.json`
  ```json
  {
    "scripts": {
      "prebuild": "node scripts/build-password-dict.js",
      "build": "tsc -b && vite build"
    }
  }
  ```
  
- [ ] **4.1.4** — Actualizar `src/lib/validators/password.ts`
  ```typescript
  import commonPasswordsList from '../assets/common-passwords.json';
  
  const COMMON_PASSWORDS = new Set(commonPasswordsList);
  
  export function validatePasswordRules(
    password: string, 
    options: Options = {}
  ): ValidationResult {
    const hints: string[] = [];
    const failedRules: string[] = [];
    
    // ... validaciones existentes
    
    // Validar contra diccionario de contraseñas comunes
    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
      failedRules.push('common');
      hints.push('Contraseña demasiado común. Usa una más única.');
    }
    
    // Validar contra commonPasswords pasado en options (mantener compatibilidad)
    if (options.commonPasswords && options.commonPasswords.has(password)) {
      failedRules.push('common');
      hints.push('Contraseña demasiado común');
    }
    
    return { ok: failedRules.length === 0, hints, failedRules };
  }
  ```
  
- [ ] **4.1.5** — Probar validación con contraseñas comunes
  - `password123` (debe rechazar)
  - `123456` (debe rechazar)
  - `P@ssw0rd!2024` (debe aceptar si no está en top 1000)

#### 4.2: Generar SBOM (Software Bill of Materials) (NIST SSDF PO.3)
- [ ] **4.2.1** — Instalar herramienta CycloneDX
  ```powershell
  npm install --save-dev @cyclonedx/cyclonedx-npm
  ```
  
- [ ] **4.2.2** — Añadir script de generación de SBOM
  ```json
  {
    "scripts": {
      "sbom": "cyclonedx-npm --output-file sbom.json"
    }
  }
  ```
  
- [ ] **4.2.3** — Generar SBOM inicial
  ```powershell
  npm run sbom
  ```
  
- [ ] **4.2.4** — Añadir `sbom.json` a `.gitignore` (se genera en CI)
- [ ] **4.2.5** — Documentar proceso de SBOM en README

#### 4.3: Preparar migración a cookies HttpOnly (Coordinación Backend)
- [ ] **4.3.1** — Documentar requerimientos para backend en `BACKEND_REQUIREMENTS.md`
  ```markdown
  # Requerimientos de Backend para Migración de Autenticación
  
  ## Objetivo
  Migrar de tokens JWT en localStorage/memoria a cookies HttpOnly/Secure.
  
  ## Cambios Requeridos en Backend
  
  ### 1. Endpoint de Login
  - **Actual:** Retorna `{ token: string, user: object }`
  - **Nuevo:** Debe setear cookie HttpOnly en response:
    ```javascript
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: true, // solo HTTPS
      sameSite: 'strict',
      maxAge: 3600000, // 1 hora
      path: '/'
    });
    res.json({ user: { ... } }); // sin token
    ```
  
  ### 2. Validación de Requests
  - **Actual:** Lee token de header `Authorization: Bearer <token>`
  - **Nuevo:** Leer token de cookie `authToken`:
    ```javascript
    const token = req.cookies.authToken;
    ```
  
  ### 3. Endpoint de Logout
  - Debe limpiar cookie:
    ```javascript
    res.clearCookie('authToken');
    ```
  
  ### 4. CORS Configuration
  - Debe permitir credentials:
    ```javascript
    cors({
      origin: 'https://frontend.tudominio.com',
      credentials: true
    })
    ```
  
  ## Cambios en Frontend (este repo)
  
  - Eliminar `saveAuth()` que guarda token
  - Fetch requests deben incluir `credentials: 'include'`
  - Verificar sesión mediante endpoint `/auth/me` en lugar de parsear JWT
  ```
  
- [ ] **4.3.2** — Crear rama experimental `feat/cookie-auth-migration`
- [ ] **4.3.3** — Implementar cambios en frontend (NO mergear hasta backend esté listo)
  ```typescript
  // src/lib/api.ts
  export const api = {
    baseURL: API_URL,
  
    async post<T = unknown, U = unknown>(
      endpoint: string, 
      data: T, 
      options: ApiOptions = {}
    ): Promise<U> {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };
  
      // NO enviar Authorization header — token viene en cookie
  
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include' // ✅ Incluir cookies
      });
  
      // ... resto del código
    }
  };
  
  // Eliminar inMemoryAuthToken — backend maneja sesión
  export const saveAuth = (user: AuthUser) => {
    try {
      localStorage.setItem('user', JSON.stringify(user));
    } catch {
      // ignore
    }
  };
  
  export const getToken = () => null; // Cookie httpOnly no es accesible desde JS
  
  export const isAuthenticated = async (): Promise<boolean> => {
    // Llamar endpoint /auth/me para verificar sesión
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include'
      });
      return response.ok;
    } catch {
      return false;
    }
  };
  ```
  
- [ ] **4.3.4** — Documentar plan de migración completo con backend
- [ ] **4.3.5** — NO MERGEAR — Marcar como bloqueado hasta backend implemente cambios

#### 4.4: Inventariar activos de información (ISO 27001 A.8.3)
- [ ] **4.4.1** — Crear documento `INFORMATION_ASSETS.md`
  ```markdown
  # Inventario de Activos de Información — Frontend
  
  ## 1. Datos Sensibles Almacenados
  
  ### 1.1 En Memoria (Runtime)
  | Activo | Tipo | Ubicación | Ciclo de Vida | Sensibilidad |
  |--------|------|-----------|---------------|--------------|
  | JWT Token | Autenticación | `inMemoryAuthToken` (api.ts) | Sesión (hasta refresh/cierre) | ALTA |
  | User Metadata | Perfil | State de componentes | Sesión | MEDIA |
  
  ### 1.2 En localStorage (Persistente)
  | Activo | Tipo | Ubicación | Ciclo de Vida | Sensibilidad |
  |--------|------|-----------|---------------|--------------|
  | User Object | Perfil | `localStorage.user` | Hasta logout | BAJA |
  
  ### 1.3 En URL (Temporal)
  | Activo | Tipo | Ubicación | Ciclo de Vida | Sensibilidad |
  |--------|------|-----------|---------------|--------------|
  | Reset Token | Single-use | Query param `?token=` | < 1 segundo (limpiado) | ALTA |
  | Create Password Token | Single-use | Query param `?token=` | < 1 segundo (limpiado) | ALTA |
  
  ## 2. Flujos de Datos
  
  ### Login Flow
  ```
  [Usuario] → [Login Form] → [POST /auth/login] → [Backend]
                                                    ↓
  [JWT Token] ← [Response] ← ← ← ← ← ← ← ← ← ← ← ←
       ↓
  [inMemoryAuthToken] (no persistido)
  [localStorage.user] (metadata no sensible: email, userId)
  ```
  
  ### Password Reset Flow
  ```
  [Email Link + Token] → [ResetPassword Component]
                              ↓
                         Extract token
                              ↓
                         Clean URL (< 1s)
                              ↓
                         [POST /auth/reset-password]
  ```
  
  ## 3. Controles de Seguridad
  
  - ✅ Tokens de sesión en memoria (no persistidos)
  - ✅ Tokens single-use limpiados de URL
  - ✅ User metadata en localStorage (no sensible)
  - ⚠️ Migración planificada a cookies HttpOnly
  
  ## 4. Recomendaciones
  
  - **Rotación de tokens:** Implementar refresh token (backend)
  - **Expiración:** JWT con exp corto (1h recomendado)
  - **Limpieza:** clearAuth() en 401, logout, timeout
  ```
  
- [ ] **4.4.2** — Revisar y validar con equipo de seguridad/compliance

---

## Fase 5: Automatización y CI/CD

**Objetivo:** Integrar SAST, SCA, secret scanning en pipeline de CI/CD.

**Duración:** 3-4 días

### Tareas

#### 5.1: Configurar GitHub Dependabot (Hallazgo #10 — SCA)
- [ ] **5.1.1** — Crear archivo `.github/dependabot.yml`
  ```yaml
  version: 2
  updates:
    - package-ecosystem: "npm"
      directory: "/"
      schedule:
        interval: "weekly"
        day: "monday"
        time: "09:00"
      open-pull-requests-limit: 10
      reviewers:
        - "tu-usuario"
      assignees:
        - "tu-usuario"
      commit-message:
        prefix: "chore(deps)"
        include: "scope"
      labels:
        - "dependencies"
        - "security"
      # Configuración de versiones
      versioning-strategy: increase
      # Solo aplicar a CVEs de severidad media o mayor
      severity: medium
  ```
  
- [ ] **5.1.2** — Habilitar Dependabot Alerts en GitHub
  - Settings → Security & Analysis
  - Activar "Dependabot alerts"
  - Activar "Dependabot security updates"
  
- [ ] **5.1.3** — Configurar notificaciones de Dependabot
- [ ] **5.1.4** — Revisar primera ronda de PRs de Dependabot

#### 5.2: Configurar GitHub Secret Scanning (Hallazgo #11)
- [ ] **5.2.1** — Habilitar Secret Scanning en GitHub
  - Settings → Security & Analysis
  - Activar "Secret scanning"
  - Activar "Push protection" (bloquea commits con secretos)
  
- [ ] **5.2.2** — Instalar detect-secrets localmente
  ```powershell
  pip install detect-secrets
  ```
  
- [ ] **5.2.3** — Generar baseline de secretos
  ```powershell
  detect-secrets scan --baseline .secrets.baseline
  ```
  
- [ ] **5.2.4** — Añadir `.secrets.baseline` a `.gitignore`
- [ ] **5.2.5** — Crear pre-commit hook
  ```powershell
  npm install --save-dev husky
  npx husky install
  npx husky add .husky/pre-commit "detect-secrets-hook --baseline .secrets.baseline $(git diff --cached --name-only)"
  ```
  
- [ ] **5.2.6** — Probar commit con secreto falso (debe bloquearse)

#### 5.3: Integrar SAST en GitHub Actions (NIST SSDF PW.2)
- [ ] **5.3.1** — Crear workflow `.github/workflows/security-scan.yml`
  ```yaml
  name: Security Scan
  
  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main, develop]
    schedule:
      - cron: '0 0 * * 1' # Semanal, lunes a medianoche
  
  jobs:
    sast:
      name: SAST Analysis
      runs-on: ubuntu-latest
      steps:
        - name: Checkout code
          uses: actions/checkout@v4
          with:
            fetch-depth: 0
        
        - name: Setup Node.js
          uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'
        
        - name: Install dependencies
          run: npm ci
        
        - name: Run ESLint Security
          run: npm run lint
          continue-on-error: true
        
        - name: Run Semgrep (SAST)
          uses: returntocorp/semgrep-action@v1
          with:
            config: >-
              p/owasp-top-ten
              p/javascript
              p/typescript
              p/react
        
        - name: Upload SARIF results
          uses: github/codeql-action/upload-sarif@v3
          if: always()
          with:
            sarif_file: semgrep.sarif
    
    sca:
      name: SCA (Dependency Scan)
      runs-on: ubuntu-latest
      steps:
        - name: Checkout code
          uses: actions/checkout@v4
        
        - name: Setup Node.js
          uses: actions/setup-node@v4
          with:
            node-version: '20'
        
        - name: Run npm audit
          run: |
            npm audit --json > npm-audit-results.json || true
            npm audit --audit-level=moderate
        
        - name: Upload audit results
          uses: actions/upload-artifact@v4
          with:
            name: npm-audit-results
            path: npm-audit-results.json
    
    secrets:
      name: Secret Scanning
      runs-on: ubuntu-latest
      steps:
        - name: Checkout code
          uses: actions/checkout@v4
        
        - name: Gitleaks Scan
          uses: gitleaks/gitleaks-action@v2
          env:
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  ```
  
- [ ] **5.3.2** — Probar workflow en PR de prueba
- [ ] **5.3.3** — Configurar branch protection para requerir checks
  - Require status checks: "SAST Analysis", "SCA", "Secret Scanning"

#### 5.4: Configurar CodeQL (opcional — análisis profundo)
- [ ] **5.4.1** — Crear workflow `.github/workflows/codeql.yml`
  ```yaml
  name: CodeQL Security Analysis
  
  on:
    push:
      branches: [main]
    pull_request:
      branches: [main]
    schedule:
      - cron: '0 6 * * 1' # Lunes 6am
  
  jobs:
    analyze:
      name: Analyze TypeScript/JavaScript
      runs-on: ubuntu-latest
      permissions:
        actions: read
        contents: read
        security-events: write
      
      steps:
        - name: Checkout repository
          uses: actions/checkout@v4
        
        - name: Initialize CodeQL
          uses: github/codeql-action/init@v3
          with:
            languages: javascript
            queries: security-and-quality
        
        - name: Autobuild
          uses: github/codeql-action/autobuild@v3
        
        - name: Perform CodeQL Analysis
          uses: github/codeql-action/analyze@v3
  ```

#### 5.5: Añadir security.txt (RFC 9116)
- [ ] **5.5.1** — Crear archivo `public/.well-known/security.txt`
  ```
  Contact: security@tudominio.com
  Expires: 2027-12-31T23:59:59.000Z
  Preferred-Languages: es, en
  Canonical: https://tudominio.com/.well-known/security.txt
  Policy: https://tudominio.com/security-policy
  Acknowledgments: https://tudominio.com/security-acknowledgments
  ```
  
- [ ] **5.5.2** — Firmar con PGP (opcional pero recomendado)
  ```powershell
  gpg --clearsign -a public/.well-known/security.txt
  ```

---

## Fase 6: Validación y Cierre

**Objetivo:** Validar todas las correcciones, generar reporte final, y cerrar plan.

**Duración:** 2 días

### Tareas

#### 6.1: Ejecutar suite completa de validación
- [ ] **6.1.1** — Ejecutar npm audit (debe estar limpio o solo LOW)
  ```powershell
  npm audit --audit-level=moderate
  ```
  
- [ ] **6.1.2** — Ejecutar ESLint security
  ```powershell
  npm run lint -- --max-warnings=0
  ```
  
- [ ] **6.1.3** — Ejecutar build de producción
  ```powershell
  npm run build
  ```
  
- [ ] **6.1.4** — Probar aplicación en local con headers de seguridad
  ```powershell
  # Si tienes http-server
  npx http-server dist -p 8080 --cors -c-1
  
  # Verificar headers con curl
  curl -I http://localhost:8080
  ```
  
- [ ] **6.1.5** — Validar CSP con browser DevTools
  - Abrir consola
  - Verificar que no hay errores de CSP
  - Probar todas las rutas de la app

#### 6.2: Validar con herramientas online
- [ ] **6.2.1** — Escanear headers con SecurityHeaders.com
  - URL: https://securityheaders.com
  - Objetivo: Grado A
  
- [ ] **6.2.2** — Validar CSP con CSP Evaluator
  - URL: https://csp-evaluator.withgoogle.com/
  - Objetivo: Sin warnings críticos
  
- [ ] **6.2.3** — Escanear con Mozilla Observatory
  - URL: https://observatory.mozilla.org/
  - Objetivo: Grado B+ o superior

#### 6.3: Testing manual de flujos críticos
- [ ] **6.3.1** — Testing de Login
  - Login exitoso → token en memoria → navegación funcional
  - Login fallido → error mostrado correctamente
  - Refresh de página → logout automático (esperado con token en memoria)
  
- [ ] **6.3.2** — Testing de CreatePassword
  - Link con token → token limpiado de URL inmediatamente
  - Validación de contraseña con diccionario común
  - Contraseña débil rechazada
  - Contraseña fuerte aceptada
  
- [ ] **6.3.3** — Testing de ResetPassword
  - Link con token → token limpiado de URL
  - Reset exitoso → redirect a login
  - Token inválido → error mostrado
  
- [ ] **6.3.4** — Testing de validación de email
  - Emails válidos aceptados
  - Emails inválidos rechazados con mensaje claro

#### 6.4: Actualizar reporte de seguridad
- [ ] **6.4.1** — Abrir `brechas-seguridad.md`
- [ ] **6.4.2** — Actualizar estado de cada hallazgo a "Fixed" o "Mitigated"
- [ ] **6.4.3** — Actualizar score de seguridad
  - Recalcular basado en hallazgos resueltos
  - Meta: 95/100
  
- [ ] **6.4.4** — Añadir sección v3.0 al historial de cambios
  ```markdown
  ### v3.0 — 2026-XX-XX — Remediación Completa
  
  **Cambios principales:**
  - ✅ Hallazgo #1: Fallback localStorage eliminado
  - ✅ Hallazgo #2: CSP configurado en index.html + hosting
  - ✅ Hallazgo #3: Headers de seguridad en vercel.json/nginx.conf
  - ✅ Hallazgo #4: Token ResetPassword limpiado de URL
  - ✅ Hallazgo #5: Token CreatePassword optimizado
  - ✅ Hallazgo #6: JWT parsing documentado (UI-only)
  - ✅ Hallazgo #7: Validación de email mejorada (validator.js)
  - ✅ Hallazgo #9: console.error sanitizado
  - ✅ Hallazgo #10: SCA integrado en CI/CD (Dependabot)
  - ✅ Hallazgo #11: Secret scanning configurado
  - ✅ Hallazgo #13: Diccionario de 1000 contraseñas comunes
  - ✅ NIST SSDF: SBOM generado, SAST en CI
  - ✅ IaC: Dockerfile + nginx.conf creados
  
  **Score de seguridad:** 82 → **95** 🎉
  
  **Vulnerabilidades pendientes:**
  - #1: Migración completa a cookies HttpOnly (bloqueado por backend)
  - #14: Rate limiting backend (fuera de scope)
  ```

#### 6.5: Documentar cambios en README
- [ ] **6.5.1** — Añadir sección de Seguridad en README.md
  ```markdown
  ## 🔒 Seguridad
  
  Este proyecto implementa las siguientes medidas de seguridad:
  
  ### Autenticación
  - ✅ JWT tokens almacenados en memoria (no localStorage)
  - ✅ Tokens single-use limpiados de URL automáticamente
  - ✅ Validación de contraseñas contra diccionario de 1000+ contraseñas comunes
  - ✅ Validación robusta de email (RFC 5322)
  
  ### Headers de Seguridad
  - ✅ Content-Security-Policy (CSP)
  - ✅ X-Frame-Options: DENY
  - ✅ X-Content-Type-Options: nosniff
  - ✅ Strict-Transport-Security (HSTS)
  - ✅ Referrer-Policy
  
  ### Análisis Continuo
  - ✅ SAST con Semgrep (OWASP Top 10)
  - ✅ SCA con npm audit + Dependabot
  - ✅ Secret scanning con Gitleaks
  - ✅ CodeQL security analysis
  
  ### Compliance
  - ✅ OWASP Top 10 2021: 95% cumplimiento
  - ✅ SANS/CWE Top 25: 95% cumplimiento
  - ✅ NIST SSDF: SAST, SCA, SBOM implementados
  - ✅ ISO 27001: Controles básicos A.8.9, A.8.28
  
  **Score de Seguridad:** 95/100
  
  Ver [brechas-seguridad.md](./brechas-seguridad.md) para reporte completo.
  ```

#### 6.6: Crear PR de cierre
- [ ] **6.6.1** — Hacer commit de todos los cambios
  ```powershell
  git add .
  git commit -m "security: complete remediation plan (score 82→95)"
  ```
  
- [ ] **6.6.2** — Push a rama de seguridad
  ```powershell
  git push origin security/remediation
  ```
  
- [ ] **6.6.3** — Crear Pull Request con descripción completa
  ```markdown
  # 🔒 Security Remediation - Complete Implementation
  
  ## Overview
  Implements full remediation plan based on security audit v2.0
  
  ## Security Score
  - **Before:** 82/100
  - **After:** 95/100
  - **Improvement:** +13 points
  
  ## Vulnerabilities Resolved
  - ✅ #1 (Alta): localStorage fallback removed
  - ✅ #2 (Media): CSP configured
  - ✅ #3 (Media): Security headers configured
  - ✅ #4 (Media): ResetPassword token cleaned from URL
  - ✅ #5 (Media): CreatePassword token optimized
  - ✅ #7 (Media): Email validation improved
  - ✅ #9 (Baja): console.error sanitized
  - ✅ #10 (Info): SCA integrated (Dependabot)
  - ✅ #11 (Info): Secret scanning configured
  - ✅ #13 (Info): Common passwords dictionary (1000+)
  
  ## Files Changed
  - Security configuration: `vercel.json`, `netlify.toml`, `nginx.conf`
  - Infrastructure: `Dockerfile`, `docker-compose.yml`
  - Code improvements: `api.ts`, `ResetPassword.tsx`, `Login.tsx`, `password.ts`
  - New utilities: `useTokenFromUrl.ts`, `email.ts`
  - CI/CD: `.github/workflows/security-scan.yml`, `.github/dependabot.yml`
  - Documentation: `brechas-seguridad.md` v3.0, `README.md`
  
  ## Testing
  - ✅ npm audit: CLEAN
  - ✅ ESLint security: 0 warnings
  - ✅ Build: SUCCESS
  - ✅ Manual testing: All flows verified
  - ✅ SecurityHeaders.com: Grade A
  - ✅ CSP Evaluator: No critical warnings
  
  ## Reviewers
  @security-team @tech-lead
  
  ## Checklist
  - [x] All tasks from PLAN_REMEDIACION_SEGURIDAD.md completed
  - [x] Security score improved to 95/100
  - [x] CI/CD checks passing
  - [x] Documentation updated
  - [x] Manual testing completed
  ```
  
- [ ] **6.6.4** — Solicitar review de seguridad
- [ ] **6.6.5** — Mergear tras aprobación

#### 6.7: Post-deployment verification
- [ ] **6.7.1** — Verificar deployment en staging/producción
- [ ] **6.7.2** — Re-ejecutar validaciones en ambiente real
  - SecurityHeaders.com con URL real
  - Mozilla Observatory con URL real
  - CSP Evaluator con URL real
  
- [ ] **6.7.3** — Monitorear logs por 48h para detectar issues
- [ ] **6.7.4** — Crear issue de seguimiento para migración a cookies (bloqueado por backend)

---

## Métricas de Éxito

| Métrica | Baseline | Meta | Resultado Final |
|---------|----------|------|-----------------|
| Score de Seguridad | 82/100 | 95/100 | ___ /100 |
| Vulnerabilidades Críticas | 0 | 0 | ___ |
| Vulnerabilidades Altas | 1 | 0 | ___ |
| Vulnerabilidades Medias | 6 | ≤ 1 | ___ |
| npm audit (moderate+) | ? | 0 | ___ |
| ESLint security warnings | ? | 0 | ___ |
| SecurityHeaders.com | ? | A | ___ |
| CSP Evaluator | ? | 0 críticos | ___ |
| OWASP Top 10 Compliance | 60% | 95% | ___% |

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| CSP rompe funcionalidad | Media | Alto | Testing exhaustivo en dev, rollback plan |
| Dependencias con breaking changes | Media | Medio | Lock de versiones, testing antes de merge |
| Backend no listo para cookies | Alta | Bajo | Migración planificada para Fase futura |
| Headers no soportados en hosting | Baja | Medio | Validar con documentación de Vercel/Netlify |
| False positives en SAST | Media | Bajo | Revisar manualmente, marcar como FP documentado |

---

## Siguiente Fase (Futuro)

**Fase 7: Migración a Cookies HttpOnly** (bloqueado por backend)
- Implementar refresh token flow
- Migrar autenticación a cookies
- Eliminar almacenamiento client-side de tokens
- Testing de flujos cross-domain

**Duración estimada:** 5-7 días (requiere coordinación backend)

---

## Referencias

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [NIST SSDF (SP 800-218)](https://csrc.nist.gov/publications/detail/sp/800-218/final)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Checkmarx Best Practices](https://checkmarx.com/resource/documents/en/34965-8087-best-practices.pdf)
- [Content Security Policy Reference](https://content-security-policy.com/)

---

**Última actualización:** 2026-03-15  
**Plan creado por:** GitHub Copilot  
**Aprobado por:** _[Pendiente]_
