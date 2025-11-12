# ⚙️ BACKEND - LANDING MULTISALON

API mínima para gestión de solicitudes de suscripción.

---

## 📁 ESTRUCTURA DE CARPETAS

```
backend/
├── src/
│   ├── config/
│   │   ├── firebase.js           # Configuración Firebase Admin SDK
│   │   └── email.js              # Configuración Nodemailer
│   │
│   ├── routes/
│   │   └── suscripciones.routes.js   # Rutas de suscripciones
│   │
│   ├── controllers/
│   │   └── suscripciones.controller.js   # Lógica de negocio
│   │
│   ├── utils/
│   │   ├── emailTemplates.js     # Plantillas HTML de emails
│   │   └── validation.js         # Validación con Zod
│   │
│   └── server.js                 # Entry point
│
├── .env                          # Variables de entorno
├── .env.example                  # Ejemplo de variables
├── package.json
└── README.md                     # Este archivo
```

---

## 🛠️ TECNOLOGÍAS

- **Node.js** v18+
- **Express** - Framework web
- **Firebase Admin SDK** - Firestore
- **Nodemailer** - Envío de emails
- **Zod** - Validación de datos
- **CORS** - Habilitar peticiones del frontend
- **dotenv** - Variables de entorno
- **JWT** - Autenticación con tokens
- **bcryptjs** - Hash de contraseñas

---

## 🚀 INICIO RÁPIDO

### Instalación

```bash
# Desde la carpeta backend/
npm install
```

### Variables de Entorno

Crea archivo `.env`:

```bash
# Puerto del servidor
PORT=4001

# Firebase Admin SDK
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-project.iam.gserviceaccount.com

# O usar archivo JSON completo:
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json

# Email (Gmail SMTP)
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password  # Contraseña de aplicación, NO tu contraseña normal
EMAIL_ADMIN=admin@multisalon.com  # Email que recibirá las notificaciones

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:5174

# JWT Autenticación
JWT_SECRET=tu-secret-key-muy-seguro-y-aleatorio-minimo-32-caracteres
JWT_EXPIRES_IN=24h

# Entorno
NODE_ENV=development
```

### Crear Usuario Administrador

Para acceder a los endpoints protegidos, primero debes crear un usuario administrador:

```bash
npm run create-admin
```

Sigue las instrucciones en pantalla para crear tu usuario admin.

**⚠️ IMPORTANTE**: Lee [AUTHENTICATION.md](./AUTHENTICATION.md) para más detalles sobre el sistema de autenticación.

### Desarrollo

```bash
npm run dev
# Server en: http://localhost:4001
```

### Producción

```bash
npm start
```

### Scripts Disponibles

```bash
npm run dev          # Desarrollo con nodemon (auto-reload)
npm start            # Producción
npm run create-admin # Crear usuario administrador
```

---

## 🔌 ENDPOINTS

### `POST /api/suscribir`

Recibe y procesa una solicitud de suscripción.

**Request Body:**

```json
{
  "nombreContacto": "Juan Pérez",
  "emailContacto": "juan@ejemplo.com",
  "telefonoContacto": "+503 7777-8888",
  "nombreSalon": "Belleza Total",
  "direccionSalon": "San Salvador, Centro",
  "plan": "premium",
  "tipoServicio": "todo-incluido",
  "mensaje": "Necesito ayuda con configuración inicial"
}
```

**Validaciones:**

- `nombreContacto`: string, requerido, min 3 caracteres
- `emailContacto`: email válido, requerido
- `telefonoContacto`: string, requerido, formato +XXX XXXX-XXXX
- `nombreSalon`: string, requerido, min 3 caracteres
- `direccionSalon`: string, requerido
- `plan`: enum ["basico", "premium", "enterprise"]
- `tipoServicio`: enum ["todo-incluido", "auto-gestion"]
- `mensaje`: string, opcional

**Response exitoso (200):**

```json
{
  "success": true,
  "message": "Solicitud recibida exitosamente",
  "solicitudId": "abc123xyz"
}
```

**Response error (400/500):**

```json
{
  "success": false,
  "error": "Descripción del error"
}
```

**Proceso interno:**

1. Valida datos con Zod
2. Genera ID único para la solicitud
3. Guarda en Firestore: `solicitudes_suscripcion/{solicitudId}`
4. Envía email al administrador
5. Envía email de confirmación al cliente
6. Retorna respuesta

---

## 💾 ESTRUCTURA DE DATOS - FIRESTORE

### Colección: `solicitudes_suscripcion`

```javascript
solicitudes_suscripcion/{solicitudId}
{
  // Datos del cliente
  nombreContacto: "Juan Pérez",
  emailContacto: "juan@ejemplo.com",
  telefonoContacto: "+503 7777-8888",

  // Datos del salón
  nombreSalon: "Belleza Total",
  direccionSalon: "San Salvador, Centro",

  // Plan y servicio
  plan: "premium",              // basico | premium | enterprise
  tipoServicio: "todo-incluido", // todo-incluido | auto-gestion

  // Metadata
  estado: "pendiente",           // pendiente | en_proceso | completado | cancelado
  fechaSolicitud: Timestamp,

  // Adicional
  mensaje: "Necesito ayuda con configuración inicial",

  // Seguimiento (para uso interno)
  salonCreado: false,
  salonId: null,
  fechaPago: null,
  fechaActivacion: null,
  notasAdmin: ""
}
```

---

## 📧 EMAILS

### Email al Administrador

**Asunto:** 🆕 Nueva Solicitud de Suscripción - [nombreSalon]

**Contenido:**
- Datos del cliente (nombre, email, teléfono)
- Datos del salón
- Plan seleccionado
- Tipo de servicio
- Mensaje del cliente
- Link al panel admin (futuro)

### Email al Cliente

**Asunto:** ✅ Solicitud Recibida - MultiSalón

**Contenido:**
- Confirmación de recepción
- Resumen de su solicitud
- Próximos pasos
- Información de contacto

---

## 🔧 CONFIGURACIÓN DE FIREBASE

### Obtener Credenciales

1. Ve a Firebase Console: https://console.firebase.google.com
2. Selecciona tu proyecto
3. Configuración del proyecto > Cuentas de servicio
4. Genera nueva clave privada (JSON)
5. Descarga y guarda como `firebase-service-account.json` en la raíz del backend

### Opción 1: Usar archivo JSON

```bash
# .env
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
```

### Opción 2: Usar variables individuales

```bash
# .env
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@tu-project.iam.gserviceaccount.com
```

---

## 📨 CONFIGURACIÓN DE EMAIL (Gmail)

### Paso 1: Habilitar Contraseña de Aplicación

1. Ve a tu cuenta de Google
2. Seguridad > Verificación en dos pasos (actívala si no está)
3. Busca "Contraseñas de aplicaciones"
4. Genera una nueva para "Mail"
5. Copia la contraseña de 16 caracteres

### Paso 2: Configurar en .env

```bash
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # Contraseña de aplicación
EMAIL_ADMIN=admin@multisalon.com
```

**IMPORTANTE:** Nunca uses tu contraseña normal de Gmail, siempre usa contraseña de aplicación.

---

## 🛡️ SEGURIDAD

### CORS

```javascript
// server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true
}))
```

### Validación

Toda entrada es validada con Zod antes de procesarse.

### Rate Limiting (Futuro)

```javascript
// Limitar solicitudes por IP
// Máximo 5 solicitudes por hora
```

---

## 📊 LOGS Y DEBUGGING

### Logs en Consola

```javascript
console.log('📧 Email enviado a:', email)
console.log('✅ Solicitud guardada:', solicitudId)
console.log('❌ Error:', error.message)
```

### Logs en Archivo (Futuro)

Usar Winston o Pino para logs estructurados.

---

## 🚀 DEPLOY

### Opción 1: Render.com (Recomendado - Gratis)

1. Crear cuenta en https://render.com
2. Conectar repositorio de GitHub
3. Configurar Build Command: `npm install`
4. Configurar Start Command: `npm start`
5. Agregar variables de entorno en el panel
6. Deploy automático

### Opción 2: Railway.app

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Opción 3: Heroku

```bash
heroku create multisalon-landing-api
git push heroku main
heroku config:set EMAIL_USER=tu-email@gmail.com
```

---

## ✅ CHECKLIST DE DESARROLLO

### Setup Inicial
- [ ] Inicializar proyecto Node.js (`npm init`)
- [ ] Instalar dependencias
- [ ] Configurar variables de entorno
- [ ] Configurar Firebase Admin SDK
- [ ] Configurar Nodemailer

### Desarrollo
- [ ] Crear `server.js` (Express app)
- [ ] Configurar CORS
- [ ] Crear rutas: `POST /api/suscribir`
- [ ] Crear controller: `suscripciones.controller.js`
- [ ] Implementar validación con Zod
- [ ] Implementar guardado en Firestore
- [ ] Crear plantillas HTML de emails
- [ ] Implementar envío de emails
- [ ] Manejo de errores

### Testing
- [ ] Probar endpoint con Postman/Thunder Client
- [ ] Verificar guardado en Firestore
- [ ] Verificar envío de emails
- [ ] Probar validaciones

### Deploy
- [ ] Configurar servicio de deploy
- [ ] Agregar variables de entorno
- [ ] Deploy
- [ ] Probar en producción

---

## 📝 EJEMPLO DE PETICIÓN

### Usando cURL

```bash
curl -X POST http://localhost:4001/api/suscribir \
  -H "Content-Type: application/json" \
  -d '{
    "nombreContacto": "Juan Pérez",
    "emailContacto": "juan@ejemplo.com",
    "telefonoContacto": "+503 7777-8888",
    "nombreSalon": "Belleza Total",
    "direccionSalon": "San Salvador, Centro",
    "plan": "premium",
    "tipoServicio": "todo-incluido",
    "mensaje": "Necesito ayuda"
  }'
```

### Usando JavaScript (Axios)

```javascript
import axios from 'axios'

const datos = {
  nombreContacto: "Juan Pérez",
  emailContacto: "juan@ejemplo.com",
  telefonoContacto: "+503 7777-8888",
  nombreSalon: "Belleza Total",
  direccionSalon: "San Salvador, Centro",
  plan: "premium",
  tipoServicio: "todo-incluido",
  mensaje: "Necesito ayuda"
}

const response = await axios.post(
  'http://localhost:4001/api/suscribir',
  datos
)

console.log(response.data)
```

---

## 🔗 RECURSOS

- [Express.js Docs](https://expressjs.com/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Nodemailer](https://nodemailer.com/)
- [Zod](https://zod.dev/)

---

**Siguiente paso:** Inicializar proyecto con `npm init` e instalar dependencias
