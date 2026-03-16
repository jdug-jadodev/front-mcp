# Security Remediation Timeline

```
Día 1        Día 3-7        Día 8-10       Día 11-13      Día 14-20      Día 21-24      Día 25
│            │              │              │              │              │              │
▼            ▼              ▼              ▼              ▼              ▼              ▼
┌─────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌────────┐
│ FASE 0  │→ │  FASE 1   │→ │  FASE 2   │→ │  FASE 3   │→ │  FASE 4   │→ │  FASE 5   │→ │ FASE 6 │
│  Prep   │  │  Críticas │  │  Código   │  │   Infra   │  │  Mejoras  │  │   CI/CD   │  │ Validar│
└─────────┘  └───────────┘  └───────────┘  └───────────┘  └───────────┘  └───────────┘  └────────┘
   1 día       3-5 días       2-3 días       2-3 días       5-7 días       3-4 días       2 días
```

---

## 📅 Fase 0: Preparación (Día 1)

**Owner:** DevOps / Security Lead  
**Prioridad:** 🔴 ALTA

### Tareas
```
□ 0.1 Ejecutar SCA inicial                    [2h]
□ 0.2 Configurar herramientas de seguridad    [3h]
□ 0.3 Crear estructura de seguimiento         [1h]
```

**Entregables:**
- `reports/npm-audit-baseline.json`
- `eslint.config.js` actualizado
- Rama `security/remediation`

**Bloqueadores:** Ninguno

---

## 🔥 Fase 1: Críticas Inmediatas (Días 2-7)

**Owner:** Frontend Lead  
**Prioridad:** 🔴 CRÍTICA

### Día 2-3: CSP + localStorage
```
□ 1.1 Configurar CSP en index.html            [2h]
□ 1.2 Eliminar fallback localStorage          [1h]
□ 1.3 Testing flows login/logout              [2h]
```

### Día 4-5: Tokens en URL + Logs
```
□ 1.3 Limpiar token ResetPassword             [1h]
□ 1.4 Sanitizar console.error                 [30min]
□ 1.5 Actualizar dependencias CVEs            [3h]
```

### Día 6-7: Validación Fase 1
```
□ Testing completo de cambios
□ npm audit clean check
□ PR de Fase 1
```

**Entregables:**
- CSP configurado y validado
- Token localStorage eliminado
- Vulnerabilidad #1 (Alta) → FIXED
- Vulnerabilidad #2, #4, #9 → FIXED

**Bloqueadores:** Ninguno

---

## 💻 Fase 2: Código Frontend (Días 8-10)

**Owner:** Frontend Developer  
**Prioridad:** 🟡 MEDIA

### Día 8: Hook reutilizable
```
□ 2.1 Optimizar CreatePassword                [1h]
□ 2.2 Crear useTokenFromUrl hook              [2h]
□ 2.2 Refactorizar componentes                [2h]
```

### Día 9: Validación Email
```
□ 2.3 Instalar validator.js                   [30min]
□ 2.3 Crear validators/email.ts               [1h]
□ 2.3 Actualizar componentes                  [2h]
□ 2.3 Testing edge cases                      [1h]
```

### Día 10: Documentación
```
□ 2.4 Documentar JWT parsing                  [1h]
□ Testing completo Fase 2                     [2h]
□ PR de Fase 2                                [1h]
```

**Entregables:**
- `useTokenFromUrl.ts` hook
- `validators/email.ts`
- Vulnerabilidad #5, #7 → FIXED
- Vulnerabilidad #6 → DOCUMENTED

**Bloqueadores:** Ninguno

---

## 🏗️ Fase 3: Infraestructura (Días 11-13)

**Owner:** DevOps  
**Prioridad:** 🟡 MEDIA

### Día 11: Config Vercel/Netlify
```
□ 3.1 Crear vercel.json                       [1h]
□ 3.2 Crear netlify.toml                      [1h]
□ 3.2 Validar headers en staging              [2h]
```

### Día 12: Docker
```
□ 3.3 Crear Dockerfile                        [2h]
□ 3.3 Crear nginx.conf                        [1h]
□ 3.3 Crear docker-compose.yml                [1h]
□ 3.3 Testing build local                     [2h]
```

### Día 13: Validación Infra
```
□ Testing headers con curl                    [1h]
□ SecurityHeaders.com validation              [30min]
□ PR de Fase 3                                [1h]
```

**Entregables:**
- `vercel.json`, `netlify.toml`
- `Dockerfile`, `nginx.conf`, `docker-compose.yml`
- Vulnerabilidad #3 → FIXED
- Vulnerabilidad #12 → IMPLEMENTED

**Bloqueadores:** Acceso a cuenta Vercel/Netlify

---

## 🚀 Fase 4: Mejoras Estructurales (Días 14-20)

**Owner:** Backend Lead + Frontend Developer  
**Prioridad:** 🟢 BAJA

### Día 14-15: Diccionario Contraseñas
```
□ 4.1 Descargar lista top 1000                [1h]
□ 4.1 Crear build-password-dict.js            [2h]
□ 4.1 Actualizar password.ts                  [2h]
□ 4.1 Testing validación                      [2h]
```

### Día 16-17: SBOM + Docs
```
□ 4.2 Generar SBOM                            [1h]
□ 4.4 Inventario activos ISO 27001            [3h]
□ Testing y documentación                     [2h]
```

### Día 18-20: Preparar Cookies
```
□ 4.3 BACKEND_REQUIREMENTS.md                 [2h]
□ 4.3 Rama experimental cookies               [1h]
□ 4.3 Implementar cambios frontend            [4h]
□ Documentación plan migración                [2h]
```

**Entregables:**
- Diccionario 1000 contraseñas comunes
- `sbom.json`
- `INFORMATION_ASSETS.md`
- `BACKEND_REQUIREMENTS.md`
- Rama `feat/cookie-auth-migration` (NO mergear)
- Vulnerabilidad #13 → FIXED

**Bloqueadores:** Fase cookies bloqueada por backend

---

## 🤖 Fase 5: CI/CD (Días 21-24)

**Owner:** DevOps  
**Prioridad:** 🟡 MEDIA

### Día 21: Dependabot + Secret Scanning
```
□ 5.1 Configurar Dependabot                   [1h]
□ 5.2 Habilitar Secret Scanning               [30min]
□ 5.2 Configurar detect-secrets               [1h]
□ 5.2 Configurar pre-commit hooks             [1h]
```

### Día 22-23: SAST
```
□ 5.3 Crear security-scan.yml workflow        [3h]
□ 5.3 Configurar Semgrep                      [2h]
□ 5.4 Configurar CodeQL (opcional)            [2h]
□ 5.3 Testing workflows en PR                 [2h]
```

### Día 24: Finalizar CI
```
□ 5.5 Crear security.txt                      [1h]
□ Branch protection rules                     [1h]
□ Testing pipeline completo                   [2h]
```

**Entregables:**
- `.github/dependabot.yml`
- `.github/workflows/security-scan.yml`
- `.github/workflows/codeql.yml`
- Pre-commit hooks configurados
- Vulnerabilidad #10, #11 → AUTOMATED

**Bloqueadores:** Permisos admin en GitHub

---

## ✔️ Fase 6: Validación Final (Días 25-26)

**Owner:** QA + Security Lead  
**Prioridad:** 🔴 CRÍTICA

### Día 25: Testing
```
□ 6.1 Suite completa validación               [3h]
  - npm audit clean
  - eslint security 0 warnings
  - build success
  - testing local
□ 6.2 Validación online                       [2h]
  - SecurityHeaders.com
  - CSP Evaluator
  - Mozilla Observatory
□ 6.3 Testing manual flows                    [2h]
```

### Día 26: Cierre
```
□ 6.4 Actualizar brechas-seguridad.md v3.0    [2h]
□ 6.5 Actualizar README.md                    [1h]
□ 6.6 Crear PR final                          [1h]
□ 6.6 Review y merge                          [2h]
□ 6.7 Deploy y validación producción          [2h]
```

**Entregables:**
- `brechas-seguridad.md` v3.0
- README actualizado con sección Seguridad
- PR aprobado y mergeado
- Score final: 95/100 ✅

**Bloqueadores:** Aprobación de review

---

## 📊 Métricas por Fase

| Fase | Vulnerabilidades Resueltas | Tiempo | Score Incremental |
|------|---------------------------|--------|-------------------|
| 0    | 0 (preparación)           | 1d     | 82 → 82 |
| 1    | #1, #2, #4, #9 (4)       | 5d     | 82 → 87 |
| 2    | #5, #6, #7 (3)           | 3d     | 87 → 90 |
| 3    | #3, #12 (2)              | 3d     | 90 → 92 |
| 4    | #13 (1)                  | 7d     | 92 → 93 |
| 5    | #10, #11 (2)             | 4d     | 93 → 95 |
| 6    | Validación               | 2d     | 95 → 95 ✅ |

---

## 🚦 Semáforo de Progreso

### Semana 1 (Días 1-7)
```
Fase 0   ████████████████████ 100%
Fase 1   ████████████████████ 100%
```
**Score:** 82 → 87

### Semana 2 (Días 8-14)
```
Fase 2   ████████████████████ 100%
Fase 3   ████████████████████ 100%
Fase 4   ████░░░░░░░░░░░░░░░░  20%
```
**Score:** 87 → 92

### Semana 3 (Días 15-21)
```
Fase 4   ████████████████████ 100%
Fase 5   ████████░░░░░░░░░░░░  40%
```
**Score:** 92 → 93

### Semana 4 (Días 22-26)
```
Fase 5   ████████████████████ 100%
Fase 6   ████████████████████ 100%
```
**Score:** 93 → 95 ✅

---

## 🎯 Hitos Críticos

### Hito 1: Vulnerabilidades Altas Resueltas (Día 7)
- ✅ #1 localStorage eliminado
- ✅ Score >= 87
- 📦 **Deliverable:** PR Fase 1 mergeado

### Hito 2: Headers de Seguridad (Día 13)
- ✅ CSP configurado
- ✅ Security headers en hosting
- ✅ Score >= 92
- 📦 **Deliverable:** Config lista para deploy

### Hito 3: CI/CD Automatizado (Día 24)
- ✅ SAST en pipeline
- ✅ SCA automatizado
- ✅ Secret scanning activo
- 📦 **Deliverable:** Pipeline de seguridad completo

### Hito 4: Certificación (Día 26)
- ✅ Score 95/100
- ✅ SecurityHeaders.com Grade A
- ✅ 0 vulnerabilidades críticas/altas
- 📦 **Deliverable:** Reporte v3.0 + Deploy en producción

---

## 👥 Asignaciones Recomendadas

| Rol | Fases Asignadas | Tiempo Total |
|-----|----------------|--------------|
| **Security Lead** | 0, 6 | 3 días |
| **Frontend Lead** | 1, 2 | 8 días |
| **DevOps** | 3, 5 | 7 días |
| **Backend Lead** | 4 (consultoría) | 2 días |
| **QA** | 6 (testing) | 1 día |

---

## 🔗 Enlaces Rápidos

- 📋 [Plan Detallado](PLAN_REMEDIACION_SEGURIDAD.md)
- ✅ [Checklist Diario](SECURITY_CHECKLIST.md)
- 🔒 [Reporte de Seguridad](brechas-seguridad.md)
- 📊 [Dashboard de Progreso](https://github.com/tu-org/tu-repo/projects/security)

---

**Última actualización:** 2026-03-15  
**Próxima revisión:** ___________
