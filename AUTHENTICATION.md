# 🔐 Sistema de Autenticación - Landing Backend

## Descripción General

El backend ahora cuenta con un sistema de autenticación basado en JWT (JSON Web Tokens) para proteger los endpoints administrativos.

---

## 📋 Endpoints Públicos vs Privados

### Endpoints Públicos (sin autenticación)

- `POST /api/suscripciones` - Crear nueva solicitud de suscripción
- `GET /api/health` - Health check del servidor
- `POST /api/auth/login` - Login de administrador

### Endpoints Privados (requieren autenticación)

- `GET /api/suscripciones` - Obtener todas las solicitudes
- `GET /api/suscripciones/stats` - Obtener estadísticas
- `PATCH /api/suscripciones/:id` - Actualizar estado de solicitud
- `GET /api/auth/verify` - Verificar token actual
- `GET /api/auth/me` - Obtener perfil del usuario
- `POST /api/auth/change-password` - Cambiar contraseña

---

## 🔑 Configuración Inicial

### 1. Variables de Entorno

Agrega estas variables en tu archivo `.env`:

```bash
# JWT Configuration
JWT_SECRET=tu-secret-key-muy-seguro-y-aleatorio-minimo-32-caracteres
JWT_EXPIRES_IN=24h
```

**⚠️ IMPORTANTE**:
- El `JWT_SECRET` debe ser una cadena aleatoria de al menos 32 caracteres
- Nunca compartas o subas el JWT_SECRET a repositorios públicos
- Usa diferentes secrets para desarrollo y producción

**Generar un JWT_SECRET seguro:**

```bash
# Opción 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 2: OpenSSL
openssl rand -hex 32

# Opción 3: Online
# https://randomkeygen.com/
```

### 2. Crear Base de Datos de Usuarios

El sistema usa Firestore con una colección `landing-page/data/usuarios_admin` que tiene la siguiente estructura:

```javascript
landing-page/data/usuarios_admin/{userId}
{
  nombre: "Juan Pérez",
  email: "admin@multisalon.com",
  passwordHash: "$2a$10$...", // Hash bcrypt
  role: "admin",
  activo: true,
  fechaCreacion: "2024-01-15T10:30:00Z",
  creadoPor: "script",
  ultimoLogin: "2024-01-16T08:00:00Z",
  ultimaIP: "192.168.1.100"
}
```

---

## 👤 Crear Usuario Administrador

### Opción 1: Script Interactivo (Recomendado)

```bash
npm run create-admin
```

Este script te pedirá:
- Nombre completo
- Email
- Contraseña (mínimo 8 caracteres)
- Confirmación de contraseña

**Ejemplo:**
```
🔐 Crear Usuario Administrador

Nombre completo del administrador: Juan Pérez
Email: admin@multisalon.com
Contraseña (mínimo 8 caracteres): ********
Confirmar contraseña: ********

✅ Usuario Administrador Creado Exitosamente

📋 Detalles del Usuario:
   ID: abc123xyz
   Nombre: Juan Pérez
   Email: admin@multisalon.com
   Role: admin
```

### Opción 2: Manualmente en Firestore Console

1. Ve a Firebase Console > Firestore
2. Crea la estructura `landing-page` (colección) → `data` (documento) → `usuarios_admin` (subcolección)
3. Genera el hash de contraseña con bcrypt
4. Agrega el documento manualmente

---

## 🚀 Uso de la API

### 1. Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "admin@multisalon.com",
  "password": "tu-contraseña"
}
```

**Response exitoso (200):**
```json
{
  "success": true,
  "mensaje": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "abc123xyz",
    "email": "admin@multisalon.com",
    "nombre": "Juan Pérez",
    "role": "admin"
  }
}
```

**Response error (401):**
```json
{
  "success": false,
  "error": "Credenciales inválidas",
  "mensaje": "Email o contraseña incorrectos"
}
```

### 2. Usar el Token en Peticiones

Una vez que obtienes el token del login, debes incluirlo en el header `Authorization` de todas las peticiones a endpoints protegidos:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo con cURL:**
```bash
curl -X GET http://localhost:4001/api/suscripciones \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Ejemplo con JavaScript (Axios):**
```javascript
import axios from 'axios'

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

const response = await axios.get('http://localhost:4001/api/suscripciones', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

**Ejemplo con JavaScript (Fetch):**
```javascript
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

const response = await fetch('http://localhost:4001/api/suscripciones', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### 3. Verificar Token

**Endpoint:** `GET /api/auth/verify`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "mensaje": "Token válido",
  "user": {
    "userId": "abc123xyz",
    "email": "admin@multisalon.com",
    "nombre": "Juan Pérez",
    "role": "admin"
  }
}
```

### 4. Obtener Perfil

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "abc123xyz",
    "nombre": "Juan Pérez",
    "email": "admin@multisalon.com",
    "role": "admin",
    "activo": true,
    "fechaCreacion": "2024-01-15T10:30:00Z",
    "ultimoLogin": "2024-01-16T08:00:00Z"
  }
}
```

### 5. Cambiar Contraseña

**Endpoint:** `POST /api/auth/change-password`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "contraseña-actual",
  "newPassword": "nueva-contraseña-segura"
}
```

**Response:**
```json
{
  "success": true,
  "mensaje": "Contraseña actualizada correctamente"
}
```

---

## 🔒 Seguridad

### Tokens JWT

- **Expiración**: Por defecto 24 horas (configurable con `JWT_EXPIRES_IN`)
- **Algoritmo**: HS256 (HMAC SHA-256)
- **Payload**: Incluye userId, email, nombre y role

### Contraseñas

- **Hash**: bcrypt con salt rounds = 10
- **Requisitos**: Mínimo 8 caracteres
- **Almacenamiento**: Solo se guarda el hash, nunca la contraseña en texto plano

### Protecciones Implementadas

✅ Validación de credenciales
✅ Hash seguro de contraseñas
✅ Tokens con expiración
✅ Verificación de usuario activo
✅ Logs de intentos de login
✅ Tracking de última IP y login

### Recomendaciones Adicionales

Para producción, considera implementar:

- ⚠️ Rate limiting en `/api/auth/login` (ej: 5 intentos por hora)
- ⚠️ Bloqueo temporal de cuenta después de múltiples fallos
- ⚠️ Autenticación de dos factores (2FA)
- ⚠️ Rotación de tokens (refresh tokens)
- ⚠️ Whitelist de IPs para admin
- ⚠️ Logs de auditoría en Firestore

---

## 🛠️ Manejo de Errores

### Token Inválido o Expirado (403)

```json
{
  "success": false,
  "error": "Token inválido o expirado",
  "mensaje": "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
}
```

**Solución**: Hacer login nuevamente para obtener un nuevo token

### Sin Token (401)

```json
{
  "success": false,
  "error": "Acceso denegado",
  "mensaje": "Se requiere autenticación para acceder a este recurso"
}
```

**Solución**: Incluir el header `Authorization: Bearer <token>`

### Usuario Inactivo (403)

```json
{
  "success": false,
  "error": "Usuario inactivo",
  "mensaje": "Tu cuenta ha sido desactivada. Contacta al administrador."
}
```

**Solución**: Activar el usuario en Firestore (campo `activo: true`)

---

## 🧪 Testing

### Prueba Manual con cURL

**1. Login:**
```bash
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@multisalon.com",
    "password": "tu-contraseña"
  }'
```

**2. Guardar el token de la respuesta**

**3. Probar endpoint protegido:**
```bash
curl -X GET http://localhost:4001/api/suscripciones \
  -H "Authorization: Bearer <TU_TOKEN_AQUI>"
```

### Prueba con Postman

1. **Crear una nueva request** para login
2. **Method**: POST
3. **URL**: `http://localhost:4001/api/auth/login`
4. **Body** (JSON):
   ```json
   {
     "email": "admin@multisalon.com",
     "password": "tu-contraseña"
   }
   ```
5. **Enviar** y copiar el `token` de la respuesta
6. **Crear nueva request** para endpoint protegido
7. **Headers** → Agregar: `Authorization: Bearer <token>`
8. **Enviar**

---

## 📊 Flujo Completo de Autenticación

```
Usuario → POST /api/auth/login
          { email, password }
       ↓
Backend → Buscar usuario en Firestore
       → Verificar usuario activo
       → Comparar hash de contraseña
       → Generar JWT
       → Actualizar último login
       ↓
Usuario ← Token JWT (válido 24h)
       ↓
Usuario → GET /api/suscripciones
          Header: Authorization: Bearer <token>
       ↓
Backend → Verificar token JWT
       → Decodificar payload
       → Agregar req.user
       → Ejecutar endpoint
       ↓
Usuario ← Datos de solicitudes
```

---

## 🔄 Actualización de Frontend

Para usar la autenticación desde el frontend, necesitarás:

1. **Crear página de login** (solo para administradores)
2. **Guardar token** en localStorage o sessionStorage
3. **Incluir token** en todas las peticiones a endpoints protegidos
4. **Manejar expiración** y redirigir a login cuando expire

**Ejemplo básico:**

```javascript
// Login
const login = async (email, password) => {
  const response = await axios.post('/api/auth/login', { email, password })
  const { token } = response.data

  // Guardar token
  localStorage.setItem('authToken', token)
}

// Configurar Axios para incluir token automáticamente
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Manejar errores de autenticación
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token inválido o expirado
      localStorage.removeItem('authToken')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)
```

---

## 📚 Recursos

- [JWT.io](https://jwt.io/) - Decodificador de JWT
- [bcrypt.js](https://github.com/dcodeIO/bcrypt.js) - Documentación de bcrypt
- [Express JWT](https://github.com/auth0/express-jwt) - Alternativa usando express-jwt

---

## 🆘 Troubleshooting

### "JWT_SECRET no está configurado"

**Causa**: Falta la variable `JWT_SECRET` en `.env`
**Solución**: Agregar `JWT_SECRET=tu-secret-key` en `.env`

### "Usuario no encontrado"

**Causa**: No hay usuarios en la colección `landing-page/data/usuarios_admin`
**Solución**: Ejecutar `npm run create-admin`

### "Token inválido"

**Causa**: Token expirado, corrupto o JWT_SECRET incorrecto
**Solución**: Hacer login nuevamente

### "Error al inicializar Firebase"

**Causa**: Credenciales de Firebase incorrectas
**Solución**: Verificar `GOOGLE_APPLICATION_CREDENTIALS` en `.env`

---

**¿Necesitas ayuda?** Revisa los logs del servidor para más detalles sobre los errores.
