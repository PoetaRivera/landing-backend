import {
  guardarSolicitudSuscripcion,
  obtenerSolicitudes,
  actualizarEstadoSolicitud
} from '../config/firebase.js'

import {
  enviarEmailNuevaSolicitud,
  enviarEmailConfirmacionCliente
} from '../config/email.js'

/**
 * Crear una nueva solicitud de suscripción
 * POST /api/suscripciones
 */
export const crearSolicitud = async (req, res) => {
  try {
    const datosSolicitud = req.body

    console.log('📝 Nueva solicitud de suscripción:', {
      salon: datosSolicitud.nombreSalon,
      email: datosSolicitud.email,
      plan: datosSolicitud.plan
    })

    // 1. Guardar en Firestore
    const resultado = await guardarSolicitudSuscripcion(datosSolicitud)

    // 2. Enviar emails (en paralelo, no bloquean la respuesta)
    Promise.all([
      enviarEmailNuevaSolicitud(datosSolicitud),
      enviarEmailConfirmacionCliente(datosSolicitud)
    ])
      .then(() => {
        console.log('✅ Emails enviados correctamente')
      })
      .catch(error => {
        console.error('⚠️  Error al enviar emails (solicitud guardada exitosamente):', error.message)
      })

    // 3. Responder al cliente inmediatamente
    res.status(201).json({
      success: true,
      mensaje: '¡Solicitud recibida correctamente! Te contactaremos pronto.',
      id: resultado.id
    })

  } catch (error) {
    console.error('❌ Error al crear solicitud:', error)

    res.status(500).json({
      success: false,
      error: 'Error al procesar la solicitud',
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
    const { estado, plan, limite } = req.query

    const filtros = {}
    if (estado) filtros.estado = estado
    if (plan) filtros.plan = plan
    if (limite) filtros.limite = parseInt(limite)

    const solicitudes = await obtenerSolicitudes(filtros)

    res.status(200).json({
      success: true,
      total: solicitudes.length,
      solicitudes
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
