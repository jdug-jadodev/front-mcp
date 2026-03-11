# One Spec (Root Spec)

## Objetivo

Documentar y especificar de forma práctica y ejecutable la **Fase 5 — Validaciones y UX** del frontend de autenticación. El objetivo es proporcionar reglas, flujos, criterios de aceptación, pruebas y notas de implementación claras para que el equipo pueda implementar las validaciones de contraseña y la experiencia de usuario asociada sin necesidad de clarificaciones adicionales.

## Alcance / No alcance

- Alcance: reglas de validación de contraseña en cliente, medidor de fuerza, mensajes y estados de UX, debounce y mitigaciones frontales para peticiones masivas, accesibilidad básica, mensajes de error mapeados a respuestas del backend, pruebas unitarias y de integración recomendadas, criterios de aceptación y recomendaciones de despliegue progresivo.
- No alcance: cambios en el backend (aunque se especifican contratos y códigos de error esperados), implementación de captchas en backend, almacenamiento httpOnly de tokens (solo recomendaciones), diseño visual final (se proporcionan pautas UI/UX pero no assets detallados).

## Definiciones (lenguaje de dominio)

- Token de un solo uso: token enviado por email para crear o resetear contraseña; caduca o se consume al usarse.
- Strength meter (medidor de fuerza): componente visual que indica la robustez de la contraseña con criterios cuantificables.
- Reglas de validación: checklist de requisitos que una contraseña debe cumplir en cliente antes de enviarse al servidor.
- Debounce: técnica para prevenir múltiples envíos rápidos desde la UI.

## Principios / Reglas no negociables

- Seguridad primero: validar en cliente para mejorar UX, pero el backend es la fuente de verdad para aceptación final.
- Feedback inmediato y claro: cada fallo debe mostrar un mensaje legible y una recomendación accionable.
- No exponer datos sensibles: no mostrar contraseñas en logs ni mensajes, no almacenar contraseñas en localStorage.
- Accesibilidad: todos los inputs, mensajes y el medidor deben ser accesibles por lector de pantalla y navegables por teclado.

## Límites

- El cliente valida fuerza y formato; el backend puede devolver errores adicionales (p. ej. "WEAK_PASSWORD", "ALREADY_HAS_PASSWORD"). El cliente debe mapear y mostrar estos errores.
- El medidor de fuerza es una ayuda visual y no sustituye la comprobación del backend.

## Eventos y estados (visión raíz)

- Eventos relevantes:
	- Usuario escribe en el campo `password`.
	- Usuario escribe en `confirmPassword`.
	- Usuario envía el formulario `create-password` o `reset-password`.
	- Backend responde con éxito/errores.
	- Usuario intenta reenviar repetidamente (debounce/lock triggers).

- Estados UI principales:
	- Idle (esperando input).
	- Validating (client-side checks running).
	- ReadyToSubmit (validaciones locales OK, botón habilitado).
	- Submitting (loading, bloqueado para reenvío).
	- Success (contraseña creada/reset exitosa).
	- ErrorRecoverable (p. ej. weak password, invalid token).
	- ErrorFatal (p. ej. TOKEN_ALREADY_USED — redirigir a flujo /forgot-password).

## Criterios de aceptación (Fase 5)

- 1) Validaciones cliente: el formulario de `Create Password` / `Reset Password` debe verificar en tiempo real que la contraseña cumple las reglas mínimas y deshabilitar el envío en caso contrario.
	- Reglas mínimas por defecto (configurable): longitud >= 8, al menos 1 mayúscula, 1 minúscula, 1 dígito, 1 carácter especial (desde el conjunto !@#$%^&*()-_+=), no contener el email o partes significativas del nombre del usuario.
	- Reglas opcionales: comprobación contra lista de contraseñas comunes (top 10000) y rechazo con explicación "contraseña demasiado común".

- 2) Medidor de fuerza: mostrar 4 estados (Weak, Fair, Good, Strong) calculados con una métrica reproducible (puntos por regla + penalizaciones). El medidor debe actualizarse conforme el usuario escribe y explicar qué falta para subir de nivel.

- 3) Confirmación de contraseña: `confirmPassword` debe compararse en tiempo real y mostrar diferencia si no coinciden.

- 4) Mensajes de error del servidor: mapear códigos de error a UI:
	- `WEAK_PASSWORD` -> Mostrar detalle y mantener al usuario en formulario con sugerencias.
	- `INVALID_TOKEN` -> Mostrar mensaje con CTA para pedir nuevo link (redirigir a `/forgot-password`).
	- `TOKEN_ALREADY_USED` -> Mostrar mensaje que enlace a `/forgot-password` con explicación.
	- `ALREADY_HAS_PASSWORD` -> Mostrar mensaje informativo y enlace a `/login` o a recuperar contraseña.
	- `TOO_MANY_REQUESTS` o 429 -> Mostrar bloqueo temporal UI y cooldown visible.

- 5) Rate limit UX: si el usuario intenta enviar repetidamente, bloquear el botón por 2s-5s (configurable) y mostrar contador. Debounce en cambios de input para evitar llamadas externas no necesarias (p. ej. check-email).

- 6) Accesibilidad: todos los mensajes deben usar `aria-live` para lecturas, labels correctamente ligados y contraste suficiente para barras del medidor.

- 7) Tests: cubrir las validaciones con tests unitarios (validators) y al menos 2 flujos E2E: crear contraseña exitosa y manejo de token inválido.

## Especificación técnica y steps de implementación (guía paso a paso)

1) Reglas y librería de validación
	- Crear `src/lib/validators/password.ts` con funciones puras:
		- `validatePasswordRules(password: string, {email?: string}): ValidationResult` — devuelve {ok: boolean, hints: string[], failedRules: string[]}
		- `calculatePasswordStrength(password: string, options?): number` — devuelve 0..100 y un `level` derivado (Weak/Fair/Good/Strong).
	- Incluir tests unitarios para cada regla y combinaciones límite.

2) Componente `PasswordStrengthMeter`
	- Props: `value` (0-100), `hints: string[]`, `level`.
	- Visual: barra en 4 segmentos con color y texto; show list of unmet requirements (accessible toggle).
	- `aria-live="polite"` para notificar cambios de nivel.

3) Formulario `CreatePassword` / `ResetPassword`
	- UX behaviour:
		- Validación en onChange con debounce 200ms solo para cálculos pesados (p. ej. strength + top10000 check).
		- Validación onBlur inmediata para asegurar feedback.
		- Botón enviar habilitado solo cuando `validatePasswordRules().ok && password === confirmPassword`.
		- Al enviar: cambiar estado a `Submitting`, bloquear inputs y mostrar spinner en botón.
	- En caso de error del backend:
		- Mostrar banner/snackbar con error mapeado.
		- Si el error es `INVALID_TOKEN` o `TOKEN_ALREADY_USED`, mostrar CTA claro: "Solicita un nuevo enlace" -> `/forgot-password`.

4) Debounce y bloqueo de reenvío
	- Implementar utilitario `useCooldown(key, ms)` o un hook `useRequestLock(ms)` que impide reenvíos por X ms y devuelve `locked` y `remainingMs`.
	- En botón de submit, si `locked`, mostrar el contador regresivo.

5) Mensajes y copywriting
	- Mensajes cortos, accionables y sin tecnicismos.
	- Ejemplos:
		- Weak: "Tu contraseña es débil — añade mayúsculas, números y símbolos." (además mostrar lista de requisitos que faltan).
		- Invalid token: "Este enlace ya no es válido. Solicita un nuevo enlace aquí." [CTA].

6) Accesibilidad y tests
	- Inputs con `aria-describedby` enlazando mensajes de error.
	- Medidor con `role="progressbar"` y `aria-valuenow`.
	- Tests unitarios: `validators` cubiertos >95% de reglas.
	- Tests E2E (Playwright/Cypress): flujo exitoso + `INVALID_TOKEN` flow. Incluir aserciones de mensajes y redirecciones.

7) Observabilidad y métricas
	- Emitir eventos analíticos mínimos (configurable): `password_strength_submitted(level)`, `password_creation_failed(code)`, `password_creation_success`.
	- Monitorizar frecuencias de `INVALID_TOKEN` y `TOKEN_ALREADY_USED` para detectar problemas con flujos de emails.

8) Rollout y feature flags
	- Entregar medidor y validaciones detrás de un flag/desplegable por entorno para permitir rollback rápido.

## Contratos API y manejo de errores (cliente ↔ backend)

- Endpoint esperado: `POST /auth/create-password` y `POST /auth/reset-password`
	- Request body: { token: string, password: string }
	- Success: 200 { message: "PASSWORD_SET" } o 204.
	- Error responses (ejemplos):
		- 400 { code: "WEAK_PASSWORD", message: "Weak password" }
		- 400 { code: "ALREADY_HAS_PASSWORD", message: "User already has password" }
		- 401 { code: "INVALID_TOKEN", message: "Invalid or expired token" }
		- 409 { code: "TOKEN_ALREADY_USED", message: "Token already used" }
		- 429 { code: "TOO_MANY_REQUESTS", message: "Rate limit exceeded" }

- El cliente debe mapear cada `code` a un mensaje UX y a un `action` recomendado (ej. redirect to `/login`, show CTA to `/forgot-password`).

## Reglas de validación sugeridas (implementación por defecto)

- Reglas base (activas por defecto):
	1. Longitud mínima: 8 caracteres.
	2. Al menos 1 letra mayúscula.
	3. Al menos 1 letra minúscula.
	4. Al menos 1 dígito.
	5. Al menos 1 carácter especial del conjunto permitido.
	6. No contener el email (comparación case-insensitive; comprobar subcadenas >3 caracteres).
	7. No estar en la lista común de contraseñas (opcional según tamaño de lista; implementable con check asíncrono o en-build).

- Penalizaciones:
	- Secuencias comunes ("1234", "abcd") reducen fuerza.
	- Repeticiones largas ("aaaaaa") reducen fuerza.

## Métrica de fuerza (algoritmo simple reproducible)

- Puntos iniciales = 0.
- Sumar puntos: +20 por cada regla base cumplida (hasta 100).
- Penalizaciones hasta -40 por patrones débiles.
- Mapear puntos a niveles: 0-39 Weak, 40-59 Fair, 60-79 Good, 80-100 Strong.

## Casos de prueba (criterios detallados)

- Unitarios para `validatePasswordRules`:
	- password corto -> falla longitud.
	- password sin mayúscula -> falla regla.
	- password que contiene email -> falla.
	- password común -> falla (si lista activa).

- E2E:
	- Flujo feliz: token válido -> crear contraseña que cumple reglas -> redirect a `/login` con mensaje success.
	- Token inválido: token inválido -> mostrar mensaje y CTA a `/forgot-password`.
	- Weak server rejection: enviar contraseña que pasa cliente pero backend devuelve `WEAK_PASSWORD` -> mostrar mensaje específico y mantener en formulario.

## Recomendaciones de diseño UI (breves)

- Colores del medidor: rojo (Weak), naranja (Fair), amarillo-verde (Good), verde (Strong). Asegurar contraste y alternativas de texto.
- Mostrar checklist desplegable con iconos claros (check / cross) para requisitos de contraseña.
- Evitar revelar qué parte exacta del token es inválida; el mensaje debe ser genérico por seguridad.

## Monitoreo y alertas

- Configurar alertas para picos de `INVALID_TOKEN` y `TOKEN_ALREADY_USED`.
- Loggear eventos de fallos críticos (no contraseñas) con metadata: endpoint, IP (si procede), timestamp.

## Requisitos para entrega y aceptación

- Código: `src/lib/validators/password.ts`, `src/components/PasswordStrengthMeter.tsx`, `src/pages/CreatePassword.tsx`.
- Tests unitarios para validators, tests E2E para los flujos descritos.
- Documentación: actualizar `README.md` con configuración de reglas y feature flags.
- Demo manual: ejecutar flujo con token válido y con token inválido; capturar screenshots y pasos reproducibles.

## Trazabilidad

- Esta especificación deriva de `PLAN_DE_TRABAJO.md` (Fase 5) y de las guías operativas del repositorio. Cada item de la Fase 5 está aquí desglosado en artefactos de implementación (validators, componentes, tests, contratos API). Los criterios de aceptación están mapeados a pruebas unitarias y E2E.

---
Especificación generada para implementación inmediata. Para el siguiente paso propongo: (1) crear los archivos de validators y tests, (2) implementar el medidor y conectar al formulario `CreatePassword`, (3) ejecutar las pruebas unitarias y E2E.