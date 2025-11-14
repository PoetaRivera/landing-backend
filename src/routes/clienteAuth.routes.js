/**
 * Rutas de Autenticación de Clientes
 * Endpoints para login, verificación, perfil y cambio de contraseña
 */

import express from 'express'
import { login, verifyToken, getProfile, changePassword, forgotPassword, resetPassword } from '../controllers/clienteAuth.controller.js'
import { authenticateCliente } from '../middlewares/clienteAuth.middleware.js'
import { loginLimiter, passwordResetLimiter } from '../middlewares/rateLimiter.js'

const router = express.Router()

/**
 * POST /api/clientes/login
 * Login de cliente con usuario/email y contraseña
 *
 * Body:
 * {
 *   "identifier": "maria.garcia" o "maria@ejemplo.com",
 *   "password": "Ab3k9Qz2"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "mensaje": "¡Login exitoso!",
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1...",
 *     "cliente": { ... }
 *   }
 * }
 */
router.post('/login', loginLimiter, login)

/**
 * GET /api/clientes/verify
 * Verifica si el token JWT es válido
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response:
 * {
 *   "success": true,
 *   "valido": true,
 *   "data": { ... }
 * }
 */
router.get('/verify', verifyToken)

/**
 * GET /api/clientes/me
 * Obtiene el perfil completo del cliente autenticado
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Requiere: authenticateCliente middleware
 *
 * Response:
 * {
 *   "success": true,
 *   "data": { ... perfil completo ... }
 * }
 */
router.get('/me', authenticateCliente, getProfile)

/**
 * POST /api/clientes/change-password
 * Cambia la contraseña del cliente autenticado
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Body:
 * {
 *   "passwordActual": "Ab3k9Qz2",
 *   "passwordNueva": "MiNuevaPassword123"
 * }
 *
 * Requiere: authenticateCliente middleware
 *
 * Response:
 * {
 *   "success": true,
 *   "mensaje": "¡Contraseña cambiada exitosamente!"
 * }
 */
router.post('/change-password', authenticateCliente, changePassword)

/**
 * POST /api/clientes/forgot-password
 * Solicitar recuperación de contraseña
 *
 * Body:
 * {
 *   "email": "maria@ejemplo.com"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "mensaje": "Si el email existe en nuestro sistema, recibirás un link de recuperación."
 * }
 */
router.post('/forgot-password', passwordResetLimiter, forgotPassword)

/**
 * POST /api/clientes/reset-password
 * Resetear contraseña con token
 *
 * Body:
 * {
 *   "token": "abc123...",
 *   "passwordNueva": "MiNuevaPassword123"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "mensaje": "¡Contraseña restablecida exitosamente! Ya puedes iniciar sesión con tu nueva contraseña."
 * }
 */
router.post('/reset-password', passwordResetLimiter, resetPassword)

export default router
