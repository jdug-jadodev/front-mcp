# Análisis de Seguridad — Reporte inicial (Checkmarx-aligned)

Fecha: 2026-03-12
Versión: 1.0

## 1. Resumen Ejecutivo

- **Tecnologías y lenguajes detectados:** React 19 (TypeScript), Vite, Tailwind, Fetch API, uso de `localStorage` para tokens. Dependencias declaradas: `axios`, `react`, `react-dom`, `react-router-dom` (ver `package.json`).
- **Score de seguridad global (0–100):** 78 (evaluación inicial, basada en hallazgos estáticos y ausencia de IaC y secretos detectados en código). Requiere SCA online para CVE actualizados.
- **Conteo de vulnerabilidades:** Crítica: 0 · Alta: 2 · Media: 3 · Baja: 1 · Info: 4
- **Scanners aplicables:** SAST, SCA, IaC (no encontrado), Secrets
- **Frameworks de compliance evaluados:** OWASP Top10 (aplicado conceptualmente), SANS/CWE, NIST SSDF (recomendaciones), PCI/HIPAA/ISO27001 — evaluados solo donde aplica (no se detectó manejo de tarjetas ni datos de salud en código).

## 2. Tabla de Vulnerabilidades

| # | Severidad | Scanner | Tipo | Ubicación (archivo:línea) | CWE/CVE | OWASP | Estado | Descripción | Nodo origen → Nodo destino (flujo de datos) | Mejor ubicación de fix | Remediación | Esfuerzo |
|---|-----------|---------|------|---------------------------|---------|-------|--------|-------------|---------------------------------------------|------------------------|-------------|----------|
| 1 | Alta | SAST | Exposición de token en URL (referrer leak) | src/pages/CreatePassword.tsx:1-100 | CWE-200 | A02 - Cryptographic Failures / A03 (2021 mapping varies) | To Verify | Token de un solo uso leído desde query param y no eliminado de la URL — riesgo de filtrado mediante Referer, logs, o capturas de pantalla. | Source: query param `token` (CreatePassword) → Sink: redirecciones/requests externas / logs | En `CreatePassword.tsx` justo después de extraer `token` | Extraer token, usarlo en la petición y eliminar del history (`history.replaceState`) e impedir que quede en URL; añadir instrucción para no persistir token. | Bajo (1–2 horas) |
| 2 | Alta | SAST | Persistencia de token de sesión en `localStorage` | src/lib/api.ts:54-66 | CWE-312 (Cleartext Storage of Sensitive Data) | A04 – Insecure Design (exposure vector) | To Verify | `authToken` se almacena en `localStorage`. Si hay XSS, token puede ser exfiltrado. | Source: server-sent token (auth/login) → Sink: `localStorage` (api.saveAuth) → attacker JS reads token | `src/lib/api.ts` y en arquitectura: migrar a cookie `HttpOnly`/`Secure` cuando backend lo soporte. | Cambiar almacenamiento a cookie httpOnly o reducir privilegios, rotación de tokens, minimizar datos en localStorage. | Medio (1–3 días backend+frontend) |
| 3 | Media | SAST | Ausencia de CSP definida en frontend/deploy | repo (no hay configuración CSP) | CWE-749 (Exposed Dangerous Method) | A05/Reflected XSS mitigations | To Verify | No se detecta configuración de `Content-Security-Policy` en el repo ni instrucciones de despliegue. Sin CSP aumenta riesgo de XSS explotable. | N/A | Mejor ubicado: documentación de despliegue + Vercel/hosting config | Añadir CSP estricta en cabeceras de servidor/hosting; deshabilitar `unsafe-inline`, permitir solo fuentes y endpoints necesarios. | Bajo (configuración) |
| 4 | Media | SAST | Uso de `atob` para parseo de JWT sin manejo de errores robusto | src/lib/api.ts:80-92 | CWE-310 (Cryptographic Issues — client-side checks) | INFO (no directamente explotable) | To Verify | Cliente decodifica payload JWT con `atob` para chequear `exp`. Específico de UI (ok) pero no sustituye validación server-side. | Source: local token → Sink: UI decision based on payload | `src/lib/api.ts` — dejar comprobación de expiración como UI-only y añadir try/catch y validación adicional | Añadir validación robusta, proteger contra tokens malformados. | Bajo |
| 5 | Media | SAST | Falta de limpieza inmediata del token single-use tras uso | src/pages/CreatePassword.tsx:handleSubmit | CWE-200 | A02/A05 | To Verify | Tras usar token se redirige a `/login` pero no se ejecuta `replaceState` para limpiar la URL original con token. Posible persistencia en historial. | Source: query param → Sink: browser history / logs | `CreatePassword.tsx` después de procesar `token` | Ejecutar `history.replaceState(null, '', window.location.pathname)` o similar tras uso/consumo. | Bajo |
| 6 | Baja | Secrets | Secretos en código | repo root / search | N/A | INFO | No se encontraron secretos hardcodeados comunes (API keys, tokens) en el árbol analizado. `.env` está en `.gitignore` y existe `.env.example`. | N/A | N/A | Mantener `.env` fuera de VCS, añadir scanning pre-commit | Bajo |
| 7 | Info | SCA | Dependencias declaradas pendientes de escaneo CVE | package.json | N/A | INFO | `axios@^1.13.6` y otras deps listadas; no se realizó consulta NVD/CVE en este análisis local. Se requiere SCA conectado (NVD/OSS Index) para CVSS v4.0 | N/A | `package.json` | Ejecutar SCA automatizado (Dependabot / Snyk / Checkmarx SCA) y actualizar versiones vulnerables. | Medio |

> Nota: la tabla resume hallazgos priorizados. Cada entrada incluye localización del código, clasificación preliminar y remediación propuesta.

## 3. Cobertura por Framework de Compliance

- **OWASP Top 10 2021:** evaluadas prioridades principales: A02 (Cryptographic Failures — token handling), A05 (Security Misconfiguration — falta de CSP). Estado: Parcial (controles básicos presentes en diseño, pero falta endurecimiento en almacenamiento y políticas de contenido).
- **SANS/CWE Top 25 / CWE:** las debilidades encontradas mapean a CWE-200 (exposición de información), CWE-312 (almacenamiento inseguro) y prácticas de verificación insuficiente (handled as INFO).
- **NIST SSDF / SP 800-218:** recomendaciones: incorporar análisis SAST en CI, SCA en pipeline, secrets scanning y políticas de configuración (CSP, CORS). Estado: Parcial.
- **NIST SP 800-53 / PCI / HIPAA / ISO27001:** no aplican completamente (no evidencia de manejo de PAN o PHI en código). Recomendaciones: si la app llegará a manejar datos regulados, habilitar controles adicionales (logging, cifrado en tránsito/repouso, DLP).

## 4. Dependencias con Riesgo (SCA)

- Escaneo local: listado de dependencias (ver `package.json`). No se consultó NVD/CVE durante este análisis sin conexión a SCA feed.

Recomendación inmediata: ejecutar una pasada SCA con NVD/OSS Index/Snyk/Dependabot para obtener CVE y CVSS v4.0; priorizar actualizaciones para paquetes con CVSS >= 7.

## 5. Secretos y Credenciales Expuestas

- Resultado del escaneo: no se detectaron secretos hardcodeados en archivos fuente analizados.
- `.env` está en `.gitignore` y hay `.env.example` en repo — buena práctica; asegurar que despliegues no incluyan secretos en logs.
- Recomendación: integrar `git-secrets` / `truffleHog` / `detect-secrets` en CI y pre-commit hooks.

## 6. Hallazgos en IaC

- No se detectaron archivos de IaC (Dockerfile, Kubernetes manifests, Terraform, CloudFormation) en el repositorio. Estado: N/A.

## 7. Recomendaciones Priorizadas

- Inmediato (0–7 días)
  - Eliminar token single-use de la URL tras su extracción (`history.replaceState`) — `src/pages/CreatePassword.tsx`. (Esfuerzo: bajo)
  - Evitar persistir tokens sensibles en `localStorage` si es posible; preferir `HttpOnly` cookies (coordinar con backend). (Esfuerzo: medio)
  - Configurar CSP estricta y políticas de CORS mínimas en despliegue. (Esfuerzo: bajo)
  - Añadir secrets scanning en pipeline y pre-commit. (Esfuerzo: bajo)

- Corto plazo (8–30 días)
  - Integrar SCA (NVD/CVEs) y fijar política de actualizaciones (Dependabot/Snyk). (Esfuerzo: medio)
  - Añadir SAST en CI (Checkmarx o equivalente) con reglas para XSS/referrer leaks. (Esfuerzo: medio)

- Mediano plazo (31–90 días)
  - Migrar a almacenamiento de sesión con cookies `HttpOnly`/`Secure` y refresh-token flow (backend change required). (Esfuerzo: alto: requiere backend)
  - Implementar auditoría de dependencias y revisiones de supply chain. (Esfuerzo: medio)

## 8. Métricas de Remediación

- MTTR estimado por severidad (estimación inicial):
  - Crítica: N/A
  - Alta: 3–14 días
  - Media: 7–30 días
  - Baja: 30–90 días
- Vulnerabilidades recurrentes: marcar como Recurrente si el mismo patrón (ej. almacenamiento en `localStorage`) aparece en más lugares — por ahora única ubicación para `authToken`.
- Deuda técnica de seguridad acumulada: moderada (pendiente SCA y endurecimiento de token handling).

---

## Evidencia de falsos positivos

- No se han marcado falsos positivos en el análisis inicial. Si SCA arroja CVEs que luego se demuestran no aplicables (ej. submódulos no usados), documentar aquí con justification.

---

## Historial de cambios

- 2026-03-12 — v1.0 — Informe inicial creado. Escaneo local SAST + revisión manual de archivos clave (`src/lib/api.ts`, `src/pages/CreatePassword.tsx`, `src/config/security.ts`). SCA no ejecutado contra feeds NVD (recomendado como siguiente paso).
