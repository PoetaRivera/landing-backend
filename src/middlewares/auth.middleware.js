import jwt from 'jsonwebtoken'

/**
 * Middleware para verificar token JWT en las peticiones
 * Protege rutas administrativas
 */
export const authenticateToken = (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Acceso denegado',
        mensaje: 'Se requiere autenticación para acceder a este recurso'
      })
    }

    // Verificar el token
    const JWT_SECRET = process.env.JWT_SECRET

    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET no está configurado en las variables de entorno')
      return res.status(500).json({
        success: false,
        error: 'Error de configuración del servidor'
      })
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        console.error('⚠️  Token inválido:', err.message)
        return res.status(403).json({
          success: false,
          error: 'Token inválido o expirado',
          mensaje: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
        })
      }

      // Agregar información del usuario al request
      req.user = user
      next()
    })
  } catch (error) {
    console.error('❌ Error en middleware de autenticación:', error)
    return res.status(500).json({
      success: false,
      error: 'Error al verificar autenticación'
    })
  }
}

/**
 * Middleware para verificar que el usuario es administrador
 * Debe usarse después de authenticateToken
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'No autenticado'
    })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado',
      mensaje: 'No tienes permisos suficientes para acceder a este recurso'
    })
  }

  next()
}

/**
 * Middleware opcional de autenticación
 * No bloquea si no hay token, pero lo valida si existe
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    req.user = null
    return next()
  }

  const JWT_SECRET = process.env.JWT_SECRET

  if (!JWT_SECRET) {
    req.user = null
    return next()
  }

  try {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        req.user = null
      } else {
        req.user = user
      }
      next()
    })
  } catch (error) {
    req.user = null
    next()
  }
}

export default {
  authenticateToken,
  requireAdmin,
  optionalAuth
}
