import { Router } from 'express'
import {
  login,
  logout,
  verifyToken,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { loginLimiter } from '../middlewares/rateLimiter.js'

const router = Router()

/**
 * @route   POST /api/auth/login
 * @desc    Login de administrador
 * @access  Público
 */
router.post('/login', loginLimiter, login)

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión de administrador (limpia cookie)
 * @access  Público
 */
router.post('/logout', logout)

/**
 * @route   GET /api/auth/verify
 * @desc    Verificar si el token es válido
 * @access  Privado (requiere token)
 */
router.get('/verify', authenticateToken, verifyToken)

/**
 * @route   GET /api/auth/me
 * @desc    Obtener perfil del usuario actual
 * @access  Privado (requiere token)
 */
router.get('/me', authenticateToken, getProfile)

/**
 * @route   POST /api/auth/change-password
 * @desc    Cambiar contraseña del usuario actual
 * @access  Privado (requiere token)
 */
router.post('/change-password', authenticateToken, changePassword)

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar recuperación de contraseña (envía email con token)
 * @access  Público
 */
router.post('/forgot-password', loginLimiter, forgotPassword)

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Resetear contraseña usando token de recuperación
 * @access  Público (pero requiere token válido)
 */
router.post('/reset-password/:token', resetPassword)

export default router
