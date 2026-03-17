# 🧪 Guía de Testing Manual - GET /auth/validate-token

**Última actualización:** 17 de Marzo, 2026  
**Endpoint:** `GET /auth/validate-token?token={TOKEN}&type={TYPE}`

---

## 📋 Prerequisitos

```bash
# 1. El servidor debe estar ejecutándose
npm run dev
# o
npm run build && node dist/index.js

# 2. Verificar puerto (por defecto 4000)
# El servidor debe estar en: http://localhost:4000

# 3. Tener instalado curl o usar Postman
```

---

## 🧪 Casos de Prueba

### Test 1: Token Válido (EXITOSO)

```bash
# Generar primero un token válido:
# 1. Hacer POST /auth/register-email con un email
# 2. Copiar el token del email recibido
# 3. Usar ese token en la siguiente llamada

curl -X GET "http://localhost:4000/auth/validate-token?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&type=password_creation" \
  -H "Content-Type: application/json"
```

**Respuesta Esperada: 200 OK**
```json
{
  "status": "success",
  "data": {
    "valid": true,
    "status": "valid",
    "message": "Token is valid and ready to be used",
    "email": "usuario@example.com"
  }
}
```

---

### Test 2: Token Expirado

```bash
# Obtener un token que haya expirado (> 24h antigüedad)
# O manipular la BD para establecer expires_at en el pasado

curl -X GET "http://localhost:4000/auth/validate-token?token=TOKEN_EXPIRADO&type=password_creation" \
  -H "Content-Type: application/json"
```

**Respuesta Esperada: 200 OK**
```json
{
  "status": "success",
  "data": {
    "valid": false,
    "status": "expired",
    "message": "This token has expired. Please request a new one."
  }
}
```

---

### Test 3: Token Ya Usado

```bash
# 1. Crear un token válido con POST /auth/register-email
# 2. Consumirlo con POST /auth/create-password
# 3. Intentar validar el mismo token

curl -X GET "http://localhost:4000/auth/validate-token?token=TOKEN_USADO&type=password_creation" \
  -H "Content-Type: application/json"
```

**Respuesta Esperada: 200 OK**
```json
{
  "status": "success",
  "data": {
    "valid": false,
    "status": "used",
    "message": "This token has already been used. Please request a new one."
  }
}
```

---

### Test 4: Token No Encontrado (Fake Token)

```bash
# Usar un token que nunca fue emitido

curl -X GET "http://localhost:4000/auth/validate-token?token=abc123invalidtoken&type=password_creation" \
  -H "Content-Type: application/json"
```

**Respuesta Esperada: 200 OK**
```json
{
  "status": "success",
  "data": {
    "valid": false,
    "status": "not_found",
    "message": "Token not found. It may have been deleted or never existed."
  }
}
```

---

### Test 5: Tipo Incorrecto (Token para password_reset, Validar con password_creation)

```bash
# 1. Crear un token con POST /auth/forgot-password (type=password_reset)
# 2. Intentar validar con type=password_creation

curl -X GET "http://localhost:4000/auth/validate-token?token=TOKEN_RESET&type=password_creation" \
  -H "Content-Type: application/json"
```

**Respuesta Esperada: 200 OK**
```json
{
  "status": "success",
  "data": {
    "valid": false,
    "status": "invalid_type",
    "message": "This token cannot be used for this operation."
  }
}
```

---

### Test 6: Parámetro Faltante (Sin token)

```bash
curl -X GET "http://localhost:4000/auth/validate-token?type=password_creation" \
  -H "Content-Type: application/json"
```

**Respuesta Esperada: 400 Bad Request**
```json
{
  "status": "error",
  "message": "Missing or invalid required parameter: token",
  "code": "MISSING_PARAMETER"
}
```

---

### Test 7: Parámetro Faltante (Sin type)

```bash
curl -X GET "http://localhost:4000/auth/validate-token?token=SOME_TOKEN" \
  -H "Content-Type: application/json"
```

**Respuesta Esperada: 400 Bad Request**
```json
{
  "status": "error",
  "message": "Invalid or missing parameter: type. Must be \"password_creation\" or \"password_reset\"",
  "code": "INVALID_PARAMETER"
}
```

---

### Test 8: Type Inválido

```bash
curl -X GET "http://localhost:4000/auth/validate-token?token=SOME_TOKEN&type=invalid_type" \
  -H "Content-Type: application/json"
```

**Respuesta Esperada: 400 Bad Request**
```json
{
  "status": "error",
  "message": "Invalid or missing parameter: type. Must be \"password_creation\" or \"password_reset\"",
  "code": "INVALID_PARAMETER"
}
```

---

### Test 9: No hay parámetros

```bash
curl -X GET "http://localhost:4000/auth/validate-token" \
  -H "Content-Type: application/json"
```

**Respuesta Esperada: 400 Bad Request**
```json
{
  "status": "error",
  "message": "Missing or invalid required parameter: token",
  "code": "MISSING_PARAMETER"
}
```

---

## 🐮 Usando Postman

1. **Crear nueva request**
   - Método: GET
   - URL: `http://localhost:4000/auth/validate-token`
   - Params:
     - Key: `token`, Value: `{JWT_TOKEN}`
     - Key: `type`, Value: `password_creation` o `password_reset`

2. **Enviar**

3. **Verificar respuesta**

---

## 🔍 Debugging

### Si la ruta no existe (404)

```bash
# Verificar que el servidor está ejecutándose
# y que las rutas están cargadas correctamente

# En logs debe aparecer algo como:
# Server running on port 4000
# Routes loaded: /auth/...

# Verificar que auth.routes.ts tiene:
# router.get('/validate-token', ...)
```

### Si retorna 500 Error Interno

```bash
# Verificar logs del servidor
# Buscar mensajes de error en console

# Posibles causas:
# 1. ValidatePasswordTokenUseCase no está inyectado
# 2. passwordTokenRepository no está inyectado
# 3. Error en BD (conexión a Supabase)
```

### Si SQL Query falla

```bash
# Verificar que tabla password_tokens existe en Supabase
# con campos: user_id, token, type, expires_at, used, used_at, email

# Ejecutar en Supabase SQL Editor:
SELECT * FROM password_tokens LIMIT 1;
```

---

## 📊 Script de Pruebas Completo (Bash)

Guardar como `test-validate-token.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:4000"
ENDPOINT="/auth/validate-token"

echo "🧪 Testing GET $BASE_URL$ENDPOINT"
echo ""

# Test 1: Parámetro faltante (token)
echo "Test 1: Missing token parameter"
curl -X GET "$BASE_URL$ENDPOINT?type=password_creation"
echo ""
echo ""

# Test 2: Parámetro faltante (type)
echo "Test 2: Missing type parameter"
curl -X GET "$BASE_URL$ENDPOINT?token=test_token"
echo ""
echo ""

# Test 3: Type inválido
echo "Test 3: Invalid type parameter"
curl -X GET "$BASE_URL$ENDPOINT?token=test_token&type=invalid"
echo ""
echo ""

# Test 4: Token inválido
echo "Test 4: Invalid token (not found)"
curl -X GET "$BASE_URL$ENDPOINT?token=invalidtoken123&type=password_creation"
echo ""
echo ""

echo "✅ Tests completados"
```

Ejecutar:
```bash
chmod +x test-validate-token.sh
./test-validate-token.sh
```

---

## ✅ Checklist de Validación

- [ ] Test 1: Token válido → 200, valid=true, email presente
- [ ] Test 2: Token expirado → 200, valid=false, status='expired'
- [ ] Test 3: Token usado → 200, valid=false, status='used'
- [ ] Test 4: Token no encontrado → 200, valid=false, status='not_found'
- [ ] Test 5: Tipo incorrecto → 200, valid=false, status='invalid_type'
- [ ] Test 6: Sin token → 400, code='MISSING_PARAMETER'
- [ ] Test 7: Sin type → 400, code='INVALID_PARAMETER'
- [ ] Test 8: Type inválido → 400, code='INVALID_PARAMETER'
- [ ] Test 9: Sin parámetros → 400, code='MISSING_PARAMETER'
- [ ] Endpoints existentes siguen funcionando (Login, Register, etc.)

---

## 📝 Protocolo de Testing

1. **Arrancar servidor**
   ```bash
   npm run dev
   ```

2. **Crear token de prueba**
   - POST /auth/register-email con email
   - Obtener token del email o de la respuesta

3. **Validar token**
   - GET /auth/validate-token?token=TOKEN&type=password_creation
   - Verificar respuesta

4. **Consumir token**
   - POST /auth/create-password { token, password }
   - Verificar que se marcó como usado

5. **Validar token usado**
   - GET /auth/validate-token?token=SAME_TOKEN&type=password_creation
   - Debe retornar status='used'

6. **Documentar resultados**
   - Guardar respuestas en archivo
   - Comparar contra especificación

---

## 🔗 Referencias

- Especificación: ONE_SPEC.md
- Plan: PLAN_BACKEND_VALIDACION_TOKENS.md
- Implementación: RESUMEN_IMPLEMENTACION.md
- API Docs: PLAN_FRONTEND_VALIDACION_TOKENS.md

---

**Generado:** 17 de Marzo, 2026
