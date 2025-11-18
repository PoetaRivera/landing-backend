import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import cookieParser from 'cookie-parser'
import { validateEnv, getEnvInfo } from './config/validateEnv.js'
import { initializeFirebase } from './config/firebase.js'
import suscripcionesRoutes from './routes/suscripciones.routes.js'
import authRoutes from './routes/auth.routes.js'
import clienteAuthRoutes from './routes/clienteAuth.routes.js'
import paymentRoutes from './routes/payment.routes.js'
import adminRoutes from './routes/admin.routes.js'

// Cargar variables de entorno
dotenv.config()

// 🔒 CRÍTICO: Validar variables de entorno ANTES de iniciar servidor
validateEnv()

const app = express()
const PORT = process.env.PORT || 4001

// Obtener información del ambiente
const envInfo = getEnvInfo()

// Inicializar Firebase
initializeFirebase()

// Middlewares de CORS - IMPORTANTE: credentials: true para cookies
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176'
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // 🔒 SEGURIDAD: Solo permitir requests sin origin en desarrollo
    // Esto es para Postman, Thunder Client, etc. durante desarrollo
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true)
    }

    // Validar que el origin esté en la lista permitida
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.warn(`⚠️  CORS blocked origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true, // CRÍTICO: Permitir envío de cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false // Necesario para Stripe y otras APIs externas
}))

// Sanitización contra NoSQL injection
app.use(mongoSanitize({
  replaceWith: '_' // Reemplaza caracteres prohibidos con _
}))

// IMPORTANTE: El webhook de Stripe debe recibir el raw body ANTES del parsing JSON
// Por eso usamos express.raw() solo para esta ruta
app.use(
  '/api/payment/webhook',
  express.raw({ type: 'application/json' })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser()) // Parsear cookies

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API Landing MultiSalon funcionando correctamente',
    version: '1.0.0',
    puerto: PORT
  })
})

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  })
})

// Rutas de la API
app.use('/api/auth', authRoutes) // Autenticación de admins
app.use('/api/admin', adminRoutes) // Panel de administración
app.use('/api/clientes', clienteAuthRoutes) // Autenticación de clientes
app.use('/api/suscripciones', suscripcionesRoutes)
app.use('/api/payment', paymentRoutes) // Pagos con Stripe

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  })
})

// Manejo de errores globales
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    error: 'Error interno del servidor',
    mensaje: process.env.NODE_ENV === 'development' ? err.message : 'Error inesperado'
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Servidor Landing MultiSalon Iniciado            ║
║                                                       ║
║   🌐 URL: http://localhost:${PORT}                      ║
║   📝 Ambiente: ${envInfo.nodeEnv}                               ║
║   💳 Stripe: ${envInfo.stripeMode}                                   ║
║   🎯 Frontend: ${envInfo.frontendUrl}           ║
║   ⏰ Hora: ${new Date().toLocaleString('es-SV')}          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `)
})

export default app
