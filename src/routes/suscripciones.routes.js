import { Router } from 'express'
import {
  crearSolicitud,
  getSolicitudes,
  actualizarEstado,
  getEstadisticas
} from '../controllers/suscripciones.controller.js'

import {
  validarDatos,
  suscripcionSchema,
  actualizarEstadoSchema
} from '../utils/validation.js'

import { authenticateToken } from '../middlewares/auth.middleware.js'
import { suscripcionLimiter, strictLimiter } from '../middlewares/rateLimiter.js'

const router = Router()

/**
 * @route   POST /api/suscripciones
 * @desc    Crear una nueva solicitud de suscripción
 * @access  Público
 */
router.post(
  '/',
  suscripcionLimiter,
  validarDatos(suscripcionSchema),
  crearSolicitud
)

/**
 * @route   GET /api/suscripciones
 * @desc    Obtener todas las solicitudes (con filtros opcionales)
 * @access  Privado (requiere autenticación)
 * @query   estado, plan, limite
 */
router.get(
  '/',
  authenticateToken,
  getSolicitudes
)

/**
 * @route   GET /api/suscripciones/stats
 * @desc    Obtener estadísticas de solicitudes
 * @access  Privado (requiere autenticación)
 */
router.get(
  '/stats',
  authenticateToken,
  getEstadisticas
)

/**
 * @route   PATCH /api/suscripciones/:id
 * @desc    Actualizar el estado de una solicitud
 * @access  Privado (requiere autenticación)
 */
router.patch(
  '/:id',
  authenticateToken,
  validarDatos(actualizarEstadoSchema),
  actualizarEstado
)

export default router
