import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { getFirestore } from '../config/firebase.js'
import { enviarEmailRecuperacionPassword } from '../config/email.js'

/**
 * Controlador de autenticación
 * Maneja login, logout y verificación de tokens
 */

/**
 * Login de administrador
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validar que vengan los campos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Credenciales incompletas',
        mensaje: 'Email y contraseña son requeridos'
      })
    }



    // Buscar usuario en Firestore
    const db = getFirestore()
    const usersSnapshot = await db
      .collection('landing-page')
      .doc('data')
      .collection('usuarios_admin')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get()

    if (usersSnapshot.empty) {

      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
        mensaje: 'Email o contraseña incorrectos'
      })
    }

    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()

    // Verificar que el usuario esté activo
    if (!userData.activo) {

      return res.status(403).json({
        success: false,
        error: 'Usuario inactivo',
        mensaje: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
      })
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, userData.passwordHash)

    if (!passwordMatch) {

      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
        mensaje: 'Email o contraseña incorrectos'
      })
    }

    // Generar JWT
    const JWT_SECRET = process.env.JWT_SECRET
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET no configurado')
      return res.status(500).json({
        success: false,
        error: 'Error de configuración del servidor'
      })
    }

    const token = jwt.sign(
      {
        userId: userDoc.id,
        email: userData.email,
        nombre: userData.nombre,
        role: userData.role || 'admin'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    // Actualizar último login
    await db
      .collection('landing-page')
      .doc('data')
      .collection('usuarios_admin')
      .doc(userDoc.id)
      .update({
        ultimoLogin: new Date().toISOString(),
        ultimaIP: req.ip || req.connection.remoteAddress
      })



    // Configurar cookie HTTP-only
    const cookieOptions = {
      httpOnly: true, // No accesible desde JavaScript
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // none en producción para cross-domain
      maxAge: 24 * 60 * 60 * 1000 // 24 horas en ms
    }

    // Enviar token en cookie
    res.cookie('adminToken', token, cookieOptions)

    // Responder con datos del usuario (sin token en body)
    res.status(200).json({
      success: true,
      mensaje: 'Login exitoso',
      user: {
        id: userDoc.id,
        email: userData.email,
        nombre: userData.nombre,
        role: userData.role || 'admin'
      }
    })
  } catch (error) {
    console.error('❌ Error en login:', error)
    res.status(500).json({
      success: false,
      error: 'Error al iniciar sesión',
      mensaje: 'Ocurrió un error inesperado. Intenta nuevamente.'
    })
  }
}

/**
 * Logout de administrador
 * POST /api/auth/logout
 *
 * Limpia la cookie del token JWT
 */
export const logout = async (req, res) => {
  try {
    // Limpiar cookie
    res.clearCookie('adminToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
    })



    res.status(200).json({
      success: true,
      mensaje: 'Sesión cerrada exitosamente'
    })
  } catch (error) {
    console.error('❌ Error en logout de admin:', error)
    res.status(500).json({
      success: false,
      error: 'Error en el servidor',
      mensaje: 'Ocurrió un error al cerrar sesión.'
    })
  }
}

/**
 * Verificar token actual
 * GET /api/auth/verify
 */
export const verifyToken = async (req, res) => {
  try {
    // El middleware authenticateToken ya validó el token
    // req.user contiene la información del usuario
    res.status(200).json({
      success: true,
      mensaje: 'Token válido',
      user: req.user
    })
  } catch (error) {
    console.error('❌ Error al verificar token:', error)
    res.status(500).json({
      success: false,
      error: 'Error al verificar token'
    })
  }
}

/**
 * Obtener perfil del usuario actual
 * GET /api/auth/me
 */
export const getProfile = async (req, res) => {
  try {
    const db = getFirestore()
    const userDoc = await db
      .collection('landing-page')
      .doc('data')
      .collection('usuarios_admin')
      .doc(req.user.userId)
      .get()

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      })
    }

    const userData = userDoc.data()

    // No enviar el hash de contraseña
    delete userData.passwordHash

    res.status(200).json({
      success: true,
      user: {
        id: userDoc.id,
        ...userData
      }
    })
  } catch (error) {
    console.error('❌ Error al obtener perfil:', error)
    res.status(500).json({
      success: false,
      error: 'Error al obtener perfil'
    })
  }
}

/**
 * Cambiar contraseña
 * POST /api/auth/change-password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Contraseñas requeridas',
        mensaje: 'Debes proporcionar la contraseña actual y la nueva'
      })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña débil',
        mensaje: 'La nueva contraseña debe tener al menos 8 caracteres'
      })
    }

    const db = getFirestore()
    const userDoc = await db
      .collection('landing-page')
      .doc('data')
      .collection('usuarios_admin')
      .doc(req.user.userId)
      .get()

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      })
    }

    const userData = userDoc.data()

    // Verificar contraseña actual
    const passwordMatch = await bcrypt.compare(currentPassword, userData.passwordHash)

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Contraseña incorrecta',
        mensaje: 'La contraseña actual es incorrecta'
      })
    }

    // Hash nueva contraseña
    const salt = await bcrypt.genSalt(10)
    const newPasswordHash = await bcrypt.hash(newPassword, salt)

    // Actualizar en la base de datos
    await db
      .collection('landing-page')
      .doc('data')
      .collection('usuarios_admin')
      .doc(req.user.userId)
      .update({
        passwordHash: newPasswordHash,
        passwordCambiado: new Date().toISOString()
      })



    res.status(200).json({
      success: true,
      mensaje: 'Contraseña actualizada correctamente'
    })
  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error)
    res.status(500).json({
      success: false,
      error: 'Error al cambiar contraseña'
    })
  }
}

/**
 * Solicitar recuperación de contraseña
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email requerido',
        mensaje: 'Debes proporcionar tu email'
      })
    }



    const db = getFirestore()
    const usersSnapshot = await db
      .collection('landing-page')
      .doc('data')
      .collection('usuarios_admin')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get()

    // Siempre responder con éxito para evitar enumerar usuarios válidos
    if (usersSnapshot.empty) {

      return res.status(200).json({
        success: true,
        mensaje: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
      })
    }

    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()

    // Verificar que el usuario esté activo
    if (!userData.activo) {

      return res.status(200).json({
        success: true,
        mensaje: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
      })
    }

    // Generar token de recuperación (válido por 1 hora)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Guardar token en Firestore
    await db
      .collection('landing-page')
      .doc('data')
      .collection('usuarios_admin')
      .doc(userDoc.id)
      .update({
        resetPasswordToken: resetTokenHash,
        resetPasswordExpiry: resetTokenExpiry.toISOString(),
        resetPasswordSolicitado: new Date().toISOString()
      })

    // Construir URL de recuperación
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174'
    const resetUrl = `${frontendUrl}/admin/reset-password/${resetToken}`

    // Enviar email
    try {
      await enviarEmailRecuperacionPassword({
        email: userData.email,
        nombre: userData.nombre,
        resetUrl,
        expiraEn: '1 hora'
      })


    } catch (emailError) {
      console.error('❌ Error al enviar email:', emailError)
      // Limpiar token si el email falla
      await db
        .collection('landing-page')
        .doc('data')
        .collection('usuarios_admin')
        .doc(userDoc.id)
        .update({
          resetPasswordToken: null,
          resetPasswordExpiry: null
        })

      return res.status(500).json({
        success: false,
        error: 'Error al enviar email',
        mensaje: 'No se pudo enviar el email de recuperación. Intenta nuevamente.'
      })
    }

    res.status(200).json({
      success: true,
      mensaje: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
    })
  } catch (error) {
    console.error('❌ Error en forgot password:', error)
    res.status(500).json({
      success: false,
      error: 'Error al procesar solicitud',
      mensaje: 'Ocurrió un error inesperado. Intenta nuevamente.'
    })
  }
}

/**
 * Resetear contraseña con token
 * POST /api/auth/reset-password/:token
 */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params
    const { newPassword } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token requerido',
        mensaje: 'Token de recuperación no proporcionado'
      })
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña inválida',
        mensaje: 'La nueva contraseña debe tener al menos 8 caracteres'
      })
    }



    // Hash del token recibido para comparar
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const db = getFirestore()
    const usersSnapshot = await db
      .collection('landing-page')
      .doc('data')
      .collection('usuarios_admin')
      .where('resetPasswordToken', '==', resetTokenHash)
      .limit(1)
      .get()

    if (usersSnapshot.empty) {

      return res.status(400).json({
        success: false,
        error: 'Token inválido',
        mensaje: 'El link de recuperación es inválido o ya fue usado'
      })
    }

    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()

    // Verificar expiración del token
    const tokenExpiry = new Date(userData.resetPasswordExpiry)
    if (tokenExpiry < new Date()) {

      return res.status(400).json({
        success: false,
        error: 'Token expirado',
        mensaje: 'El link de recuperación ha expirado. Solicita uno nuevo.'
      })
    }

    // Hash nueva contraseña
    const salt = await bcrypt.genSalt(10)
    const newPasswordHash = await bcrypt.hash(newPassword, salt)

    // Actualizar contraseña y limpiar token
    await db
      .collection('landing-page')
      .doc('data')
      .collection('usuarios_admin')
      .doc(userDoc.id)
      .update({
        passwordHash: newPasswordHash,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
        passwordCambiado: new Date().toISOString(),
        passwordResetCompletado: new Date().toISOString()
      })



    res.status(200).json({
      success: true,
      mensaje: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.'
    })
  } catch (error) {
    console.error('❌ Error en reset password:', error)
    res.status(500).json({
      success: false,
      error: 'Error al resetear contraseña',
      mensaje: 'Ocurrió un error inesperado. Intenta nuevamente.'
    })
  }
}

export default {
  login,
  logout,
  verifyToken,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword
}
