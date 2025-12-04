# 🚀 Backend - Landing MultiSalon

**Estado:** ✅ DESPLEGADO EN PRODUCCIÓN
**URL Producción:** https://puzzled-bryna-misalons-8a27e451.koyeb.app
**Hosting:** Koyeb (Free Tier)
**Última actualización:** 3 de Diciembre 2025

API para gestión de solicitudes de suscripción, autenticación de administradores y clientes, y onboarding de nuevos salones.

---

## 📊 URLs del Proyecto

| Entorno | URL | Estado |
|---------|-----|--------|
| **Producción (Backend)** | https://puzzled-bryna-misalons-8a27e451.koyeb.app | ✅ Running |
| **Producción (Frontend)** | https://adminmisalons.web.app | ✅ Deployed |
| **Desarrollo (Backend)** | http://localhost:4001 | - |
| **Desarrollo (Frontend)** | http://localhost:5174 | - |
| **GitHub Backend** | https://github.com/PoetaRivera/landing-backend | ✅ Sincronizado |
| **GitHub Frontend** | https://github.com/PoetaRivera/landing-frontend | ✅ Sincronizado |

---

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   ├── firebase.js           # Firebase Admin SDK (soporta JSON en variable)
│   │   ├── email.js              # Nodemailer config (Gmail SMTP)
│   │   ├── stripe.js             # Stripe config (OPCIONAL)
│   │   ├── cloudinary.js         # Cloudinary config
│   │   └── validateEnv.js        # Validación de variables de entorno
│   │
│   ├── routes/
│   │   ├── suscripciones.routes.js
│   │   ├── auth.routes.js             # Autenticación de admins
│   │   ├── clienteAuth.routes.js      # Autenticación de clientes
│   │   ├── admin.routes.js            # Panel de administración
│   │   ├── solicitudesCompletas.routes.js  # Onboarding completo
│   │   ├── upload.routes.js           # Upload de imágenes
│   │   └── payment.routes.js          # Pagos con Stripe (opcional)
│   │
│   ├── controllers/
│   │   ├── suscripciones.controller.js
│   │   ├── auth.controller.js
│   │   ├── clienteAuth.controller.js
│   │   ├── admin.controller.js
│   │   ├── solicitudesCompletas.controller.js
│   │   └── upload.controller.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js         # Validación JWT para admins
│   │   ├── clienteAuth.middleware.js  # Validación JWT para clientes
│   │   └── rateLimiter.js             # Rate limiting
│   │
│   ├── utils/
│   │   ├── validation.js              # Schemas de validación Zod
│   │   ├── clienteUtils.js            # Utilidades para clientes
│   │   ├── generateSalonId.js         # Generador de IDs únicos
│   │   ├── crearSalonCompleto.js      # Crear salón en sistema principal
│   │   └── logger.js                  # Logger seguro
│   │
│   └── server.js                      # Entry point
│
├── scripts/
│   └── createAdmin.js                 # Script para crear admin
│
├── .env                               # Variables de entorno (LOCAL - no subir)
├── .env.example                       # Template de variables
├── .env.production.example            # Template para producción
├── KOYEB_ENV.txt                      # Variables para Koyeb (LOCAL - no subir)
├── README_KOYEB.md                    # Guía de deployment en Koyeb
├── RESUMEN_DEPLOYMENT.md              # Estado del deployment
├── package.json
└── README.md                          # Este archivo
```

---

## 🛠️ Stack Tecnológico

- **Node.js** v18+
- **Express** 4.19.0 - Framework web
- **Firebase Admin SDK** 12.3.0 - Firestore
- **Nodemailer** 6.9.0 - Envío de emails (Gmail SMTP)
- **JWT** (jsonwebtoken) - Autenticación con tokens
- **bcryptjs** - Hash de contraseñas
- **Zod** 3.23.0 - Validación de datos
- **Cloudinary** 2.8.0 - Upload de imágenes
- **Helmet** 8.1.0 - Seguridad HTTP headers
- **express-mongo-sanitize** - Prevención NoSQL injection
- **express-rate-limit** - Rate limiting
- **CORS** - Control de acceso
- **Stripe** (opcional) - Procesamiento de pagos

---

## 🚀 Inicio Rápido (Desarrollo)

### 1. Instalación

```bash
cd backend
npm install
```

### 2. Variables de Entorno

Copia `.env.example` a `.env` y configura:

```bash
# Entorno
NODE_ENV=development
PORT=4001

# JWT
JWT_SECRET=genera-un-secret-aleatorio-de-64-caracteres
JWT_EXPIRES_IN=24h

# Firebase (archivo local en desarrollo)
GOOGLE_APPLICATION_CREDENTIALS=./firebase-credentials.json

# Email (Gmail App Password)
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
EMAIL_ADMIN=admin@misalons.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5174
```

### 3. Crear Usuario Administrador

```bash
npm run create-admin
```

Sigue las instrucciones para crear tu primer admin.

### 4. Iniciar Servidor

```bash
npm run dev
# Servidor en: http://localhost:4001
```

---

## 🌐 Deployment en Koyeb

### Variables de Entorno en Producción

Ver archivo `KOYEB_ENV.txt` (LOCAL) para las 12 variables necesarias:

1. `NODE_ENV=production`
2. `PORT=8000`
3. `JWT_SECRET` (nuevo, diferente del backend principal)
4. `JWT_EXPIRES_IN=24h`
5. `GOOGLE_APPLICATION_CREDENTIALS_JSON` (JSON completo en una línea)
6. `EMAIL_USER`
7. `EMAIL_PASSWORD`
8. `EMAIL_ADMIN`
9. `CLOUDINARY_CLOUD_NAME`
10. `CLOUDINARY_API_KEY`
11. `CLOUDINARY_API_SECRET`
12. `FRONTEND_URL=https://adminmisalons.web.app`

### Guía Completa de Deployment

Ver **[README_KOYEB.md](./README_KOYEB.md)** para instrucciones paso a paso.

### Redeploy Automático

Cada `git push` a `main` activa un redeploy automático en Koyeb (~2-3 minutos).

```bash
git add .
git commit -m "Descripción del cambio"
git push origin main
```

---

## 🔌 Endpoints Principales

### Públicos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Health check básico |
| GET | `/api/health` | Health check detallado |
| POST | `/api/suscripciones` | Crear solicitud de suscripción |

### Autenticación - Administradores

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login admin (retorna JWT en cookie) | No |
| POST | `/api/auth/logout` | Logout admin | No |
| GET | `/api/auth/verify` | Verificar token válido | JWT |
| POST | `/api/auth/forgot-password` | Solicitar recuperación | No |
| POST | `/api/auth/reset-password/:token` | Resetear contraseña | No |

### Autenticación - Clientes

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/clientes/login` | Login cliente (retorna JWT en cookie) | No |
| POST | `/api/clientes/logout` | Logout cliente | No |
| GET | `/api/clientes/verify` | Verificar token válido | JWT |
| GET | `/api/clientes/me` | Obtener perfil del cliente | JWT |

### Panel de Administración

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/estadisticas` | Dashboard estadísticas | Admin JWT |
| GET | `/api/admin/solicitudes` | Listar solicitudes | Admin JWT |
| PATCH | `/api/admin/solicitudes/:id/estado` | Actualizar estado | Admin JWT |
| POST | `/api/admin/solicitudes/:id/confirmar-pago` | Confirmar pago y crear cliente | Admin JWT |
| GET | `/api/admin/clientes` | Listar clientes | Admin JWT |

### Portal de Clientes (Onboarding)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/solicitudes-completas` | Listar solicitudes completas | Cliente JWT |
| GET | `/api/solicitudes-completas/:id` | Obtener solicitud | Cliente JWT |
| POST | `/api/solicitudes-completas` | Crear solicitud completa (onboarding) | Cliente JWT |
| POST | `/api/solicitudes-completas/:id/crear-salon` | Crear salón desde onboarding | Admin JWT |

### Upload de Imágenes

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload` | Upload imagen a Cloudinary | Cliente/Admin JWT |

---

## 💾 Estructura de Firestore

```
📁 Firestore Root
└── landing-page/                    # Contenedor del landing
    └── data/                        # Documento contenedor
        ├── usuarios_admin/          # Administradores del panel
        │   └── {userId}
        │       ├── nombre, email, passwordHash
        │       ├── role: "admin"
        │       └── activo: boolean
        │
        ├── solicitudes/             # Solicitudes de suscripción
        │   └── {docId}
        │       ├── nombreSalon, nombrePropietario
        │       ├── email, telefono, plan
        │       ├── estado: 'pendiente' | 'contactado' | 'procesado' | 'rechazado'
        │       └── clienteId: string | null
        │
        ├── clientes/                # Clientes registrados
        │   └── {docId}
        │       ├── nombreCompleto, email, telefono
        │       ├── usuario, passwordHash
        │       ├── nombreSalon, salonId
        │       ├── estado: 'pendiente_onboarding' | 'onboarding_completado' | 'activo'
        │       ├── solicitudId (referencia)
        │       └── planSeleccionado
        │
        └── solicitudes-completas/   # Formularios de onboarding
            └── {docId}
                ├── clienteId (referencia)
                ├── nombreSalon, descripcion
                ├── servicios: [...]
                ├── productos: [...]
                ├── estilistas: [...]
                ├── horarios, redesSociales
                ├── logoUrl, imagenesCarrusel
                └── estado: 'pendiente_revision' | 'aprobado' | 'rechazado'
```

**Nota:** Separado completamente de la colección `salones/` del sistema principal.

---

## 🔐 Seguridad

### CORS

```javascript
// Permite requests de:
- https://adminmisalons.web.app (producción)
- http://localhost:5174 (desarrollo)
- Requests sin origin (health checks, APIs)
```

### JWT con HTTP-only Cookies

- Tokens guardados en cookies HTTP-only (no accesibles desde JavaScript)
- Protección contra XSS
- SameSite: strict (protección CSRF)
- Expiración: 24 horas

### Rate Limiting

- General: 100 req/15min (producción)
- Auth: 5 intentos/15min
- Public: 50 req/5min
- Create: 20 recursos/hora

### Validación de Entrada

- Todos los endpoints validados con Zod
- Sanitización contra NoSQL injection
- Helmet.js para headers de seguridad

---

## 📧 Sistema de Emails

### Configuración

**Servicio:** Gmail SMTP con App Password

**Emails enviados:**
1. **Nueva solicitud** → Admin recibe notificación
2. **Confirmación al cliente** → Cliente recibe confirmación
3. **Credenciales de acceso** → Cliente recibe usuario/password
4. **Recuperación de contraseña** → Token de reset
5. **Nueva pre-reserva** → Estilistas reciben notificación

### Obtener Gmail App Password

1. Google Account → Security → 2-Step Verification (activar)
2. App passwords → Generate
3. Copiar password de 16 caracteres
4. Usar en `EMAIL_PASSWORD`

---

## 🧪 Testing

### Health Checks

```bash
# Producción
curl https://puzzled-bryna-misalons-8a27e451.koyeb.app/api/health

# Desarrollo
curl http://localhost:4001/api/health
```

### Endpoints con Postman/Thunder Client

Ver colección de Postman en `/docs/` (si existe).

---

## 📝 Scripts Disponibles

```bash
npm run dev          # Desarrollo con nodemon (auto-reload)
npm start            # Producción (usado por Koyeb)
npm run create-admin # Crear usuario administrador
npm test             # Tests (si están configurados)
```

---

## 🔄 Flujo de Onboarding Completo

1. **Usuario solicita suscripción** → `POST /api/suscripciones`
2. **Admin confirma pago** → `POST /api/admin/solicitudes/:id/confirmar-pago`
   - Se crea cliente con estado: `'pendiente_onboarding'`
   - Email con credenciales enviado
3. **Cliente hace login** → `POST /api/clientes/login`
   - Redirección automática a `/cliente/onboarding`
4. **Cliente completa formulario** → `POST /api/solicitudes-completas`
   - Upload de logo e imágenes
   - Servicios, productos, estilistas
5. **Admin revisa y aprueba** → `POST /api/solicitudes-completas/:id/crear-salon`
   - Se crea salón en sistema principal
   - Cliente estado: `'activo'`
   - Email con acceso al salón

---

## 📚 Documentación Adicional

- **[AUTHENTICATION.md](./AUTHENTICATION.md)** - Sistema de autenticación JWT
- **[README_KOYEB.md](./README_KOYEB.md)** - Guía de deployment en Koyeb
- **[RESUMEN_DEPLOYMENT.md](./RESUMEN_DEPLOYMENT.md)** - Estado actual del deployment
- **[API_AUTENTICACION_CLIENTES.md](./API_AUTENTICACION_CLIENTES.md)** - API de clientes
- **[AUTO_REGISTRO_CLIENTES.md](./AUTO_REGISTRO_CLIENTES.md)** - Flujo de registro

---

## 🐛 Troubleshooting

### Error: CORS blocked

**Solución:** Verificar que `FRONTEND_URL` en Koyeb apunte a `https://adminmisalons.web.app`

### Error: Firebase credentials not found

**Solución:** Verificar que `GOOGLE_APPLICATION_CREDENTIALS_JSON` esté completo en Koyeb (JSON en una línea)

### Error: Stripe no configurado

**Esto es normal** - Stripe es opcional. El warning es esperado.

### Logs en Koyeb

Koyeb Dashboard → Tu servicio → Logs

---

## 🔗 Enlaces Útiles

- **Koyeb Dashboard:** https://app.koyeb.com
- **Firebase Console:** https://console.firebase.google.com/project/backenduserfirebase
- **Cloudinary Console:** https://console.cloudinary.com
- **GitHub Repo:** https://github.com/PoetaRivera/landing-backend

---

## 💰 Costos

| Servicio | Plan | Costo |
|----------|------|-------|
| Koyeb | Free | $0/mes |
| Firebase Firestore | Spark | $0/mes |
| Cloudinary | Free | $0/mes |
| Gmail SMTP | Free | $0/mes |

**Total:** $0/mes 🎉

---

## ✅ Checklist de Producción

- [x] Backend desplegado en Koyeb
- [x] Variables de entorno configuradas
- [x] Firebase credentials funcionando
- [x] CORS configurado correctamente
- [x] JWT funcionando con cookies
- [x] Emails enviándose correctamente
- [x] Frontend conectado y funcionando
- [x] Repositorio sincronizado con GitHub
- [x] Auto-deploy configurado (git push)
- [x] Health checks pasando

---

**Proyecto:** Landing MultiSalon - Backend API
**Mantenido por:** PoetaRivera
**Última actualización:** 3 de Diciembre 2025
**Estado:** ✅ PRODUCCIÓN ACTIVA
