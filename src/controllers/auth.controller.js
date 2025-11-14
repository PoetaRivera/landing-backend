import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getFirestore } from '../config/firebase.js'

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

    console.log('🔐 Intento de login:', email)

    // Buscar usuario en Firestore
    const db = getFirestore()
    const usersSnapshot = await db
      .collection('usuarios_admin')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get()

    if (usersSnapshot.empty) {
      console.log('⚠️  Usuario no encontrado:', email)
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
      console.log('⚠️  Usuario inactivo:', email)
      return res.status(403).json({
        success: false,
        error: 'Usuario inactivo',
        mensaje: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
      })
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, userData.passwordHash)

    if (!passwordMatch) {
      console.log('⚠️  Contraseña incorrecta para:', email)
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
    await db.collection('usuarios_admin').doc(userDoc.id).update({
      ultimoLogin: new Date().toISOString(),
      ultimaIP: req.ip || req.connection.remoteAddress
    })

    console.log('✅ Login exitoso:', email)

    // Configurar cookie HTTP-only
    const cookieOptions = {
      httpOnly: true, // No accesible desde JavaScript
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'strict', // Protección CSRF
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
    const userDoc = await db.collection('usuarios_admin').doc(req.user.userId).get()

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
    const userDoc = await db.collection('usuarios_admin').doc(req.user.userId).get()

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
    await db.collection('usuarios_admin').doc(req.user.userId).update({
      passwordHash: newPasswordHash,
      passwordCambiado: new Date().toISOString()
    })

    console.log('✅ Contraseña cambiada para:', userData.email)

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

export default {
  login,
  verifyToken,
  getProfile,
  changePassword
}
