import {
  guardarSolicitudSuscripcion,
  obtenerSolicitudes,
  actualizarEstadoSolicitud,
  vincularClienteSolicitud,
  generarUsuarioUnico,
  crearCliente
} from '../config/firebase.js'

import {
  enviarEmailNuevaSolicitud,
  enviarEmailConfirmacionCliente,
  enviarEmailCredencialesCliente
} from '../config/email.js'

import { generarCredencialesCliente } from '../utils/clienteUtils.js'
import { createCheckoutSession, getPriceIdForPlan } from '../config/stripe.js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Crear una nueva solicitud de suscripción + Redirigir a Stripe Checkout
 * POST /api/suscripciones
 *
 * Nuevo Flujo con Stripe:
 * 1. Guardar solicitud en Firestore
 * 2. Enviar email de notificación al admin
 * 3. Crear sesión de Checkout de Stripe
 * 4. Devolver URL de checkout para que el frontend redirija
 *
 * Después del pago exitoso (via webhook):
 * - Generar credenciales
 * - Crear cliente en Firestore
 * - Enviar emails de confirmación y credenciales
 */
export const crearSolicitud = async (req, res) => {
  try {
    const datosSolicitud = req.body

    console.log('📝 Nueva solicitud de suscripción:', {
      salon: datosSolicitud.nombreSalon,
      email: datosSolicitud.email,
      plan: datosSolicitud.plan
    })

    // PASO 1: Guardar solicitud en Firestore
    const resultadoSolicitud = await guardarSolicitudSuscripcion(datosSolicitud)
    const solicitudId = resultadoSolicitud.id

    console.log(`✅ Solicitud guardada con ID: ${solicitudId}`)

    // PASO 2: Enviar email de notificación al admin (no esperar)
    enviarEmailNuevaSolicitud(datosSolicitud)
      .then(() => console.log('✅ Email admin enviado'))
      .catch(error => console.error('⚠️  Error al enviar email admin:', error.message))

    // PASO 3: Obtener Price ID de Stripe para el plan
    const priceId = getPriceIdForPlan(datosSolicitud.plan)

    // PASO 4: URLs de success y cancel
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174'
    const successUrl = `${frontendUrl}/suscripcion/success?session_id={CHECKOUT_SESSION_ID}&solicitud_id=${solicitudId}`
    const cancelUrl = `${frontendUrl}/suscripcion/cancel?solicitud_id=${solicitudId}`

    // PASO 5: Crear sesión de Checkout de Stripe
    const session = await createCheckoutSession({
      priceId,
      clienteEmail: datosSolicitud.email,
      solicitudId,
      successUrl,
      cancelUrl
    })

    console.log(`💳 Checkout session creada: ${session.id}`)

    // PASO 6: Responder con URL de checkout
    res.status(201).json({
      success: true,
      mensaje: '¡Solicitud recibida! Serás redirigido al checkout para completar el pago.',
      data: {
        solicitudId: solicitudId,
        checkoutUrl: session.url,
        sessionId: session.id
      }
    })

  } catch (error) {
    console.error('❌ Error al crear solicitud:', error)

    // Manejo de errores específicos
    let mensajeError = 'Hubo un problema al procesar tu solicitud. Por favor, intenta nuevamente.'

    if (error.message.includes('Price ID')) {
      mensajeError = 'Plan de suscripción no válido. Por favor, selecciona un plan válido.'
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar la solicitud',
      mensaje: mensajeError
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
