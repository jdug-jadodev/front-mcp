# 🧪 Plan de Pruebas - Validación de Tokens en Frontend

**Fecha:** 17 de Marzo, 2026  
**Estado:** Verificación Manual
**Referencia:** ONE_SPEC.md - Fases 1-6

---

## 📋 Prerequisitos

```bash
# 1. El servidor MCP debe estar ejecutándose
npm run dev

# 2. Backend debe estar accesible en:
# http://localhost:4000 (configurado en VITE_API_URL)

# 3. Verificar que los archivos modificados compilaron sin error:
npm run build
npm run lint
```

---

## 🧪 Plan de Pruebas Manuales

### Test 1: Token Válido (CreatePassword)

**Objetivo:** Verificar que se muestra formulario cuando token es válido

**Pasos:**
1. Registrar usuario nuevo: POST `/auth/register-email` con email
2. Copiar token del email recibido o respuesta
3. Abrir: `/create-password?token={TOKEN}`
4. Esperar verificación (debe mostrar spinner brevemente)

**Resultado esperado:**
- [ ] URL se limpia (token desaparece de la barra)
- [ ] Muestra texto "Creando contraseña para: usuario@email.com"
- [ ] Formulario de contraseña visible
- [ ] Campos: Nueva contraseña, Confirmar contraseña, botón Crear
- [ ] Password strength meter funciona

**Acciones:**
- [ ] Llenar contraseña válida (8+ caracteres, mayúscula, minúscula, número, símbolo)
- [ ] Confirmar contraseña igual
- [ ] Click en "Crear Contraseña"
- [ ] Debe redirigir a `/login` con mensaje de éxito

**Observaciones:**
_____________________________

---

### Test 2: Token Expirado (CreatePassword)

**Objetivo:** Verificar que se muestra pantalla de enlace expirado

**Pasos:**
1. Obtener token expirado (>24h antigüedad o editar en BD)
2. Abrir: `/create-password?token={EXPIRED_TOKEN}`
3. Esperar verificación

**Resultado esperado:**
- [ ] Muestra pantalla "Enlace expirado"
- [ ] Texto: "El enlace de creación de contraseña ya no es válido."
- [ ] Botón: "Solicitar un nuevo enlace" navega a `/forgot-password`
- [ ] No muestra formulario

**Acciones:**
- [ ] Click en botón "Solicitar un nuevo enlace"
- [ ] Debe navegar a `/forgot-password`

**Observaciones:**
_____________________________

---

### Test 3: Token Usado (CreatePassword)

**Objetivo:** Verificar que se muestra pantalla de token ya usado

**Pasos:**
1. Crear usuario completo (crear contraseña con token válido)
2. Volver a abrir el mismo enlace: `/create-password?token={USED_TOKEN}`
3. Esperar verificación

**Resultado esperado:**
- [ ] Muestra pantalla "Enlace ya utilizado"
- [ ] Texto: "Este enlace ya fue usado para crear una contraseña."
- [ ] Botón: "Ir al inicio de sesión" navega a `/login`
- [ ] No muestra formulario

**Acciones:**
- [ ] Click en botón "Ir al inicio de sesión"
- [ ] Debe navegar a `/login`

**Observaciones:**
_____________________________

---

### Test 4: Sin Token en URL (CreatePassword)

**Objetivo:** Verificar que se muestra pantalla de enlace no válido

**Pasos:**
1. Abrir directamente: `/create-password` (sin parámetro ?token=)
2. Esperar validación

**Resultado esperado:**
- [ ] Muestra pantalla "Enlace no válido"
- [ ] Texto: "No se encontró un enlace de creación de contraseña."
- [ ] Botón: "Solicitar un nuevo enlace" navega a `/forgot-password`
- [ ] Validación es instantánea (no hay spinner)

**Acciones:**
- [ ] Click en botón "Solicitar un nuevo enlace"
- [ ] Debe navegar a `/forgot-password`

**Observaciones:**
_____________________________

---

### Test 5: Error de Red (CreatePassword)

**Objetivo:** Verificar manejo de error cuando backend no responde

**Pasos:**
1. Abrir `/create-password?token=test123`
2. Simular offline: DevTools > Network > Offline (o desconectar WiFi)
3. Esperar timeout de validación (máx 10s)

**Resultado esperado:**
- [ ] Muestra pantalla "Error"
- [ ] Mensaje: "No se pudo verificar el enlace..." o similar
- [ ] Botón: "Ir al inicio de sesión" navega a `/login`
- [ ] No intenta indefinidamente

**Acciones:**
- [ ] Click en botón "Ir al inicio de sesión"
- [ ] Debe navegar a `/login`

**Observaciones:**
_____________________________

---

### Test 6: Token Válido (ResetPassword)

**Objetivo:** Verificar que se muestra formulario en página de reset

**Pasos:**
1. Solicitar reset: POST `/auth/forgot-password` con email existente
2. Copiar token del email recibido
3. Abrir: `/reset-password?token={TOKEN}`
4. Esperar verificación

**Resultado esperado:**
- [ ] URL se limpia (token desaparece)
- [ ] Muestra texto "Restableciendo contraseña para: usuario@email.com"
- [ ] Formulario de contraseña visible
- [ ] Campos: Nueva contraseña, Confirmar contraseña, botón Restablecer
- [ ] Password strength meter funciona

**Acciones:**
- [ ] Llenar contraseña válida nueva
- [ ] Confirmar contraseña igual
- [ ] Click en "Restablecer Contraseña"
- [ ] Debe redirigir a `/login` con mensaje de éxito
- [ ] Pueda hacer login con nueva contraseña

**Observaciones:**
_____________________________

---

### Test 7: Token Expirado (ResetPassword)

**Objetivo:** Verificar pantalla de expiración en reset

**Pasos:**
1. Obtener token reset expirado
2. Abrir: `/reset-password?token={EXPIRED_TOKEN}`

**Resultado esperado:**
- [ ] Muestra pantalla "Enlace expirado"
- [ ] Texto: "El enlace de restablecimiento de contraseña ya no es válido."
- [ ] Botón navega a `/forgot-password`

**Observaciones:**
_____________________________

---

### Test 8: Token Usado (ResetPassword)

**Objetivo:** Verificar pantalla de token usado en reset

**Pasos:**
1. Completar reset completo (cambiar contraseña con token válido)
2. Intentar reutilizar mismo token: `/reset-password?token={USED_TOKEN}`

**Resultado esperado:**
- [ ] Muestra pantalla "Enlace ya utilizado"
- [ ] Texto: "Este enlace ya fue usado para restablecer la contraseña."
- [ ] Botón navega a `/login`

**Observaciones:**
_____________________________

---

## 🔒 Pruebas de Seguridad

### Test S1: URL Limpiada (sin tokens en historial)

**Objetivo:** Verificar que tokens no quedan en barra de direcciones

**Pasos:**
1. Abrir `/create-password?token=eyJhbGciOiJ...ABC123`
2. Observar barra de direcciones inmediatamente
3. Abrir historial del navegador (Ctrl+H)
4. Buscar el token en el historial

**Resultado esperado:**
- [ ] URL en barra se limpia a `/create-password` (sin ?token=)
- [ ] Token no aparece en historial de navegación
- [ ] Cambio es silencioso (sin reload)

**Observaciones:**
_____________________________

---

### Test S2: Sin Logs Sensibles

**Objetivo:** Verificar que no hay tokens o emails en console

**Pasos:**
1. Abrir `/create-password?token=test123`
2. Abrir DevTools (F12 o Ctrl+Shift+I)
3. Ir a pestaña Console
4. Revisar todos los logs

**Resultado esperado:**
- [ ] No hay tokens en console.log
- [ ] No hay emails en console.log
- [ ] No hay JSON con datos sensibles
- [ ] Solo mensajes normales de aplicación

**Observaciones:**
_____________________________

---

### Test S3: Sin Persistencia en localStorage

**Objetivo:** Verificar que tokens nunca se guardan en localStorage

**Pasos:**
1. Abrir `/create-password?token=test123`
2. Completar creación de contraseña con token válido
3. Abrir DevTools > Application > Local Storage
4. Buscar "authToken", "token", o valores sensibles

**Resultado esperado:**
- [ ] No hay key "token" en localStorage
- [ ] No hay valor del JWT token visible
- [ ] Solo "authToken" (sesión actual) y "user" (datos públicos)

**Observaciones:**
_____________________________

---

## ✅ Checklist de Validación Final

### Funcionalidad
- [ ] CreatePassword: todos 8 tests pasan
- [ ] ResetPassword: todos 8 tests pasan
- [ ] Seguridad: todos 3 tests pasan
- [ ] Build sin errores (npm run build)
- [ ] Lint sin errores (npm run lint)
- [ ] No hay regresiones en login/logout/dashboard

### UI/UX
- [ ] Estados visuales claros (spinner, error, success)
- [ ] Mensajes en español
- [ ] Email mostrado cuando válido
- [ ] Botones navegan correctamente
- [ ] Password strength meter funciona
- [ ] Formularios accesibles

### Performance
- [ ] Validación de token <1s
- [ ] Timeout máximo 10s
- [ ] No hay memory leaks (DevTools memory tab)
- [ ] Smooth transitions entre estados

### Integración Backend
- [ ] Endpoint `/auth/validate-token` responde correctamente
- [ ] Parámetros `token` y `type` validados
- [ ] Email incluido en respuesta cuando válido
- [ ] Todos los status codes mapeados (valid, expired, used, not_found, invalid_type, error)

---

## 📋 Matriz de Estados

```
                    | validating | valid | expired | used | invalid | no_token | error
────────────────────┼────────────┼───────┼─────────┼──────┼─────────┼──────────┼──────
Spinner/Loading     |     ✓      |       |         |      |         |          |
Formulario          |            |   ✓   |         |      |         |          |
Botón "Solicitar"   |            |       |    ✓    |      |    ✓    |    ✓     |   ✓
Botón "Login"       |            |       |         |  ✓   |    ✓    |          |   ✓
Email mostrado      |            |   ✓   |         |      |         |          |
Mensaje error       |            |       |    ✓    |  ✓   |    ✓    |    ✓     |   ✓
URL limpia          |     ✓      |   ✓   |    ✓    |  ✓   |    ✓    |    ✓     |   ✓
```

---

## 📊 Resultados

| Test | Resultado | Fecha | Notas |
|------|-----------|-------|-------|
| Test 1: Token Válido CP | [ ] Pass / [ ] Fail | | |
| Test 2: Token Expirado CP | [ ] Pass / [ ] Fail | | |
| Test 3: Token Usado CP | [ ] Pass / [ ] Fail | | |
| Test 4: Sin Token CP | [ ] Pass / [ ] Fail | | |
| Test 5: Error Red CP | [ ] Pass / [ ] Fail | | |
| Test 6: Token Válido RP | [ ] Pass / [ ] Fail | | |
| Test 7: Token Expirado RP | [ ] Pass / [ ] Fail | | |
| Test 8: Token Usado RP | [ ] Pass / [ ] Fail | | |
| Test S1: URL Limpiada | [ ] Pass / [ ] Fail | | |
| Test S2: Sin Logs | [ ] Pass / [ ] Fail | | |
| Test S3: Sin localStorage | [ ] Pass / [ ] Fail | | |

**Resultado Final:** [ ] TODO PASA / [ ] FALLA (requiere fixes)

---

## 🔗 Referencias

- ONE_SPEC.md — Especificación ejecutable
- PLAN_FRONTEND_VALIDACION_TOKENS.md — Plan original
- TESTING_MANUAL_VALIDATE_TOKEN.md — Tests del endpoint
- src/lib/api.ts — Implementación de validatePasswordToken
- src/pages/CreatePassword.tsx — Componente refactorizado
- src/pages/ResetPassword.tsx — Componente refactorizado

---

**Generado:** 17 de Marzo, 2026  
**Responsable:** Equipo Frontend MCP  
**Estado:** Listo para ejecución de pruebas
