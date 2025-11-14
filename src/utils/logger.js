/**
 * Sistema de Logging Condicional
 * Solo muestra logs en desarrollo, silencia en producción
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Logger personalizado que solo funciona en desarrollo
 */
const logger = {
  /**
   * Log de información general
   */
  info: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log de errores (siempre se muestra, pero menos verbose en producción)
   */
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    } else {
      // En producción, solo log el mensaje principal (sin stack trace completo)
      console.error(args[0]);
    }
  },

  /**
   * Log de advertencias
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log de debug (solo desarrollo)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  },

  /**
   * Log de éxito (con emoji)
   */
  success: (...args) => {
    if (isDevelopment) {
      console.log('✅', ...args);
    }
  },

  /**
   * Log de tabla (útil para arrays/objetos)
   */
  table: (data) => {
    if (isDevelopment) {
      console.table(data);
    }
  },

  /**
   * Grupo de logs
   */
  group: (label) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  }
};

export default logger;
