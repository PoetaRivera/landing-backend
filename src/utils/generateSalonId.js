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
 * Acepta dos formatos:
 * 1. Temporal (onboarding): salon_{timestamp}_{random} (ej: salon_1732198232_4567)
 * 2. Final (salón creado): alfanumérico, 3-30 caracteres (ej: caroline, misalon, bellaestetic)
 *
 * @param {string} salonId
 * @returns {boolean}
 */
export const validateSalonId = (salonId) => {
  if (!salonId || typeof salonId !== 'string') return false

  // Formato 1: Temporal (salon_{timestamp}_{random})
  const patternTemporal = /^salon_\d+_\d+$/
  if (patternTemporal.test(salonId)) return true

  // Formato 2: Final (alfanumérico, 3-30 caracteres, solo minúsculas y números)
  // Permite: caroline, misalon, bellaestetic, salon123, etc.
  // NO permite: espacios, caracteres especiales, mayúsculas
  const patternFinal = /^[a-z0-9]{3,30}$/
  if (patternFinal.test(salonId)) return true

  return false
}
