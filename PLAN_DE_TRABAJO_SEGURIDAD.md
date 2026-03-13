# Plan de Trabajo — Remediación de Brechas de Seguridad

Fecha: 2026-03-12
Resumen: Plan detallado y dividido por fases para corregir y endurecer el frontend frente a las brechas listadas en `brechas-seguridad.md`.

**Objetivo**: Priorizar correcciones de mayor riesgo (tokens en URL, almacenamiento en localStorage), mitigar ataques de fuerza bruta y fortalecer rutas sensibles (crear/recuperar contraseñas).

Fases y tareas (tareas muy pequeñas y accionables):

---

## Fase 0 — Preparación y Triaging (0.5 día)
- 0.1: Revisar el informe `brechas-seguridad.md` y confirmar hallazgos.
- 0.2: Ejecutar búsqueda rápida en repo por `authToken`, `localStorage`, `token` y `CreatePassword`.
- 0.3: Crear rama `fix/security-auth-<fecha>` para cambios iniciales.

Archivos clave a revisar: `src/pages/CreatePassword.tsx`, `src/lib/api.ts`, `src/config/security.ts`.

---

## Fase 1 — Correcciones Inmediatas (0–2 días)
Prioridad: alta

- 1.1: Añadir limpieza del token single-use en URL
  - Tarea pequeña: en `src/pages/CreatePassword.tsx` después de consumir `token` ejecutar:
    - `history.replaceState(null, '', window.location.pathname)` o equivalente en React Router.
  - Verificar que la URL ya no contenga `?token=`.

- 1.2: Evitar persistir tokens sensibles en `localStorage` (mitigación rápida)
  - Tarea pequeña: en `src/lib/api.ts` identificar `saveAuth` o similar y comentar/guardar temporalmente en memoria (ej. variable en módulo) con TODO para migrar.
  - Añadir `// TODO: migrate to HttpOnly cookie` y pruebas manuales.

- 1.3: Añadir try/catch al decodificar JWT en cliente
  - Tarea pequeña: rodear `atob` / parseo con try/catch y fallback que invalide token si malformado.

- 1.4: Proteger acceso cliente a rutas de cambio/creación de contraseña
  - Tarea pequeña: en `CreatePassword` y `ResetPassword` validar que `token` provenga del servidor (llamada de verificación) antes de renderizar formulario.
  - Mostrar mensaje genérico y no permitir acceso si verificación falla.

---

## Fase 2 — Endurecimiento UI contra fuerza bruta y abuso (1–3 días)
Prioridad: alta/mediana

- 2.1: Implementar bloqueo temporal por intentos (cliente)
  - Tarea: Reusar `src/hooks/useCooldown.ts` para deshabilitar botón de login tras N fallos (configurable).
  - Subtareas pequeñas:
    - 2.1.1: Contar intentos fallidos en sesión (no persistir a localStorage permanentemente).
    - 2.1.2: Mostrar contador y tiempo restante.

- 2.2: Deshabilitar interfaz tras demasiados intentos y mostrar mensaje
  - Tarea: on 5 fallos en 10 minutos -> bloquear 15 minutos. Implementar UI y mensaje claro.

- 2.3: Implementar protección en endpoints (coordinar con backend)
  - Tarea: Crear issue/epic para backend: rate-limiting por IP/username, captcha opcional tras X intentos.

---

## Fase 3 — Políticas de Contenido y Configuración (0.5–1 día)
Prioridad: media

- 3.1: Añadir recomendaciones CSP en documentación de despliegue
  - Tareas pequeñas:
    - 3.1.1: Crear sección en `GUIA_INTEGRACION_FRONTEND.md` con cabeceras sugeridas: `Content-Security-Policy` estricta (no `unsafe-inline`), `X-Frame-Options`, `Referrer-Policy`.
    - 3.1.2: Ejemplo de política mínima para la app.

- 3.2: Configurar `Referrer-Policy: no-referrer-when-downgrade` o más restrictiva según hosting.

---

## Fase 4 — Hardening de Autenticación (requiere backend) (3–14 días)
Prioridad: alta (arquitectural)

- 4.1: Migración a cookie `HttpOnly`/`Secure` para `authToken`
  - Tareas pequeñas:
    - 4.1.1: Definir contrato con backend (endpoints `POST /auth/login` devuelve Set-Cookie HttpOnly).
    - 4.1.2: Cambiar frontend para no escribir token en `localStorage` y usar llamadas sin Authorization header (backend lee cookie).
    - 4.1.3: Añadir endpoint `POST /auth/refresh` si se necesita refresh token.

- 4.2: Plan de rollback temporal si backend no puede cambiar de inmediato
  - Tarea: utilizar almacenamiento en memoria + short-lived token + mínimo persistente localStorage con cifrado (solo si imprescindible) y marcar como mitigación temporal.

---

## Fase 5 — Calidad, Pruebas y CI (2–7 días)
Prioridad: media

- 5.1: Añadir pruebas unitarias para flujo de creación/reset de contraseña
  - Tareas: tests que verifiquen que el token se limpia, que rutas bloqueadas no muestran formulario sin verificación.

- 5.2: Pruebas e2e (Playwright/Cypress) para flujos de login, reset y lockout
  - Subtareas: script que simule intentos fallidos y verifique bloqueo.

- 5.3: Integrar SCA en CI
  - Tareas: añadir Dependabot config o Snyk/OSS Index en pipeline y reportes automáticos.

- 5.4: Agregar secrets scanning en pre-commit
  - Tarea: añadir `husky` + `detect-secrets` o `git-secrets` y rule básica.

---

## Fase 6 — Documentación y PRs (continuo)

- 6.1: Documentar cada cambio en PR con referencia a `brechas-seguridad.md` y los riesgos mitigados.
- 6.2: Actualizar `brechas-seguridad.md` con estado (parcial/completado) por cada ítem.
- 6.3: Entregar checklist de QA para revisión de seguridad.

---

## Tareas técnicas concretas (paso a paso corto) — Ejecución inmediata
1. Crear rama: `git checkout -b fix/security-auth-<fecha>`
2. Abrir `src/pages/CreatePassword.tsx` y añadir replaceState tras consumo de token.
3. En `src/lib/api.ts` comentar persistencia a localStorage y mantener token en memoria con TODO.
4. Añadir try/catch al parseo de JWT en `src/lib/api.ts`.
5. Reusar `src/hooks/useCooldown.ts` en `src/pages/Login.tsx` para bloquear tras 5 intentos.
6. Crear PR describiendo cambios y tests pendientes.

Comandos útiles:

```
# Instalar deps (si hace falta)
pm install

# Ejecutar tests (si existen)
pm run test

# Ejecutar dev
npm run dev
```

---

## Estimaciones y prioridades rápidas
- Crítico / inmediato: 1.1, 1.2, 1.3, 1.4 (0–2 días)
- Alto (requiere coordinación backend): 4.1, 4.2 (3–14 días)
- Mediano: 2.x (UI lockout), 3.x (CSP), 5.x (CI) (1–7 días)

---

## Riesgos y notas
- Migración a cookies `HttpOnly` requiere cambios backend; coordinar antes de eliminar token client-side permanentemente.
- Las mitigaciones client-side (lockout UI) ayudan pero no sustituyen controles server-side (rate-limit, captcha).

---

Si quieres, procedo ahora a:
- aplicar el cambio inmediato en `src/pages/CreatePassword.tsx` (añadir replaceState) y en `src/lib/api.ts` mitigar persistencia, o
- primero ejecutar la búsqueda en el repo y listar todas las ocurrencias para planificar PRs.

Archivo creado: `PLAN_DE_TRABAJO_SEGURIDAD.md`
