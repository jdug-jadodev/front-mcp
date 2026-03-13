# One Spec (Root Spec)

## Objetivo

Proveer una especificación técnica clara, reproducible y accionable para implementar y verificar las correcciones de seguridad priorizadas en la **Fase 1 — Correcciones Inmediatas** (tokens en URL, persistencia de tokens en localStorage, manejo de JWT malformados y protección de rutas de cambio/recuperación de contraseña) del plan de remediación.

## Alcance / No alcance

- Alcance: Cambios en el frontend del repositorio `front-mcp` para mitigar exposiciones de tokens y endurecer flujos de creación/recuperación de contraseña a nivel de UI y cliente.
- No alcance: Cambios en backend (migración a HttpOnly cookies), despliegue de políticas CSP en servidores, y controles server-side (rate-limiting) — aunque se incluye checklist y requerimientos para coordinar con backend.

## Definiciones (lenguaje de dominio)

- Token single-use: token único enviado por email para creación/reset de contraseña (vía query param `?token=`).
- Auth token: token JWT usado para autenticación de usuario (actualmente guardado en cliente en algunos flujos).

## Principios / Reglas no negociables

- Nunca dejar tokens sensibles visibles en la URL después de su consumo.
- Evitar persistir tokens sensibles en `localStorage`.
- Validar y verificar tokens con el backend antes de mostrar formularios sensibles.
- Manejar defensivamente parseos/decodificaciones de JWT en cliente (try/catch).

## Límites

- La solución de Fase 1 es una mitigación y endurecimiento en frontend; la migración completa a cookies `HttpOnly` requiere coordinación con backend (ver Fase 4 en `PLAN_DE_TRABAJO_SEGURIDAD.md`).

## Eventos y estados (visión raíz)

- Evento: usuario abre enlace de creación/reset con `?token=` → Estado: token en query
- Evento: frontend valida token con backend → Estado: token válido / inválido
- Evento: formulario consumido → Estado: token consumido y URL limpia

## Criterios de aceptación (Fase 1)

- La URL ya no contiene `?token=` tras consumirlo (verificación manual y pruebas automatizadas).
- El frontend NO persiste tokens sensibles en `localStorage` (se documenta la mitigación y TODO para migración a cookie HttpOnly).
- Parseo de JWT en cliente está protegido con try/catch y tokens malformados son invalidados y tratados de forma segura.
- Rutas `CreatePassword` y `ResetPassword` sólo muestran formularios tras verificación exitosa del token con backend; si falla, mostrar mensaje genérico y no permitir interacción.

## Solución detallada — Fase 1 (Correcciones Inmediatas)

Resumen: aplicar cuatro correcciones concretas (1.1–1.4) y pasos de verificación. Cada paso incluye archivos a tocar, ejemplo de cambio, criterios de aceptación y pruebas sugeridas.

- 1.1 — Limpiar token single-use de la URL tras su consumo
	- Objetivo: eliminar `?token=` de la barra de direcciones inmediatamente después de usarlo.
	- Archivos: `src/pages/CreatePassword.tsx`, `src/pages/ResetPassword.tsx` (si existe duplicado).
	- Implementación (ejemplo): después de extraer y usar `token` ejecutar:
		- JavaScript puro (compatibilidad máxima):
			- `window.history.replaceState(null, '', window.location.pathname);`
		- React Router v6 (si se usa `useNavigate`):
			- `navigate(window.location.pathname, { replace: true });` (preferible cuando el hook está disponible).
	- Requisitos adicionales: sólo ejecutar la limpieza tras confirmación de que el token fue enviado a backend para verificación/consumo.
	- Criterio de Aceptación: la URL no incluye `token` tras renderizar el formulario. Prueba: copiar enlace con token, abrirlo y verificar barra de direcciones.

- 1.2 — Evitar persistir tokens sensibles en `localStorage`
	- Objetivo: eliminar escritura de tokens sensibles en `localStorage`; usar almacenamiento en memoria del módulo como mitigación temporal y añadir TODO para migración a cookie `HttpOnly`.
	- Archivo: `src/lib/api.ts` (o donde esté la función que guarda `authToken`).
	- Implementación sugerida:
		- Introducir una variable de módulo `let inMemoryAuthToken: string | null = null;`
		- Reemplazar `localStorage.setItem('authToken', token)` por `inMemoryAuthToken = token; // TODO: migrate to HttpOnly cookie`.
		- Proveer getters `getAuthToken()` que lean `inMemoryAuthToken`.
		- Añadir comentario y marcar PR con referencia a `PLAN_DE_TRABAJO_SEGURIDAD.md#4.1` para coordinar migración backend.
	- Criterio de Aceptación: no hay nuevos commits que escriban `authToken` en `localStorage`; los tests de integración manual verifican login funcionando con token en memoria durante la sesión.

- 1.3 — Añadir try/catch al decodificar JWT en cliente
	- Objetivo: evitar excepciones no controladas al llamar `atob` o al parsear payloads JWT malformados.
	- Archivo: donde se haga parseo del JWT (buscar en `src/lib/api.ts`, `src/lib/*`, o utilitarios de auth).
	- Implementación sugerida (ejemplo):
		- function safeParseJwt(token) {
				try {
					const payload = JSON.parse(atob(token.split('.')[1]));
					return payload;
				} catch (e) {
					return null; // considerar logout/invalida token
				}
			}
	- Acciones posteriores: si `safeParseJwt` retorna `null`, invalidar token en memoria y redirigir al login o mostrar mensaje genérico.
	- Criterio de Aceptación: cliente no lanza errores en consola por JWT malformados; flujo de error tratado de forma segura.

- 1.4 — Proteger acceso cliente a rutas de cambio/creación de contraseña
	- Objetivo: no renderizar formularios de creación/reset de contraseña sin verificar el `token` con el backend.
	- Archivos: `src/pages/CreatePassword.tsx`, `src/pages/ResetPassword.tsx`.
	- Implementación:
		1. Al montar la página, extraer `token` de query.
		2. Llamar a endpoint de verificación: `POST /auth/verify-reset-token` (o endpoint existente) con `token`.
		3. Mientras espera, mostrar loader. Si la verificación es OK -> renderizar formulario; si falla -> mostrar mensaje genérico (e.g., "Enlace inválido o expirado") y deshabilitar inputs.
		4. Sólo tras la verificación exitosa permitir enviar nuevo password; tras envío y consumo, limpiar token de la URL (ver 1.1).
	- Ejemplo de flujo asíncrono (pseudocódigo):
		- useEffect(() => { async verify(){ setLoading(true); const ok = await api.verifyResetToken(token); setLoading(false); setVerified(ok); if(!ok) setError(true); } verify(); }, [token]);
	- Criterio de Aceptación: no se puede interactuar con el formulario sin verificación; endpoints con token inválido devuelven UI segura.

## Pasos concretos de implementación (orden recomendado)

1. Crear branch: `fix/security-auth-<YYYYMMDD>`.
2. Localizar funciones/archivos: `src/pages/CreatePassword.tsx`, `src/lib/api.ts`, y cualquier utilitarios de JWT.
3. Implementar `verifyResetToken` llamado al backend y la lógica de `loading/verified/error` en `CreatePassword.tsx`.
4. Añadir `window.history.replaceState(...)` justo después de consumir el token y antes de mostrar el formulario o tras el submit exitoso.
5. Cambiar persistencia de token: mover de `localStorage` a `inMemoryAuthToken` en `src/lib/api.ts` y añadir comentario `// TODO: migrate to HttpOnly cookie`.
6. Implementar `safeParseJwt` y utilizarla en todos los lugares que parsean el token.
7. Ejecutar pruebas manuales y automatizadas (listadas abajo).
8. Crear PR con descripción que referencie `brechas-seguridad.md` y `PLAN_DE_TRABAJO_SEGURIDAD.md`, listando riesgos mitigados y pasos faltantes (migración backend).

## Pruebas y verificación

- Prueba manual 1 (token en URL): abrir enlace con `?token=abc`, confirmar que la página verifica el token, muestra formulario y la URL queda limpia.
- Prueba manual 2 (token inválido): abrir enlace con token inválido/expirado -> UI muestra mensaje genérico y no permite ingreso de contraseña.
- Prueba automática (unit): testear `safeParseJwt` con token válido y malformado.
- Prueba automática (integration): simular petición `verifyResetToken` mockeada con respuestas OK/KO y verificar renderizado condicional.

## Checklist de PR (mínimo)

- [ ] Branch `fix/security-auth-<fecha>` creado.
- [ ] `CreatePassword.tsx` valida token antes de renderizar y limpia URL después del consumo.
- [ ] `src/lib/api.ts` no persiste tokens en `localStorage`; utiliza `inMemoryAuthToken` temporalmente.
- [ ] `safeParseJwt` implementado y usado donde aplica.
- [ ] Tests unitarios para `safeParseJwt` y tests de integración básicos para `CreatePassword`.
- [ ] Documentación en PR que indique los siguientes pasos (migración a cookies, coordinación backend).

## Estimación y recursos

- Tiempo estimado: 0.5–2 días (dependiendo de pruebas e integraciones con backend).
- Riesgos: dependencias en endpoints backend de verificación, posibles rutas/uso distinto de React Router en la app.

## Riesgos y mitigaciones

- Riesgo: Backend no tiene endpoint de verificación -> Mitigación: crear issue/epic con requerimiento y aplicar validación parcial (intentar verificación, si no existe, añadir comprobación heurística temporal + advertencia en PR).
- Riesgo: Cambiar persistencia rompe sesiones existentes -> Mitigación: mantener compatibilidad de lectura pero evitar nuevas escrituras a `localStorage`, documentar en PR y coordinar despliegue.

## Trazabilidad

- Este documento implementa las tareas 1.1–1.4 de `PLAN_DE_TRABAJO_SEGURIDAD.md` (Fase 1). Referencias: `brechas-seguridad.md`, `PLAN_DE_TRABAJO_SEGURIDAD.md`.

-- Fin de la especificación de Fase 1 --