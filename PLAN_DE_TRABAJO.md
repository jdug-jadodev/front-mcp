# Plan de Trabajo — Frontend de Autenticación

Resumen breve:
Proyecto con React + Vite + Tailwind (pnpm). Implementar pantallas: `Login`, `Create Password`, `Reset Password`, `Forgot Password`, dashboard y panel admin. Todas las pantallas salvo `Login` requieren token en URL (uso de token de un solo uso). Enfocar seguridad front: mitigación de peticiones masivas, sanitización, manejo seguro de tokens y buenas prácticas para despliegue en Vercel.

Fase 0 — Preparación (objetivo: entender contexto y requisitos)
- 0.1 Revisar `GUIA_INTEGRACION_FRONTEND.md` y endpoints.
- 0.2 Confirmar dependencias (pnpm, Node versión mínima).
- 0.3 usar ts
- 0.4 Crear archivo de plan y registrar TODO (hecho).

Fase 1 — Inicialización del proyecto (setup básico)
- 1.1 Crear proyecto Vite: `pnpm create vite` (React + TypeScript).
- 1.2 Inicializar repositorio Git (si hace falta).
- 1.3 Añadir `pnpm` scripts: `dev`, `build`, `preview`.
- 1.4 Instalar Tailwind, autoprefixer, postcss.
- 1.5 Configurar Tailwind (tailwind.config.cjs, styles/global.css).
- 1.6 Añadir React Router y dependencias (p. ej. `react-router-dom`).

Fase 2 — Estructura del proyecto y arquitectura
- 2.1 Crear carpetas: `src/pages`, `src/components`, `src/services`, `src/hooks`, `src/lib`.
- 2.2 Definir rutas: `/login`, `/create-password`, `/reset-password`, `/forgot-password`, `/dashboard`, `/admin/users`.
- 2.3 Crear layout base y manejo de rutas privadas (`PrivateRoute`).

Fase 3 — Servicios API y manejo de auth
- 3.1 Implementar `src/services/authService.js` basado en la guía (endpoints proporcionados).
- 3.2 Implementar `src/lib/api.js` con `fetch`/`axios` centralizado (baseURL desde env).
- 3.3 Interceptor global para 401: limpiar sesión y redirect a `/login`.
- 3.4 Funciones de almacenamiento: `saveAuth`, `getToken`, `getUser`, `clearAuth`.
- 3.5 Extra: considerar refresh token (si backend lo soporta) — si no, asegurar logout en 401.

Fase 4 — Implementación de pantallas (cada tarea pequeña y testable)
- 4.1 `Login` (UI): inputs, validación mínima, toggle visibilidad, loading, mensajes.
- 4.2 `Login` (logic): llamar `/auth/login`, guardar token y user, redirect a `/dashboard`.
- 4.3 `Create Password` (UI): extraer `token` de query, inputs (password + confirm), strength meter.
- 4.4 `Create Password` (logic): llamar `/auth/create-password` con token; manejar errores `WEAK_PASSWORD`, `ALREADY_HAS_PASSWORD`, `INVALID_TOKEN`.
- 4.5 `Forgot Password` (UI + logic): form email; siempre mostrar mensaje de éxito por seguridad.
- 4.6 `Reset Password` (UI + logic): similar a CreatePassword pero endpoint `/auth/reset-password`.
- 4.7 `Dashboard` (placeholder protegido): prueba de rutas privadas y logout.
- 4.8 `Admin /users` (UI + logic): formulario de registro email, manejar errores `EMAIL_ALREADY_EXISTS`, `FORBIDDEN`.

Fase 5 — Validaciones y UX
- 5.1 Implementar validaciones de password en cliente (8+, mayúscula, minúscula, número, no incluir email).
- 5.2 Medidor de fuerza (visual) y lista de requisitos dinámica.
- 5.3 Debounce en inputs sensibles (p. ej. check-email) para evitar spams.
- 5.4 Mostrar estados de loading y mensajes claros.

Fase 6 — Seguridad frontend y mitigaciones
- 6.1 Rate limiting local: debounce + per-endpoint cooldown (ej.: 1 request / 2s por acción) y bloquear UI temporalmente.
- 6.2 Protección contra bots: opcionalmente recaptcha en endpoints de alta sensibilidad (registro/forgot).
- 6.3 Sanitización de entradas (evitar inyección en outputs). Escapar cualquier HTML mostrado.
- 6.4 Evitar almacenamiento inseguro: no guardar contraseñas; tokens en localStorage (aceptable) o en memory + httpOnly si backend lo soporta.
- 6.5 Políticas CORS y configuración en Vercel (headers) — documentar con backend.
- 6.6 Verificar tokens de un solo uso: la UI debe detectar errores `TOKEN_ALREADY_USED`/`INVALID_TOKEN` y mostrar ruta para solicitar nuevo link.

Fase 7 — Pruebas y QA
- 7.1 Pruebas unitarias para `authService` y validadores de password.
- 7.2 Pruebas de integración (puede ser Cypress/Playwright) para flows: crear contraseña, login, reset.
- 7.3 Pruebas manuales y checklist (ver checklist en la guía).

Fase 8 — CI / Lint / Build
- 8.1 Configurar ESLint + Prettier; añadir script `pnpm lint`.
- 8.2 Añadir pipeline sencillo (GitHub Actions) que corra lint, tests y build.
- 8.3 Configurar `build` optimizado para Vercel (output directory: `dist`).

Fase 9 — Despliegue en Vercel y hardening final
- 9.1 Crear proyecto en Vercel, configurar variables de entorno (`VITE_API_URL`, rutas).
- 9.2 Revisar headers y políticas de seguridad (Content-Security-Policy, X-Frame-Options) en hosting.
- 9.3 Hacer un deploy de staging y comprobar endpoints en producción.

Fase 10 — Documentación y entrega
- 10.1 Actualizar `README.md` con instrucciones de instalación y comandos `pnpm`.
- 10.2 Documentar endpoints usados y comportamientos de error (basado en `GUIA_INTEGRACION_FRONTEND.md`).
- 10.3 Entregable: link a Vercel, instrucciones para admin y checklist completado.

Notas operativas y decisiones clave
- Tokens de un solo uso: el frontend debe depender de la respuesta del backend para saber si el token ya fue consumido. Si recibe `TOKEN_ALREADY_USED` o `INVALID_TOKEN`, mostrar mensaje y enlace a `/forgot-password`.
- Rate limiting: el backend debe protegerse también; en frontend implementaremos mitigaciones UX (debounce, bloqueo temporal) para reducir carga y abuso.
- Almacenamiento de token: usaremos `localStorage` por simplicidad, con comprobación de expiración JWT en cliente. Documentar riesgo y alternativas (cookies httpOnly si backend lo permite).

Entregables mínimos (MVP)
- Proyecto Vite funcionando con Tailwind.
- Páginas: Login, Create Password, Reset Password, Forgot Password, Dashboard mínimo, Admin users.
- authService y manejo de tokens completo.
- Protecciones básicas: debounce, bloqueo UI y manejo de errores 401/INVALID_TOKEN.
- README y plan de despliegue en Vercel.

Estimación aproximada (por fases, para planificación):
- Setup y estructura: 1 día
- Implementación pantallas + servicios: 3-4 días
- Seguridad y mitigaciones: 1-2 días
- Tests y CI: 1-2 días
- Despliegue y documentación: 0.5-1 día

Próximo paso sugerido (inmediato):
1) Confirmas si usamos JavaScript o TypeScript.  
2) Autorizas que inicie la tarea "Crear proyecto Vite" (ID 2 y 3 en la lista TODO).

---
Archivo generado automáticamente por la herramienta de planificación.
