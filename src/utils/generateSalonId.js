/**
 * Utilidad para generar ID único de salón
 */

/**
 * Generar salonId único
 * Formato: salon_{timestamp}_{random}
 * Ejemplo: salon_1732198232_4567
 *
 * @returns {string} - salonId único
 */
export const generateSalonId = () => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  return `salon_${timestamp}_${random}`
}

/**
 * Validar formato de salonId
 * @param {string} salonId
 * @returns {boolean}
 */
export const validateSalonId = (salonId) => {
  if (!salonId || typeof salonId !== 'string') return false

  // Formato: salon_{timestamp}_{random}
  const pattern = /^salon_\d+_\d+$/
  return pattern.test(salonId)
}
