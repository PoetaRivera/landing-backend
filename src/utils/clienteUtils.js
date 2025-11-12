/**
 * Utilidades para gestión de clientes
 * Generación automática de credenciales y validaciones
 */

/**
 * Remueve acentos y caracteres especiales de un string
 */
const removerAcentos = (texto) => {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Genera un nombre de usuario a partir del nombre completo
 * Formato: nombre.apellido (sin acentos, minúsculas)
 *
 * @param {string} nombreCompleto - Nombre completo del cliente
 * @returns {string} - Usuario generado
 *
 * @example
 * generarUsuarioBase("María García López") // "maria.garcia"
 * generarUsuarioBase("José Alberto Pérez") // "jose.alberto"
 * generarUsuarioBase("Ana") // "ana"
 */
export const generarUsuarioBase = (nombreCompleto) => {
  if (!nombreCompleto || typeof nombreCompleto !== 'string') {
    throw new Error('Nombre completo es requerido')
  }

  // Normalizar: remover acentos, convertir a minúsculas, quitar caracteres especiales
  const nombreNormalizado = removerAcentos(nombreCompleto.trim())
    .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
    .replace(/\s+/g, ' ') // Normalizar espacios múltiples

  // Dividir en palabras
  const palabras = nombreNormalizado.split(' ').filter(p => p.length > 0)

  if (palabras.length === 0) {
    throw new Error('Nombre inválido')
  }

  // Estrategia de generación:
  // 1 palabra: "maria" → "maria"
  // 2 palabras: "maria garcia" → "maria.garcia"
  // 3+ palabras: "maria jose garcia" → "maria.garcia" (primera + última)

  let usuario

  if (palabras.length === 1) {
    usuario = palabras[0]
  } else if (palabras.length === 2) {
    usuario = `${palabras[0]}.${palabras[1]}`
  } else {
    // Tomar primera y última palabra
    usuario = `${palabras[0]}.${palabras[palabras.length - 1]}`
  }

  // Limitar longitud a 30 caracteres
  if (usuario.length > 30) {
    usuario = usuario.substring(0, 30)
  }

  return usuario
}

/**
 * Genera una contraseña temporal segura
 * Formato: 8 caracteres alfanuméricos (mayúsculas + minúsculas + números)
 *
 * @returns {string} - Contraseña temporal
 *
 * @example
 * generarPasswordTemporal() // "Ab3k9Qz2"
 */
export const generarPasswordTemporal = () => {
  const mayusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // Sin I, O
  const minusculas = 'abcdefghijkmnopqrstuvwxyz' // Sin l, o
  const numeros = '23456789' // Sin 0, 1 (evitar confusión)

  // Asegurar al menos 1 de cada tipo
  let password = ''

  // 1 mayúscula
  password += mayusculas.charAt(Math.floor(Math.random() * mayusculas.length))

  // 1 minúscula
  password += minusculas.charAt(Math.floor(Math.random() * minusculas.length))

  // 1 número
  password += numeros.charAt(Math.floor(Math.random() * numeros.length))

  // Completar hasta 8 caracteres con caracteres aleatorios
  const todosCaracteres = mayusculas + minusculas + numeros

  for (let i = password.length; i < 8; i++) {
    password += todosCaracteres.charAt(Math.floor(Math.random() * todosCaracteres.length))
  }

  // Mezclar caracteres para que no sean predecibles
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Valida que el usuario cumpla con los requisitos
 *
 * @param {string} usuario - Usuario a validar
 * @returns {boolean} - true si es válido
 */
export const validarUsuario = (usuario) => {
  if (!usuario || typeof usuario !== 'string') {
    return false
  }

  // Reglas:
  // - Longitud entre 3 y 30 caracteres
  // - Solo letras minúsculas, números y puntos
  // - No puede empezar o terminar con punto
  // - No puede tener puntos consecutivos

  const regex = /^[a-z0-9]([a-z0-9.]){1,28}[a-z0-9]$/

  if (!regex.test(usuario)) {
    return false
  }

  // Verificar que no tenga puntos consecutivos
  if (usuario.includes('..')) {
    return false
  }

  return true
}

/**
 * Valida el formato de un email
 *
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido
 */
export const validarEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false
  }

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email.toLowerCase())
}

/**
 * Valida que la contraseña cumpla con los requisitos mínimos
 *
 * @param {string} password - Contraseña a validar
 * @returns {object} - { valido: boolean, errores: string[] }
 */
export const validarPassword = (password) => {
  const errores = []

  if (!password || typeof password !== 'string') {
    return { valido: false, errores: ['Contraseña es requerida'] }
  }

  if (password.length < 8) {
    errores.push('La contraseña debe tener al menos 8 caracteres')
  }

  if (!/[A-Z]/.test(password)) {
    errores.push('La contraseña debe contener al menos una mayúscula')
  }

  if (!/[a-z]/.test(password)) {
    errores.push('La contraseña debe contener al menos una minúscula')
  }

  if (!/[0-9]/.test(password)) {
    errores.push('La contraseña debe contener al menos un número')
  }

  return {
    valido: errores.length === 0,
    errores
  }
}

/**
 * Genera datos completos para un nuevo cliente
 *
 * @param {object} datosSolicitud - Datos del formulario de suscripción
 * @returns {object} - { usuario, passwordTemporal }
 */
export const generarCredencialesCliente = (datosSolicitud) => {
  const usuario = generarUsuarioBase(datosSolicitud.nombrePropietario)
  const passwordTemporal = generarPasswordTemporal()

  return {
    usuario,
    passwordTemporal
  }
}

export default {
  generarUsuarioBase,
  generarPasswordTemporal,
  validarUsuario,
  validarEmail,
  validarPassword,
  generarCredencialesCliente
}
