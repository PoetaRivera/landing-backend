import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter para rutas de login
 * Máximo 5 intentos cada 15 minutos
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: {
    success: false,
    error: 'Demasiados intentos de inicio de sesión',
    mensaje: 'Has excedido el límite de intentos. Por favor intenta nuevamente en 15 minutos.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Rate Limiter para recuperación de contraseña
 * Máximo 3 intentos cada hora (prevenir spam)
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 intentos
  message: {
    success: false,
    error: 'Demasiados intentos de recuperación',
    mensaje: 'Has excedido el límite de solicitudes de recuperación. Por favor intenta nuevamente en 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiter para creación de suscripciones
 * Máximo 10 solicitudes cada hora (prevenir spam de formulario)
 */
const suscripcionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 solicitudes
  message: {
    success: false,
    error: 'Demasiadas solicitudes',
    mensaje: 'Has excedido el límite de solicitudes. Por favor intenta nuevamente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiter general para API
 * Máximo 100 requests cada 15 minutos
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests
  message: {
    success: false,
    error: 'Demasiadas solicitudes',
    mensaje: 'Has excedido el límite de solicitudes. Por favor intenta nuevamente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiter estricto para operaciones críticas
 * Máximo 20 requests cada 15 minutos
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // 20 requests
  message: {
    success: false,
    error: 'Demasiadas solicitudes',
    mensaje: 'Has excedido el límite de solicitudes. Por favor intenta nuevamente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export {
  loginLimiter,
  passwordResetLimiter,
  suscripcionLimiter,
  apiLimiter,
  strictLimiter
};
