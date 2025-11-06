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

const router = Router()

/**
 * @route   POST /api/suscripciones
 * @desc    Crear una nueva solicitud de suscripción
 * @access  Público
 */
router.post(
  '/',
  validarDatos(suscripcionSchema),
  crearSolicitud
)

/**
 * @route   GET /api/suscripciones
 * @desc    Obtener todas las solicitudes (con filtros opcionales)
 * @access  Privado (en producción, agregar autenticación)
 * @query   estado, plan, limite
 */
router.get(
  '/',
  getSolicitudes
)

/**
 * @route   GET /api/suscripciones/stats
 * @desc    Obtener estadísticas de solicitudes
 * @access  Privado (en producción, agregar autenticación)
 */
router.get(
  '/stats',
  getEstadisticas
)

/**
 * @route   PATCH /api/suscripciones/:id
 * @desc    Actualizar el estado de una solicitud
 * @access  Privado (en producción, agregar autenticación)
 */
router.patch(
  '/:id',
  validarDatos(actualizarEstadoSchema),
  actualizarEstado
)

export default router
