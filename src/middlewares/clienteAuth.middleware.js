/**
 * Middleware de Autenticación para Clientes
 * Protege rutas que requieren que el usuario sea un cliente autenticado
 */

import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido en las variables de entorno')
}

/**
 * Middleware principal de autenticación para clientes
 * Verifica que el token JWT sea válido y que el usuario sea un cliente
 *
 * Uso:
 * router.get('/perfil', authenticateCliente, getProfile)
 */
export const authenticateCliente = (req, res, next) => {
  try {
    // 1. Obtener el token de cookies (preferido) o del header Authorization (fallback)
    let token = req.cookies?.clienteToken // Leer de cookie primero

    if (!token) {
      const authHeader = req.headers['authorization']
      token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN (fallback)
    }

    // 2. Verificar que el token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Acceso denegado. Token no proporcionado.',
        mensaje: 'Debes iniciar sesión para acceder a este recurso.'
      })
    }

    // 3. Verificar que el token sea válido
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        // Token inválido o expirado
        return res.status(403).json({
          success: false,
          error: 'Token inválido o expirado',
          mensaje: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
        })
      }

      // 4. Verificar que el role sea 'cliente'
      if (decoded.role !== 'cliente') {
        return res.status(403).json({
          success: false,
          error: 'Acceso denegado',
          mensaje: 'No tienes permisos para acceder a este recurso.'
        })
      }

      // 5. Adjuntar información del cliente a req.cliente
      req.cliente = {
        clienteId: decoded.clienteId,
        email: decoded.email,
        usuario: decoded.usuario,
        nombreCompleto: decoded.nombreCompleto,
        role: decoded.role
      }

      // 6. Continuar con el siguiente middleware/controlador
      next()
    })
  } catch (error) {
    console.error('❌ Error en authenticateCliente middleware:', error)
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor',
      mensaje: 'Ocurrió un error al verificar tu autenticación.'
    })
  }
}

/**
 * Middleware que requiere que el cliente esté activo
 * Debe usarse después de authenticateCliente
 *
 * Uso:
 * router.get('/perfil', authenticateCliente, requireClienteActivo, getProfile)
 */
export const requireClienteActivo = (req, res, next) => {
  // Verificar que el cliente esté activo
  // (esto requeriría consultar la BD, lo dejamos para implementación futura si es necesario)
  // Por ahora, simplemente pasamos al siguiente middleware
  next()
}

/**
 * Middleware opcional de autenticación
 * Si hay token, lo verifica y adjunta req.cliente
 * Si no hay token, continúa sin error
 *
 * Útil para rutas que pueden funcionar con o sin autenticación
 *
 * Uso:
 * router.get('/publico', optionalClienteAuth, getPublicData)
 */
export const optionalClienteAuth = (req, res, next) => {
  try {
    // Obtener el token de cookies (preferido) o del header Authorization (fallback)
    let token = req.cookies?.clienteToken

    if (!token) {
      const authHeader = req.headers['authorization']
      token = authHeader && authHeader.split(' ')[1]
    }

    if (!token) {
      // No hay token, pero eso está bien
      req.cliente = null
      return next()
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        // Token inválido, pero no bloqueamos la petición
        req.cliente = null
        return next()
      }

      if (decoded.role === 'cliente') {
        req.cliente = {
          clienteId: decoded.clienteId,
          email: decoded.email,
          usuario: decoded.usuario,
          nombreCompleto: decoded.nombreCompleto,
          role: decoded.role
        }
      } else {
        req.cliente = null
      }

      next()
    })
  } catch (error) {
    // En caso de error, simplemente continuamos sin autenticación
    req.cliente = null
    next()
  }
}

export default {
  authenticateCliente,
  requireClienteActivo,
  optionalClienteAuth
}
