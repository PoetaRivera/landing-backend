/**
 * Rutas del Panel de Administración
 * Endpoints protegidos para gestión de clientes y solicitudes
 */

import express from 'express'
import {
  getClientes,
  getClienteById,
  updateClienteEstado,
  getEstadisticas,
  getSolicitudesAdmin,
  updateSolicitudEstado,
  crearClienteDesdeSolicitud
} from '../controllers/admin.controller.js'
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware.js'
import { apiLimiter } from '../middlewares/rateLimiter.js'

const router = express.Router()

// Todas las rutas requieren autenticación de admin
router.use(authenticateToken)
router.use(requireAdmin)
router.use(apiLimiter) // Rate limiting general para rutas admin

/**
 * GET /api/admin/estadisticas
 * Obtener estadísticas del dashboard
 *
 * Response:
 * {
 *   "success": true,
 *   "estadisticas": {
 *     "clientes": { "total": 10, "activos": 8, ... },
 *     "suscripciones": { "activas": 5, ... },
 *     "planes": { "basico": 3, ... },
 *     "solicitudes": { "total": 15, ... },
 *     "ingresos": { "mensual": 450 }
 *   }
 * }
 */
router.get('/estadisticas', getEstadisticas)

/**
 * GET /api/admin/clientes
 * Obtener lista de clientes con filtros opcionales
 *
 * Query params:
 * - estado: activo, suspendido, cancelado
 * - plan: Plan Básico, Plan Estándar, Plan Premium
 * - limite: número de resultados (default: 50)
 * - offset: paginación (default: 0)
 *
 * Response:
 * {
 *   "success": true,
 *   "total": 10,
 *   "clientes": [ ... ]
 * }
 */
router.get('/clientes', getClientes)

/**
 * GET /api/admin/clientes/:id
 * Obtener detalles de un cliente específico
 *
 * Response:
 * {
 *   "success": true,
 *   "cliente": { ... }
 * }
 */
router.get('/clientes/:id', getClienteById)

/**
 * PATCH /api/admin/clientes/:id/estado
 * Actualizar estado de un cliente
 *
 * Body:
 * {
 *   "estado": "activo" | "suspendido" | "cancelado",
 *   "razon": "Razón del cambio (opcional)"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "mensaje": "Estado del cliente actualizado exitosamente"
 * }
 */
router.patch('/clientes/:id/estado', updateClienteEstado)

/**
 * GET /api/admin/solicitudes
 * Obtener lista de solicitudes con filtros opcionales
 *
 * Query params:
 * - estado: pendiente, procesado, rechazado
 * - plan: Plan Básico, Plan Estándar, Plan Premium
 * - limite: número de resultados (default: 50)
 * - offset: paginación (default: 0)
 *
 * Response:
 * {
 *   "success": true,
 *   "total": 15,
 *   "solicitudes": [ ... ]
 * }
 */
router.get('/solicitudes', getSolicitudesAdmin)

/**
 * PATCH /api/admin/solicitudes/:id/estado
 * Actualizar estado de una solicitud
 *
 * Body:
 * {
 *   "estado": "pendiente" | "contactado" | "procesado" | "rechazado",
 *   "notas": "Notas sobre el cambio (opcional)"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "mensaje": "Estado de solicitud actualizado exitosamente"
 * }
 */
router.patch('/solicitudes/:id/estado', updateSolicitudEstado)

/**
 * POST /api/admin/solicitudes/:id/crear-cliente
 * Crear cliente automáticamente desde una solicitud aprobada
 *
 * Proceso automático:
 * 1. Obtiene datos de la solicitud
 * 2. Genera usuario único basado en email
 * 3. Genera contraseña temporal segura
 * 4. Crea cliente en Firestore
 * 5. Vincula solicitud con cliente
 * 6. Actualiza solicitud a estado "procesado"
 * 7. Envía email con credenciales al cliente
 *
 * Response:
 * {
 *   "success": true,
 *   "mensaje": "Cliente creado exitosamente",
 *   "data": {
 *     "clienteId": "abc123",
 *     "usuario": "maria.garcia",
 *     "passwordTemporal": "Luna-Gato-Mar-42",
 *     "email": "maria@email.com",
 *     "nombreSalon": "Bella Estética"
 *   }
 * }
 */
router.post('/solicitudes/:id/crear-cliente', crearClienteDesdeSolicitud)

export default router
