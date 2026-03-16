# One Spec (Root Spec)

## Objetivo

Proveer una guía ejecutable y reproducible para implementar las remediaciones de seguridad definidas en la **Fase 1** del `PLAN_REMEDIACION_SEGURIDAD.md`. Esta especificación contiene pasos técnicos, cambios de código, comandos de verificación, criterios de aceptación y notas de riesgos/rollback.

## Alcance / No alcance

- Alcance: Implementar las remediaciones críticas descritas en la Fase 1 — Content Security Policy (CSP), eliminar fallback a `localStorage` para token, limpiar tokens en URLs (ResetPassword / CreatePassword), sanitizar logs con datos sensibles y actualizar dependencias (SCA básico).
- No alcance: Cambios de backend (p. ej. migración a cookies HttpOnly), despliegues en producción y pruebas de integración con servicios externos. Si se requiere coordinación backend, se documenta y se marca como bloqueado.

## Definiciones (lenguaje de dominio)

- CSP: Content Security Policy, política de seguridad para recursos cargados por el navegador.
- SCA: Software Composition Analysis (ej. `npm audit`).
- inMemoryAuthToken: variable en `src/lib/api.ts` que almacena token en memoria.

## Principios / Reglas no negociables

- No persistir tokens de autenticación en almacenamiento accesible por scripts (p. ej. `localStorage`).
- No exponer datos sensibles en logs.
- Cambios mínimos y con pruebas: cada cambio debe incluir verificación local y criterios de aceptación.

## Límites

- Se actuará únicamente en el código del frontend. Los cambios que requieren backend serán documentados y señalados como bloqueados.

## Eventos y estados (visión raíz)

- `dev` — Desarrollador ejecuta pasos localmente y verifica.
- `ci` — Opcional: SCA y linting para gates en CI.
- `review` — PR para revisión del equipo de seguridad.

## Fase 1 — Remediaciones Críticas Inmediatas (Especificación detallada)

### Objetivo de la Fase 1

Mitigar vulnerabilidades de prioridad ALTA / MEDIA que puedan explotarse con bajo esfuerzo: CSP, eliminación de fallback a `localStorage` para tokens, limpieza de tokens en URLs, sanitización de logs y actualización de dependencias con CVEs conocidos.

### Resumen de entregables

- Cambios en `index.html` para CSP.
- Cambios en `src/lib/api.ts` para eliminar fallback a `localStorage` y limpiar `clearAuth()`.
- Cambios en `src/pages/ResetPassword.tsx` y `src/pages/CreatePassword.tsx` (o la introducción de `src/hooks/useTokenFromUrl.ts`) para extraer y remover tokens de la URL de forma segura.
- Cambios en `src/lib/validators/password.ts` para evitar logs con datos sensibles.
- Documento de verificación y comandos para `npm audit`, `npm run lint`, y build.

### Paso a paso (implementación técnica)

- 1) Configurar Content Security Policy (CSP)
	- Objetivo: evitar inyección de scripts y recursos no autorizados.
	- Archivo objetivo: [index.html](index.html#L1)
	- Cambios recomendados: añadir meta tag CSP mínimo y parametrizable por `VITE_API_URL`.
	- Ejemplo (colocar dentro de `<head>` después del viewport):

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; connect-src 'self' https://$VITE_API_URL; frame-ancestors 'none'; base-uri 'self';">
```

	- Implementación práctica:
		- Añadir la meta tag con placeholder o build-time replacement (ej. usando Vite env `import.meta.env.VITE_API_HOST` durante index.html templating) para no hardcodear dominios.
		- En `vite.config.ts` o proceso build, inyectar `VITE_API_URL` en la plantilla si se requiere dinámica.

	- Verificación:
		- Ejecutar la app en `dev` y revisar consola del navegador por errores CSP.
		- Usar https://csp-evaluator.withgoogle.com/ para análisis.

- 2) Eliminar fallback a `localStorage` en `src/lib/api.ts`
	- Objetivo: evitar persistencia de tokens accesibles por XSS.
	- Archivo objetivo: `src/lib/api.ts` (línea indicada en plan original).
	- Cambios mínimos:
		- Reemplazar:

```ts
export const getToken = () => inMemoryAuthToken || localStorage.getItem('authToken');
```

		- Por:

```ts
export const getToken = () => inMemoryAuthToken;
```

	- Actualizar `clearAuth()` para eliminar referencias a `localStorage` legacy (ej. `localStorage.removeItem('authToken')`, `localStorage.removeItem('user')`).

	- Verificación:
		- Login/logout local: verificar que token se guarda en memoria y que tras refresh de página la sesión no persiste (comportamiento esperado mientras la migración a cookies HttpOnly no esté completada).

- 3) Limpiar token de URL en ResetPassword / CreatePassword
	- Objetivo: evitar que tokens de un único uso queden en el historial o logs del navegador.
	- Recomendación: crear un hook reutilizable `src/hooks/useTokenFromUrl.ts` y refactorizar los componentes que leen `searchParams`.

	- Hook propuesto:

```ts
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useTokenFromUrl(paramName = 'token') {
	const [searchParams, setSearchParams] = useSearchParams();
	const [token, setToken] = useState<string | null>(null);

	useEffect(() => {
		const t = searchParams.get(paramName);
		if (t) {
			setToken(t);
			// limpiar token de la URL sin causar navigation
			const newParams = new URLSearchParams(searchParams);
			newParams.delete(paramName);
			// reemplazar el estado en el historial
			window.history.replaceState({}, document.title, `${window.location.pathname}${newParams.toString() ? '?' + newParams.toString() : ''}`);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return token;
}
```

	- Refactorizar `ResetPassword.tsx` y `CreatePassword.tsx` para usar `useTokenFromUrl()` en lugar de leer la query directamente.

	- Verificación:
		- Abrir link con `?token=...` y confirmar que después de montar el token ya no aparece en la barra de direcciones.

- 4) Sanitizar logs que contengan datos sensibles
	- Archivo sugerido para cambio: `src/lib/validators/password.ts` (y cualquier `console.error` que imprima emails o tokens).
	- Reemplazo recomendado para bloques `catch` que impriman datos sensibles:

```ts
} catch (e) {
	console.error('Error al validar contraseña:', e instanceof Error ? e.message : 'unknown');
}
```

	- Acciones adicionales: buscar en todo el repo `console.log(` y `console.error(` y revisar usos que puedan exponer datos sensibles (email, token, ssn, etc.).

- 5) Actualizar dependencias (SCA básico)
	- Objetivo: parchear paquetes con CVEs conocidos.
	- Pasos:
		- Ejecutar localmente:

```bash
npm audit --json > reports/npm-audit-baseline.json
npm audit fix
```

		- Para paquetes que `npm audit fix` no solucione: actualizar manualmente con `npm update paquete@versión` y verificar breaking changes.
		- Registrar cambios en `reports/` y crear issues para upgrades que requieran pruebas adicionales.

	- Verificación:
		- `npm run build` y `npm run lint` deben completarse sin errores nuevos.

### Criterios de aceptación (Fase 1)

- CSP meta tag presente en [index.html](index.html#L1) y probado en dev (sin errores críticos en consola).
- `getToken()` no lee `localStorage` y `clearAuth()` no deja artefactos en `localStorage`.
- Tokens single-use son removidos de la barra de direcciones tras montar las páginas (`ResetPassword`, `CreatePassword`).
- No hay `console.log/error` que imprima emails o tokens.
- `npm audit` y `npm run lint` pasan con warnings aceptables; las vulnerabilidades críticas/altas están mitigadas o documentadas.

### Plan de pruebas y verificación (manual + comandos)

- Ejecutar SCA y lint localmente:

```bash
npm audit --audit-level=moderate
npm run lint -- --max-warnings=0
npm run build
```

- Flujos manuales:
	- Login / Logout: comprobar token en memoria, y que tras refresh se requiere nuevo login.
	- ResetPassword / CreatePassword: abrir link con token, validar formulario y confirmar limpieza de URL.
	- Revisar consola del navegador para errores CSP o recursos bloqueados.

### Nota de despliegue / CI

- Añadir chequeos en CI que incluyan `npm audit` (o reportes) y `npm run lint` como gates del PR.

### Riesgos y mitigaciones

- Riesgo: CSP rompe recursos legítimos (scripts, estilos externos). Mitigación: habilitar CSP en modo restrictivo en staging, revisar errores y ampliar `connect-src`, `style-src` y `script-src` según sea necesario.
- Riesgo: Cambiar `getToken()` rompe comportamientos esperados por otras partes del frontend. Mitigación: correr tests y revisar llamadas a `getToken()` y `saveAuth()`; documentar breaking change.

### Rollback

- Cada cambio debe hacerse en una rama `security/remediation` y en commits pequeños. Si se detecta regresión, revertir el commit problemático y abrir issue para corrección.

### Responsables y tiempos estimados

- Owner técnico: equipo frontend / autor del PR.
- Tester: QA o desarrollador distinto al implementador.
- Tiempo estimado: 3–5 días para completar la Fase 1 (incluye revisión y pruebas).

### Checklist de entrega

- [ ] PR creado y asignado a revisión de seguridad.
- [ ] CSP añadido y verificado en dev.
- [ ] `getToken()` actualizado y `localStorage` legacy limpiado.
- [ ] Tokens URL limpiados en Reset/ Create Password.
- [ ] Logs sanitizados.
- [ ] `npm audit` y `npm run lint` ejecutados y resultados documentados en `reports/`.

## Criterios de trazabilidad

- Asociar cada cambio a issue o ticket en el tracker del proyecto y documentarlo en `brechas-seguridad.md` con estado "Mitigated" o "Fixed" según corresponda.

## Anexos / snippets útiles

- Ejemplo de replaceState usado por `useTokenFromUrl` (ver arriba).
- Comandos de auditoría y build ya listados en la sección de pruebas.

## Notas finales

Esta ONE_SPEC cubre la implementación práctica de la Fase 1. Para la Fase 4 (migración a cookies HttpOnly) se requiere coordinación backend y se debe bloquear hasta confirmación del equipo backend.

