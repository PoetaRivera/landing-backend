/**
 * Rutas para subir imágenes a Cloudinary
 */

import express from 'express'
import { uploadImage, uploadMultipleImages } from '../controllers/upload.controller.js'
import rateLimit from 'express-rate-limit'

const router = express.Router()

/**
 * Rate Limiter para uploads (protección contra abuso)
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // máximo 20 uploads por IP cada 15 minutos
  message: {
    success: false,
    error: 'Demasiadas solicitudes',
    mensaje: 'Has excedido el límite de subidas. Por favor, intenta nuevamente en 15 minutos.'
  }
})

/**
 * Rutas Públicas (con rate limiting)
 */

// Subir una imagen
router.post('/', uploadLimiter, uploadImage)

// Subir múltiples imágenes
router.post('/multiple', uploadLimiter, uploadMultipleImages)

export default router
