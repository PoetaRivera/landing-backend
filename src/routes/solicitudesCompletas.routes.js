/**
 * Rutas para Solicitudes Completas (Formulario de Onboarding)
 */

import express from 'express'
import {
  crearSolicitudCompleta,
  getSolicitudesCompletas,
  getSolicitudCompletaById,
  crearSalonDesdeSolicitudCompleta
} from '../controllers/solicitudesCompletas.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import rateLimit from 'express-rate-limit'

const router = express.Router()

/**
 * Rate Limiters
 */

// Limitar creación de solicitudes (público)
const solicitudLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // máximo 3 solicitudes por IP
  message: {
    success: false,
    error: 'Demasiadas solicitudes',
    mensaje: 'Has excedido el límite de solicitudes. Por favor, intenta nuevamente en 15 minutos.'
  }
})

/**
 * Rutas Públicas
 */

// Crear solicitud completa (formulario público de onboarding)
router.post('/', solicitudLimiter, crearSolicitudCompleta)

/**
 * Rutas Protegidas (Admin)
 */

// Obtener todas las solicitudes completas
router.get('/', authenticateToken, getSolicitudesCompletas)

// Obtener solicitud completa por ID
router.get('/:id', authenticateToken, getSolicitudCompletaById)

// Crear salón completo desde solicitud
router.post('/:id/crear-salon', authenticateToken, crearSalonDesdeSolicitudCompleta)

export default router
