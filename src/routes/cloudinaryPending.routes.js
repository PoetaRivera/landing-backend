/**
 * Rutas para gestión de recursos pendientes en Cloudinary
 */

import express from 'express'
import {
  generarSalonId,
  guardarRecurso,
  obtenerRecursos,
  eliminarRecursos
} from '../controllers/cloudinaryPending.controller.js'

const router = express.Router()

/**
 * Rutas Públicas
 */

// Generar nuevo salonId
router.get('/generate-id', generarSalonId)

// Guardar recurso
router.post('/', guardarRecurso)

// Obtener recursos de un salón
router.get('/:salonId', obtenerRecursos)

// Eliminar recursos (requiere autenticación en producción)
router.delete('/:salonId', eliminarRecursos)

export default router
