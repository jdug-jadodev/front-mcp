# Security Remediation Checklist

**Score actual:** 82/100 → **Meta:** 95/100  
**Fecha inicio:** 2026-03-15

---

## ✅ Fase 0: Preparación (1 día)

- [ ] Ejecutar `npm audit` y documentar CVEs
- [ ] Instalar `eslint-plugin-security`
- [ ] Configurar ESLint con reglas de seguridad
- [ ] Crear rama `security/remediation`
- [ ] Crear directorio `reports/`

---

## 🔥 Fase 1: Críticas Inmediatas (3-5 días)

### CSP (#2 - MEDIA)
- [ ] Añadir CSP meta tag en `index.html`
- [ ] Probar app con CSP activado
- [ ] Validar con CSP Evaluator

### localStorage fallback (#1 - ALTA)
- [ ] Eliminar `|| localStorage.getItem('authToken')` en `api.ts:74`
- [ ] Probar flujo login/logout

### Token en URL - ResetPassword (#4 - MEDIA)
- [ ] Añadir `useEffect` para limpiar URL en `ResetPassword.tsx`
- [ ] Probar flujo de reset

### Logs sanitizados (#9 - BAJA)
- [ ] Sanitizar `console.error` en `password.ts:44`

### Dependencias (#10 - ALTA)
- [ ] Ejecutar `npm audit fix`
- [ ] Actualizar paquetes con CVEs

---

## 💻 Fase 2: Código Frontend (2-3 días)

### Token CreatePassword (#5 - MEDIA)
- [ ] Optimizar limpieza de token en `CreatePassword.tsx`

### Hook reutilizable
- [ ] Crear `src/hooks/useTokenFromUrl.ts`
- [ ] Refactorizar `CreatePassword.tsx`
- [ ] Refactorizar `ResetPassword.tsx`

### Validación Email (#7 - MEDIA)
- [ ] Instalar `validator`
- [ ] Crear `src/lib/validators/email.ts`
- [ ] Actualizar `Login.tsx`
- [ ] Actualizar `ForgotPassword.tsx`

### Documentación JWT (#6 - INFO)
- [ ] Añadir JSDoc en `safeParseJwt()`
- [ ] Añadir comentario en `isAuthenticated()`

---

## 🏗️ Fase 3: Infraestructura (2-3 días)

### Headers de seguridad (#3 - MEDIA)
- [ ] Crear `vercel.json` con headers
- [ ] Crear `netlify.toml` con headers
- [ ] Validar con SecurityHeaders.com

### Docker (#12 - INFO)
- [ ] Crear `Dockerfile`
- [ ] Crear `nginx.conf` con headers
- [ ] Crear `.dockerignore`
- [ ] Crear `docker-compose.yml`
- [ ] Probar build local

---

## 🚀 Fase 4: Mejoras Estructurales (5-7 días)

### Diccionario contraseñas (#13 - INFO)
- [ ] Descargar top 1000 contraseñas comunes
- [ ] Crear script `build-password-dict.js`
- [ ] Actualizar `password.ts` con validación
- [ ] Probar con contraseñas comunes

### SBOM
- [ ] Instalar `@cyclonedx/cyclonedx-npm`
- [ ] Generar SBOM inicial
- [ ] Añadir script `npm run sbom`

### Cookies HttpOnly (Preparación)
- [ ] Documentar requerimientos en `BACKEND_REQUIREMENTS.md`
- [ ] Crear rama experimental `feat/cookie-auth-migration`
- [ ] Implementar cambios en frontend (NO mergear)

### Inventario ISO 27001
- [ ] Crear `INFORMATION_ASSETS.md`

---

## 🤖 Fase 5: CI/CD (3-4 días)

### Dependabot (#10)
- [ ] Crear `.github/dependabot.yml`
- [ ] Habilitar Dependabot Alerts
- [ ] Configurar notificaciones

### Secret Scanning (#11)
- [ ] Habilitar GitHub Secret Scanning
- [ ] Instalar `detect-secrets`
- [ ] Configurar pre-commit hook con husky

### SAST
- [ ] Crear `.github/workflows/security-scan.yml`
- [ ] Configurar Semgrep
- [ ] Configurar npm audit en workflow
- [ ] Configurar Gitleaks

### CodeQL (opcional)
- [ ] Crear `.github/workflows/codeql.yml`
- [ ] Probar análisis

### security.txt
- [ ] Crear `public/.well-known/security.txt`

---

## ✔️ Fase 6: Validación (2 días)

### Validación técnica
- [ ] `npm audit --audit-level=moderate` → CLEAN
- [ ] `npm run lint -- --max-warnings=0` → PASS
- [ ] `npm run build` → SUCCESS
- [ ] Probar app local con headers

### Validación online
- [ ] SecurityHeaders.com → Grade A
- [ ] CSP Evaluator → 0 críticos
- [ ] Mozilla Observatory → B+

### Testing manual
- [ ] Flujo Login completo
- [ ] Flujo CreatePassword completo
- [ ] Flujo ResetPassword completo
- [ ] Validación de email

### Documentación
- [ ] Actualizar `brechas-seguridad.md` v3.0
- [ ] Actualizar score: 82 → 95
- [ ] Marcar hallazgos como "Fixed"
- [ ] Añadir sección Seguridad en README

### PR y Deploy
- [ ] Crear PR con descripción completa
- [ ] Solicitar review de seguridad
- [ ] Mergear tras aprobación
- [ ] Verificar deployment
- [ ] Validar en producción

---

## 📊 Score Final

| Métrica | Antes | Después |
|---------|-------|---------|
| Score Global | 82 | ___ |
| Vulnerabilidades Críticas | 0 | ___ |
| Vulnerabilidades Altas | 1 | ___ |
| Vulnerabilidades Medias | 6 | ___ |
| SecurityHeaders.com | ? | ___ |
| OWASP Top 10 | 60% | ___% |

---

## 🎯 Próximos Pasos (Post-Plan)

- [ ] Migración a cookies HttpOnly (bloqueado por backend)
- [ ] Implementar refresh token flow
- [ ] Pentesting externo
- [ ] Auditoría ISO 27001 completa

---

**Fecha de cierre:** ___________  
**Score final:** _____ /100  
**Aprobado por:** ___________
