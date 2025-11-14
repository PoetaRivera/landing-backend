/**
 * Controlador de Autenticación de Clientes
 * Maneja login, verificación de tokens, perfil y cambio de contraseña
 */

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { buscarClientePorEmail, buscarClientePorUsuario, getFirestore } from '../config/firebase.js'
import admin from 'firebase-admin'
import { validarPassword } from '../utils/clienteUtils.js'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d' // 7 días para clientes

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido en las variables de entorno')
}

/**
 * Login de cliente
 * POST /api/clientes/login
 *
 * Body:
 * {
 *   "identifier": "maria.garcia" o "maria@ejemplo.com",
 *   "password": "Ab3k9Qz2"
 * }
 */
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body

    // Validar campos requeridos
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos faltantes',
        mensaje: 'Debes proporcionar usuario/email y contraseña.'
      })
    }

    console.log(`🔑 Intento de login de cliente: ${identifier}`)

    // Buscar cliente por email o usuario
    let cliente = null
    const identifierLower = identifier.toLowerCase().trim()

    // Detectar si es email o usuario
    if (identifierLower.includes('@')) {
      // Es un email
      cliente = await buscarClientePorEmail(identifierLower)
    } else {
      // Es un usuario
      cliente = await buscarClientePorUsuario(identifierLower)
    }

    // Verificar que el cliente existe
    if (!cliente) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
        mensaje: 'Usuario/email o contraseña incorrectos.'
      })
    }

    // Verificar que el cliente esté activo
    if (cliente.estado !== 'activo') {
      return res.status(403).json({
        success: false,
        error: 'Cuenta inactiva',
        mensaje: 'Tu cuenta está suspendida o cancelada. Contacta a soporte.'
      })
    }

    // Verificar la contraseña
    const passwordMatch = await bcrypt.compare(password, cliente.passwordHash)

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
        mensaje: 'Usuario/email o contraseña incorrectos.'
      })
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        clienteId: cliente.id,
        email: cliente.email,
        usuario: cliente.usuario,
        nombreCompleto: cliente.nombreCompleto,
        role: 'cliente' // Importante: role = 'cliente'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    // Actualizar fecha de último acceso (en segundo plano)
    const db = getFirestore()
    db.collection('landing-page')
      .doc('data')
      .collection('clientes')
      .doc(cliente.id)
      .update({
        fechaUltimoAcceso: admin.firestore.FieldValue.serverTimestamp()
      })
      .catch(err => console.error('⚠️  Error al actualizar último acceso:', err))

    console.log(`✅ Login exitoso de cliente: ${cliente.usuario} (${cliente.email})`)

    // Configurar cookie HTTP-only
    const cookieOptions = {
      httpOnly: true, // No accesible desde JavaScript
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'strict', // Protección CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días en ms
    }

    // Enviar token en cookie
    res.cookie('clienteToken', token, cookieOptions)

    // Responder con datos del cliente (sin token en body)
    res.status(200).json({
      success: true,
      mensaje: '¡Login exitoso!',
      data: {
        cliente: {
          id: cliente.id,
          nombreCompleto: cliente.nombreCompleto,
          email: cliente.email,
          usuario: cliente.usuario,
          nombreSalon: cliente.nombreSalon,
          estado: cliente.estado,
          planSeleccionado: cliente.planSeleccionado,
          estadoSuscripcion: cliente.estadoSuscripcion
        }
      }
    })
  } catch (error) {
    console.error('❌ Error en login de cliente:', error)
    res.status(500).json({
      success: false,
      error: 'Error en el servidor',
      mensaje: 'Ocurrió un error al procesar tu solicitud de login.'
    })
  }
}

/**
 * Verificar token JWT
 * GET /api/clientes/verify
 *
 * Headers: Authorization: Bearer <token>
 */
export const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token no proporcionado',
        valido: false
      })
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Token inválido o expirado',
          valido: false
        })
      }

      if (decoded.role !== 'cliente') {
        return res.status(403).json({
          success: false,
          error: 'Token no es de cliente',
          valido: false
        })
      }

      res.status(200).json({
        success: true,
        valido: true,
        data: {
          clienteId: decoded.clienteId,
          email: decoded.email,
          usuario: decoded.usuario,
          nombreCompleto: decoded.nombreCompleto
        }
      })
    })
  } catch (error) {
    console.error('❌ Error en verifyToken:', error)
    res.status(500).json({
      success: false,
      error: 'Error en el servidor',
      valido: false
    })
  }
}

/**
 * Obtener perfil del cliente autenticado
 * GET /api/clientes/me
 *
 * Headers: Authorization: Bearer <token>
 * Requiere: authenticateCliente middleware
 */
export const getProfile = async (req, res) => {
  try {
    // req.cliente ya viene del middleware authenticateCliente
    const clienteId = req.cliente.clienteId

    // Obtener datos completos del cliente desde Firestore
    const db = getFirestore()
    const clienteDoc = await db
      .collection('landing-page')
      .doc('data')
      .collection('clientes')
      .doc(clienteId)
      .get()

    if (!clienteDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado',
        mensaje: 'No se encontró tu perfil en la base de datos.'
      })
    }

    const clienteData = clienteDoc.data()

    // Preparar datos de respuesta (sin passwordHash)
    const perfil = {
      id: clienteDoc.id,
      nombreCompleto: clienteData.nombreCompleto,
      email: clienteData.email,
      usuario: clienteData.usuario,
      telefono: clienteData.telefono,
      nombreSalon: clienteData.nombreSalon,
      salonId: clienteData.salonId,
      solicitudId: clienteData.solicitudId,
      estado: clienteData.estado,
      emailVerificado: clienteData.emailVerificado,
      planSeleccionado: clienteData.planSeleccionado,
      suscripcionId: clienteData.suscripcionId,
      estadoSuscripcion: clienteData.estadoSuscripcion,
      fechaCreacion: clienteData.fechaCreacion,
      fechaUltimoAcceso: clienteData.fechaUltimoAcceso
    }

    console.log(`📋 Perfil obtenido: ${clienteData.usuario}`)

    res.status(200).json({
      success: true,
      data: perfil
    })
  } catch (error) {
    console.error('❌ Error al obtener perfil:', error)
    res.status(500).json({
      success: false,
      error: 'Error en el servidor',
      mensaje: 'Ocurrió un error al obtener tu perfil.'
    })
  }
}

/**
 * Cambiar contraseña del cliente
 * POST /api/clientes/change-password
 *
 * Body:
 * {
 *   "passwordActual": "Ab3k9Qz2",
 *   "passwordNueva": "MiNuevaPassword123"
 * }
 *
 * Headers: Authorization: Bearer <token>
 * Requiere: authenticateCliente middleware
 */
export const changePassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body
    const clienteId = req.cliente.clienteId

    // Validar campos requeridos
    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos faltantes',
        mensaje: 'Debes proporcionar la contraseña actual y la nueva contraseña.'
      })
    }

    // Validar que la nueva contraseña cumpla los requisitos
    const validacion = validarPassword(passwordNueva)
    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña nueva inválida',
        mensaje: validacion.errores[0] || 'La contraseña no cumple los requisitos mínimos.',
        errores: validacion.errores
      })
    }

    // Obtener cliente desde Firestore
    const db = getFirestore()
    const clienteDoc = await db
      .collection('landing-page')
      .doc('data')
      .collection('clientes')
      .doc(clienteId)
      .get()

    if (!clienteDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado',
        mensaje: 'No se encontró tu cuenta.'
      })
    }

    const clienteData = clienteDoc.data()

    // Verificar que la contraseña actual sea correcta
    const passwordMatch = await bcrypt.compare(passwordActual, clienteData.passwordHash)

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Contraseña actual incorrecta',
        mensaje: 'La contraseña actual que ingresaste es incorrecta.'
      })
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await bcrypt.compare(passwordNueva, clienteData.passwordHash)
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña igual',
        mensaje: 'La nueva contraseña debe ser diferente a la actual.'
      })
    }

    // Hashear la nueva contraseña
    const passwordHash = await bcrypt.hash(passwordNueva, 10)

    // Actualizar contraseña en Firestore
    await db
      .collection('landing-page')
      .doc('data')
      .collection('clientes')
      .doc(clienteId)
      .update({
        passwordHash: passwordHash,
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      })

    console.log(`🔐 Contraseña cambiada exitosamente: ${clienteData.usuario}`)

    res.status(200).json({
      success: true,
      mensaje: '¡Contraseña cambiada exitosamente!'
    })
  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error)
    res.status(500).json({
      success: false,
      error: 'Error en el servidor',
      mensaje: 'Ocurrió un error al cambiar tu contraseña.'
    })
  }
}

/**
 * Solicitar recuperación de contraseña
 * POST /api/clientes/forgot-password
 *
 * Body:
 * {
 *   "email": "maria@ejemplo.com"
 * }
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    // Validar que el email esté presente
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email requerido',
        mensaje: 'Debes proporcionar tu email.'
      })
    }

    console.log(`🔑 Solicitud de recuperación de contraseña para: ${email}`)

    // Importar funciones necesarias
    const { buscarClientePorEmail, guardarTokenReset } = await import('../config/firebase.js')
    const { enviarEmailRecuperacionPassword } = await import('../config/email.js')
    const { generarTokenReset } = await import('../utils/clienteUtils.js')

    // Buscar cliente por email
    const cliente = await buscarClientePorEmail(email)

    // Por seguridad, siempre responder con éxito aunque el email no exista
    // Esto previene que atacantes descubran emails válidos
    if (!cliente) {
      console.log(`⚠️  Email no encontrado: ${email} (respondiendo con éxito por seguridad)`)
      return res.status(200).json({
        success: true,
        mensaje: 'Si el email existe en nuestro sistema, recibirás un link de recuperación.'
      })
    }

    // Verificar que el cliente esté activo
    if (cliente.estado !== 'activo') {
      return res.status(403).json({
        success: false,
        error: 'Cuenta inactiva',
        mensaje: 'Tu cuenta está suspendida o cancelada. Contacta a soporte.'
      })
    }

    // Generar token de reset
    const resetToken = generarTokenReset()

    // Guardar token en Firestore
    await guardarTokenReset(cliente.id, resetToken)

    // Enviar email con link de recuperación
    await enviarEmailRecuperacionPassword(cliente.email, cliente.nombreCompleto, resetToken)

    console.log(`✅ Email de recuperación enviado a: ${email}`)

    res.status(200).json({
      success: true,
      mensaje: 'Si el email existe en nuestro sistema, recibirás un link de recuperación.'
    })
  } catch (error) {
    console.error('❌ Error en forgot-password:', error)
    res.status(500).json({
      success: false,
      error: 'Error en el servidor',
      mensaje: 'Ocurrió un error al procesar tu solicitud.'
    })
  }
}

/**
 * Resetear contraseña con token
 * POST /api/clientes/reset-password
 *
 * Body:
 * {
 *   "token": "abc123...",
 *   "passwordNueva": "MiNuevaPassword123"
 * }
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, passwordNueva } = req.body

    // Validar campos requeridos
    if (!token || !passwordNueva) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos faltantes',
        mensaje: 'Debes proporcionar el token y la nueva contraseña.'
      })
    }

    console.log(`🔐 Intento de reset de contraseña con token`)

    // Importar funciones necesarias
    const { buscarClientePorTokenReset, resetearPassword } = await import('../config/firebase.js')
    const { validarPassword } = await import('../utils/clienteUtils.js')

    // Buscar cliente por token
    const cliente = await buscarClientePorTokenReset(token)

    if (!cliente) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido o expirado',
        mensaje: 'El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.'
      })
    }

    // Validar que la nueva contraseña cumpla los requisitos
    const validacion = validarPassword(passwordNueva)
    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña inválida',
        mensaje: validacion.errores[0] || 'La contraseña no cumple los requisitos mínimos.',
        errores: validacion.errores
      })
    }

    // Hashear la nueva contraseña
    const passwordHash = await bcrypt.hash(passwordNueva, 10)

    // Actualizar contraseña y limpiar token
    await resetearPassword(cliente.id, passwordHash)

    console.log(`✅ Contraseña reseteada exitosamente para: ${cliente.usuario}`)

    res.status(200).json({
      success: true,
      mensaje: '¡Contraseña restablecida exitosamente! Ya puedes iniciar sesión con tu nueva contraseña.'
    })
  } catch (error) {
    console.error('❌ Error en reset-password:', error)
    res.status(500).json({
      success: false,
      error: 'Error en el servidor',
      mensaje: 'Ocurrió un error al restablecer tu contraseña.'
    })
  }
}

export default {
  login,
  verifyToken,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword
}
