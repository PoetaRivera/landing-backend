import admin from 'firebase-admin'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let db = null

/**
 * Inicializa Firebase Admin SDK
 * Usa el mismo proyecto Firebase que el sistema principal
 */
export const initializeFirebase = () => {
  try {
    // Si ya está inicializado, retornar
    if (admin.apps.length > 0) {
      console.log('✅ Firebase ya está inicializado')
      db = admin.firestore()
      return db
    }

    // Leer credenciales desde el archivo JSON
    // Si la ruta es absoluta (comienza con C:\ o /), usarla directamente
    // Si es relativa, resolverla desde el directorio de trabajo (donde se ejecuta npm run dev)
    const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    const isAbsolutePath = envPath.match(/^[a-zA-Z]:/) || envPath.startsWith('/')

    // Resolver desde process.cwd() que es donde se ejecuta el comando
    const credentialsPath = isAbsolutePath
      ? envPath
      : resolve(process.cwd(), envPath)

    const serviceAccount = JSON.parse(readFileSync(credentialsPath, 'utf8'))

    // Inicializar Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })

    db = admin.firestore()

    console.log('✅ Firebase Admin SDK inicializado correctamente')
    console.log(`📁 Proyecto: ${serviceAccount.project_id}`)

    return db
  } catch (error) {
    console.error('❌ Error al inicializar Firebase:', error.message)
    throw new Error('No se pudo inicializar Firebase Admin SDK')
  }
}

/**
 * Obtiene la instancia de Firestore
 */
export const getFirestore = () => {
  if (!db) {
    db = initializeFirebase()
  }
  return db
}

/**
 * Guarda una solicitud de suscripción en Firestore
 * Nueva estructura: landing-page/data/solicitudes/{id}
 */
export const guardarSolicitudSuscripcion = async (datos) => {
  try {
    const db = getFirestore()

    const solicitud = {
      ...datos,
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente', // pendiente, contactado, procesado, rechazado
      origen: 'landing_page',
      clienteId: null // Se actualizará después de crear el cliente
    }

    const docRef = await db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes')
      .add(solicitud)

    console.log(`✅ Solicitud guardada con ID: ${docRef.id}`)

    return {
      success: true,
      id: docRef.id,
      mensaje: 'Solicitud guardada correctamente'
    }
  } catch (error) {
    console.error('❌ Error al guardar solicitud:', error)
    throw error
  }
}

/**
 * Obtiene todas las solicitudes de suscripción con paginación
 * Nueva estructura: landing-page/data/solicitudes
 *
 * @param {Object} filtros - Filtros de consulta
 * @param {string} [filtros.estado] - Filtrar por estado
 * @param {string} [filtros.plan] - Filtrar por plan
 * @param {number} [filtros.limite=50] - Número de resultados por página
 * @param {string} [filtros.lastDocId] - ID del último documento (para paginación)
 * @returns {Promise<{solicitudes: Array, hasMore: boolean, lastDoc: string|null}>}
 */
export const obtenerSolicitudes = async (filtros = {}) => {
  try {
    const db = getFirestore()
    let query = db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes')

    // Aplicar filtros
    if (filtros.estado) {
      query = query.where('estado', '==', filtros.estado)
    }

    if (filtros.plan) {
      query = query.where('plan', '==', filtros.plan)
    }

    // Ordenar por fecha descendente
    query = query.orderBy('fechaCreacion', 'desc')

    // 🔒 PAGINACIÓN: Cursor-based pagination
    if (filtros.lastDocId) {
      // Obtener el documento de referencia
      const lastDocRef = await db
        .collection('landing-page')
        .doc('data')
        .collection('solicitudes')
        .doc(filtros.lastDocId)
        .get()

      if (lastDocRef.exists) {
        query = query.startAfter(lastDocRef)
      }
    }

    // Límite por defecto: 50 resultados
    const limite = filtros.limite || 50
    // Pedir 1 extra para saber si hay más resultados
    query = query.limit(limite + 1)

    const snapshot = await query.get()

    const solicitudes = []
    snapshot.forEach(doc => {
      solicitudes.push({
        id: doc.id,
        ...doc.data()
      })
    })

    // Determinar si hay más resultados
    const hasMore = solicitudes.length > limite
    if (hasMore) {
      solicitudes.pop() // Remover el documento extra
    }

    // ID del último documento para la siguiente página
    const lastDoc = solicitudes.length > 0 ? solicitudes[solicitudes.length - 1].id : null

    return {
      solicitudes,
      hasMore,
      lastDoc,
      total: solicitudes.length
    }
  } catch (error) {
    console.error('❌ Error al obtener solicitudes:', error)
    throw error
  }
}

/**
 * Actualiza el estado de una solicitud
 * Nueva estructura: landing-page/data/solicitudes
 */
export const actualizarEstadoSolicitud = async (id, nuevoEstado, notas = '') => {
  try {
    const db = getFirestore()

    await db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes')
      .doc(id)
      .update({
        estado: nuevoEstado,
        notas: notas,
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      })

    console.log(`✅ Solicitud ${id} actualizada a estado: ${nuevoEstado}`)

    return {
      success: true,
      mensaje: 'Estado actualizado correctamente'
    }
  } catch (error) {
    console.error('❌ Error al actualizar solicitud:', error)
    throw error
  }
}

/**
 * Actualiza el clienteId de una solicitud
 * Se usa después de crear el cliente para vincular ambos registros
 */
export const vincularClienteSolicitud = async (solicitudId, clienteId) => {
  try {
    const db = getFirestore()

    await db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes')
      .doc(solicitudId)
      .update({
        clienteId: clienteId,
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      })

    console.log(`✅ Solicitud ${solicitudId} vinculada con cliente ${clienteId}`)

    return {
      success: true,
      mensaje: 'Solicitud vinculada con cliente correctamente'
    }
  } catch (error) {
    console.error('❌ Error al vincular solicitud con cliente:', error)
    throw error
  }
}

/**
 * ========================================
 * FUNCIONES DE CLIENTES
 * ========================================
 */

/**
 * Busca un cliente por email
 * @param {string} email - Email del cliente
 * @returns {object|null} - Cliente encontrado o null
 */
export const buscarClientePorEmail = async (email) => {
  try {
    const db = getFirestore()

    const snapshot = await db
      .collection('landing-page')
      .doc('data')
      .collection('clientes')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get()

    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data()
    }
  } catch (error) {
    console.error('❌ Error al buscar cliente por email:', error)
    throw error
  }
}

/**
 * Busca un cliente por usuario
 * @param {string} usuario - Usuario del cliente
 * @returns {object|null} - Cliente encontrado o null
 */
export const buscarClientePorUsuario = async (usuario) => {
  try {
    const db = getFirestore()

    const snapshot = await db
      .collection('landing-page')
      .doc('data')
      .collection('clientes')
      .where('usuario', '==', usuario.toLowerCase().trim())
      .limit(1)
      .get()

    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data()
    }
  } catch (error) {
    console.error('❌ Error al buscar cliente por usuario:', error)
    throw error
  }
}

/**
 * Genera un usuario único verificando que no exista en la base de datos
 * Si el usuario base existe, agrega un número incremental
 *
 * @param {string} usuarioBase - Usuario base generado
 * @returns {string} - Usuario único
 */
export const generarUsuarioUnico = async (usuarioBase) => {
  try {
    let usuarioFinal = usuarioBase
    let contador = 2

    // Verificar si el usuario existe
    let existe = await buscarClientePorUsuario(usuarioFinal)

    // Si existe, agregar número hasta encontrar uno disponible
    while (existe) {
      usuarioFinal = `${usuarioBase}${contador}`
      existe = await buscarClientePorUsuario(usuarioFinal)
      contador++

      // Prevenir loop infinito
      if (contador > 100) {
        throw new Error('No se pudo generar un usuario único')
      }
    }

    return usuarioFinal
  } catch (error) {
    console.error('❌ Error al generar usuario único:', error)
    throw error
  }
}

/**
 * Crea un nuevo cliente en Firestore
 *
 * @param {object} datosCliente - Datos del cliente
 * @returns {object} - { id, usuario, passwordTemporal }
 */
export const crearCliente = async (datosCliente) => {
  try {
    const db = getFirestore()

    // Verificar que el email no exista
    const clienteExistente = await buscarClientePorEmail(datosCliente.email)
    if (clienteExistente) {
      throw new Error('Ya existe un cliente con ese email')
    }

    // Preparar datos del cliente
    const cliente = {
      // Información básica
      nombreCompleto: datosCliente.nombreCompleto,
      email: datosCliente.email.toLowerCase().trim(),
      telefono: datosCliente.telefono,

      // Credenciales (passwordHash ya debe venir hasheado)
      usuario: datosCliente.usuario,
      passwordHash: datosCliente.passwordHash,

      // Información del salón
      nombreSalon: datosCliente.nombreSalon,
      salonId: null, // Se asignará cuando se cree el salón

      // Referencias
      solicitudId: datosCliente.solicitudId,

      // Estado
      estado: 'activo',
      emailVerificado: false,

      // Plan y suscripción
      planSeleccionado: datosCliente.planSeleccionado,
      suscripcionId: null, // Se asignará cuando se procese el pago
      estadoSuscripcion: 'pendiente', // pendiente, activa, cancelada, vencida

      // Timestamps
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      fechaUltimoAcceso: null,
      fechaActualizacion: admin.firestore.FieldValue.serverTimestamp(),

      // Metadata
      creadoPor: 'auto_registro',
      origen: 'landing_page'
    }

    // Guardar en Firestore
    const docRef = await db
      .collection('landing-page')
      .doc('data')
      .collection('clientes')
      .add(cliente)

    console.log(`✅ Cliente creado con ID: ${docRef.id}`)

    return {
      id: docRef.id,
      usuario: cliente.usuario
    }
  } catch (error) {
    console.error('❌ Error al crear cliente:', error)
    throw error
  }
}

/**
 * ========================================
 * FUNCIONES DE PASSWORD RESET
 * ========================================
 */

/**
 * Guardar token de reset de contraseña para un cliente
 * @param {string} clienteId - ID del cliente
 * @param {string} token - Token de reset
 * @returns {Promise<Object>} - Resultado
 */
export const guardarTokenReset = async (clienteId, token) => {
  try {
    const db = getFirestore()

    // El token expira en 1 hora
    const fechaExpiracion = new Date()
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 1)

    await db
      .collection('landing-page')
      .doc('data')
      .collection('clientes')
      .doc(clienteId)
      .update({
        tokenResetPassword: token,
        fechaTokenResetPassword: admin.firestore.Timestamp.fromDate(fechaExpiracion),
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      })

    console.log(`✅ Token de reset guardado para cliente: ${clienteId}`)

    return {
      success: true,
      mensaje: 'Token de reset guardado correctamente'
    }
  } catch (error) {
    console.error('❌ Error al guardar token de reset:', error)
    throw error
  }
}

/**
 * Buscar cliente por token de reset
 * @param {string} token - Token de reset
 * @returns {Promise<Object|null>} - Cliente encontrado o null
 */
export const buscarClientePorTokenReset = async (token) => {
  try {
    const db = getFirestore()

    const snapshot = await db
      .collection('landing-page')
      .doc('data')
      .collection('clientes')
      .where('tokenResetPassword', '==', token)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]
    const cliente = {
      id: doc.id,
      ...doc.data()
    }

    // Verificar que el token no haya expirado
    const ahora = new Date()
    const fechaExpiracion = cliente.fechaTokenResetPassword?.toDate()

    if (!fechaExpiracion || ahora > fechaExpiracion) {
      console.log('⚠️  Token de reset expirado')
      return null
    }

    return cliente
  } catch (error) {
    console.error('❌ Error al buscar cliente por token:', error)
    throw error
  }
}

/**
 * Actualizar contraseña y limpiar token de reset
 * @param {string} clienteId - ID del cliente
 * @param {string} passwordHash - Nueva contraseña hasheada
 * @returns {Promise<Object>} - Resultado
 */
export const resetearPassword = async (clienteId, passwordHash) => {
  try {
    const db = getFirestore()

    await db
      .collection('landing-page')
      .doc('data')
      .collection('clientes')
      .doc(clienteId)
      .update({
        passwordHash: passwordHash,
        tokenResetPassword: null,
        fechaTokenResetPassword: null,
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      })

    console.log(`✅ Contraseña reseteada para cliente: ${clienteId}`)

    return {
      success: true,
      mensaje: 'Contraseña reseteada correctamente'
    }
  } catch (error) {
    console.error('❌ Error al resetear contraseña:', error)
    throw error
  }
}

export default {
  initializeFirebase,
  getFirestore,
  guardarSolicitudSuscripcion,
  obtenerSolicitudes,
  actualizarEstadoSolicitud,
  vincularClienteSolicitud,
  buscarClientePorEmail,
  buscarClientePorUsuario,
  generarUsuarioUnico,
  crearCliente,
  guardarTokenReset,
  buscarClientePorTokenReset,
  resetearPassword
}
