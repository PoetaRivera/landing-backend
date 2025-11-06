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
    // Si es relativa, resolverla desde la raíz del proyecto
    const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    const isAbsolutePath = envPath.match(/^[a-zA-Z]:/) || envPath.startsWith('/')
    const credentialsPath = isAbsolutePath
      ? envPath
      : resolve(__dirname, '../../../', envPath)

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
 * Colección: solicitudes_landing
 */
export const guardarSolicitudSuscripcion = async (datos) => {
  try {
    const db = getFirestore()

    const solicitud = {
      ...datos,
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente', // pendiente, contactado, procesado, rechazado
      origen: 'landing_page'
    }

    const docRef = await db.collection('solicitudes_landing').add(solicitud)

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
 * Obtiene todas las solicitudes de suscripción
 */
export const obtenerSolicitudes = async (filtros = {}) => {
  try {
    const db = getFirestore()
    let query = db.collection('solicitudes_landing')

    // Aplicar filtros
    if (filtros.estado) {
      query = query.where('estado', '==', filtros.estado)
    }

    if (filtros.plan) {
      query = query.where('plan', '==', filtros.plan)
    }

    // Ordenar por fecha descendente
    query = query.orderBy('fechaCreacion', 'desc')

    // Limitar resultados si se especifica
    if (filtros.limite) {
      query = query.limit(filtros.limite)
    }

    const snapshot = await query.get()

    const solicitudes = []
    snapshot.forEach(doc => {
      solicitudes.push({
        id: doc.id,
        ...doc.data()
      })
    })

    return solicitudes
  } catch (error) {
    console.error('❌ Error al obtener solicitudes:', error)
    throw error
  }
}

/**
 * Actualiza el estado de una solicitud
 */
export const actualizarEstadoSolicitud = async (id, nuevoEstado, notas = '') => {
  try {
    const db = getFirestore()

    await db.collection('solicitudes_landing').doc(id).update({
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

export default {
  initializeFirebase,
  getFirestore,
  guardarSolicitudSuscripcion,
  obtenerSolicitudes,
  actualizarEstadoSolicitud
}
