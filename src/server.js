import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initializeFirebase } from './config/firebase.js'
import suscripcionesRoutes from './routes/suscripciones.routes.js'
import authRoutes from './routes/auth.routes.js'

// Cargar variables de entorno
dotenv.config()

const app = express()
const PORT = process.env.PORT || 4001

// Inicializar Firebase
initializeFirebase()

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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
app.use('/api/auth', authRoutes)
app.use('/api/suscripciones', suscripcionesRoutes)

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
║   📝 Ambiente: ${process.env.NODE_ENV || 'development'}                      ║
║   ⏰ Hora: ${new Date().toLocaleString('es-SV')}          ║
║                                                       ║
╔═══════════════════════════════════════════════════════╗
  `)
})

export default app
