import { Router } from 'express'
import { login, verifyToken, getProfile, changePassword } from '../controllers/auth.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'

const router = Router()

/**
 * @route   POST /api/auth/login
 * @desc    Login de administrador
 * @access  Público
 */
router.post('/login', login)

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

export default router
