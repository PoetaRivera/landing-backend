import {
  guardarSolicitudSuscripcion,
  obtenerSolicitudes,
  actualizarEstadoSolicitud
} from '../config/firebase.js'

import {
  enviarEmailNuevaSolicitud,
  enviarEmailConfirmacionCliente
} from '../config/email.js'

import dotenv from 'dotenv'

dotenv.config()

/**
 * Crear una nueva solicitud de suscripción (SIN Stripe)
 * POST /api/suscripciones
 *
 * Flujo sin procesador de pagos:
 * 1. Guardar solicitud en Firestore
 * 2. Enviar email de notificación al admin
 * 3. Enviar email de confirmación al cliente
 * 4. El admin procesará manualmente el pago y activará la cuenta
 */
export const crearSolicitud = async (req, res) => {
  try {
    const datosSolicitud = req.body



    // PASO 1: Guardar solicitud en Firestore
    const resultadoSolicitud = await guardarSolicitudSuscripcion(datosSolicitud)
    const solicitudId = resultadoSolicitud.id



    // PASO 2: Enviar email de notificación al admin (no esperar)
    enviarEmailNuevaSolicitud(datosSolicitud)

      .catch(error => console.error('⚠️  Error al enviar email admin:', error.message))

    // PASO 3: Enviar email de confirmación al cliente (no esperar)
    enviarEmailConfirmacionCliente(datosSolicitud)

      .catch(error => console.error('⚠️  Error al enviar email cliente:', error.message))

    // PASO 4: Responder con éxito (sin redirección a Stripe)
    res.status(201).json({
      success: true,
      mensaje: '¡Solicitud enviada exitosamente! Te contactaremos pronto para coordinar el pago y activación.',
      data: {
        solicitudId: solicitudId
      }
    })

  } catch (error) {
    console.error('❌ Error al crear solicitud:', error)

    res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar la solicitud',
      mensaje: 'Hubo un problema al procesar tu solicitud. Por favor, intenta nuevamente.'
    })
  }
}

/**
 * Obtener todas las solicitudes (con filtros opcionales)
 * GET /api/suscripciones
 */
export const getSolicitudes = async (req, res) => {
  try {
    const { estado, plan, limite, lastDocId } = req.query

    const filtros = {}
    if (estado) filtros.estado = estado
    if (plan) filtros.plan = plan
    if (limite) filtros.limite = parseInt(limite)
    if (lastDocId) filtros.lastDocId = lastDocId

    // 📄 Obtener solicitudes con paginación
    const resultado = await obtenerSolicitudes(filtros)

    res.status(200).json({
      success: true,
      data: {
        solicitudes: resultado.solicitudes,
        pagination: {
          total: resultado.total,
          hasMore: resultado.hasMore,
          lastDoc: resultado.lastDoc
        }
      }
    })

  } catch (error) {
    console.error('❌ Error al obtener solicitudes:', error)

    res.status(500).json({
      success: false,
      error: 'Error al obtener las solicitudes'
    })
  }
}

/**
 * Actualizar el estado de una solicitud
 * PATCH /api/suscripciones/:id
 */
export const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params
    const { estado, notas } = req.body

    await actualizarEstadoSolicitud(id, estado, notas)

    res.status(200).json({
      success: true,
      mensaje: 'Estado actualizado correctamente'
    })

  } catch (error) {
    console.error('❌ Error al actualizar estado:', error)

    res.status(500).json({
      success: false,
      error: 'Error al actualizar el estado'
    })
  }
}

/**
 * Estadísticas de solicitudes
 * GET /api/suscripciones/stats
 */
export const getEstadisticas = async (req, res) => {
  try {
    const todasSolicitudes = await obtenerSolicitudes({})

    const stats = {
      total: todasSolicitudes.length,
      porEstado: {
        pendiente: todasSolicitudes.filter(s => s.estado === 'pendiente').length,
        contactado: todasSolicitudes.filter(s => s.estado === 'contactado').length,
        procesado: todasSolicitudes.filter(s => s.estado === 'procesado').length,
        rechazado: todasSolicitudes.filter(s => s.estado === 'rechazado').length
      },
      porPlan: {}
    }

    // Contar por plan
    todasSolicitudes.forEach(solicitud => {
      const plan = solicitud.plan || 'Sin especificar'
      stats.porPlan[plan] = (stats.porPlan[plan] || 0) + 1
    })

    res.status(200).json({
      success: true,
      estadisticas: stats
    })

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error)

    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    })
  }
}

export default {
  crearSolicitud,
  getSolicitudes,
  actualizarEstado,
  getEstadisticas
}
