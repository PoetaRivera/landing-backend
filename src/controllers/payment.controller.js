/**
 * Controlador de Pagos con Stripe
 * Maneja sesiones de checkout, webhooks y actualización de suscripciones
 */

import dotenv from 'dotenv'
import {
  createCheckoutSession,
  getCheckoutSession,
  getPriceIdForPlan,
  constructWebhookEvent
} from '../config/stripe.js'
import { getFirestore } from '../config/firebase.js'
import admin from 'firebase-admin'

dotenv.config()

/**
 * Crear sesión de Checkout de Stripe
 * POST /api/payment/create-checkout-session
 *
 * Body:
 * {
 *   "solicitudId": "abc123",
 *   "plan": "basico",
 *   "email": "maria@ejemplo.com"
 * }
 */
export const createCheckout = async (req, res) => {
  try {
    const { solicitudId, plan, email } = req.body

    // Validar campos requeridos
    if (!solicitudId || !plan || !email) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos faltantes',
        mensaje: 'Debes proporcionar solicitudId, plan y email.'
      })
    }

    console.log(`💳 Creando checkout session para solicitud: ${solicitudId}, plan: ${plan}`)

    // Verificar que la solicitud existe
    const db = getFirestore()
    const solicitudDoc = await db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes')
      .doc(solicitudId)
      .get()

    if (!solicitudDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada',
        mensaje: 'No se encontró la solicitud especificada.'
      })
    }

    // Obtener Price ID de Stripe para el plan
    const priceId = getPriceIdForPlan(plan)

    // URLs de success y cancel
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174'
    const successUrl = `${frontendUrl}/suscripcion/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${frontendUrl}/suscripcion/cancel`

    // Crear sesión de Checkout
    const session = await createCheckoutSession({
      priceId,
      clienteEmail: email,
      solicitudId,
      successUrl,
      cancelUrl
    })

    console.log(`✅ Checkout session creada: ${session.id}`)

    // Guardar sessionId en la solicitud
    await db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes')
      .doc(solicitudId)
      .update({
        stripeSessionId: session.id,
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      })

    // Responder con la URL de checkout
    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    })
  } catch (error) {
    console.error('❌ Error al crear checkout session:', error)
    res.status(500).json({
      success: false,
      error: 'Error en el servidor',
      mensaje: 'Ocurrió un error al crear la sesión de pago.'
    })
  }
}

/**
 * Verificar estado de sesión de Checkout
 * GET /api/payment/checkout-session/:sessionId
 */
export const verifyCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID requerido',
        mensaje: 'Debes proporcionar el ID de la sesión.'
      })
    }

    console.log(`🔍 Verificando checkout session: ${sessionId}`)

    // Obtener sesión de Stripe
    const session = await getCheckoutSession(sessionId)

    // Responder con datos relevantes
    res.status(200).json({
      success: true,
      data: {
        status: session.payment_status,
        customerEmail: session.customer_email,
        subscriptionId: session.subscription,
        metadata: session.metadata
      }
    })
  } catch (error) {
    console.error('❌ Error al verificar checkout session:', error)
    res.status(500).json({
      success: false,
      error: 'Error en el servidor',
      mensaje: 'Ocurrió un error al verificar la sesión de pago.'
    })
  }
}

/**
 * Webhook de Stripe para eventos de pagos
 * POST /api/payment/webhook
 *
 * Este endpoint recibe eventos de Stripe cuando ocurren cambios
 * en las suscripciones (pago exitoso, cancelación, etc.)
 */
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature']

    if (!signature) {
      console.error('⚠️  Webhook sin signature')
      return res.status(400).json({
        success: false,
        error: 'Signature faltante'
      })
    }

    // Construir evento verificado
    const event = constructWebhookEvent(req.body, signature)

    console.log(`📨 Webhook recibido: ${event.type}`)

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object)
        break

      default:
        console.log(`ℹ️  Evento no manejado: ${event.type}`)
    }

    // Responder a Stripe
    res.status(200).json({ received: true })
  } catch (error) {
    console.error('❌ Error en webhook:', error)
    res.status(400).json({
      success: false,
      error: 'Webhook error',
      mensaje: error.message
    })
  }
}

/**
 * Maneja el evento checkout.session.completed
 * Se dispara cuando un cliente completa el pago exitosamente
 * AQUÍ SE CREA EL CLIENTE Y SE ENVÍAN LOS EMAILS
 */
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log(`✅ Checkout completado: ${session.id}`)

    const { metadata, subscription, customer_email } = session
    const solicitudId = metadata?.solicitudId

    if (!solicitudId) {
      console.error('⚠️  No se encontró solicitudId en metadata')
      return
    }

    const db = getFirestore()

    // Obtener datos de la solicitud
    const solicitudDoc = await db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes')
      .doc(solicitudId)
      .get()

    if (!solicitudDoc.exists) {
      console.error(`⚠️  No se encontró la solicitud: ${solicitudId}`)
      return
    }

    const datosSolicitud = solicitudDoc.data()

    // Importar utilidades necesarias
    const { generarCredencialesCliente } = await import('../utils/clienteUtils.js')
    const { generarUsuarioUnico, crearCliente } = await import('../config/firebase.js')
    const { enviarEmailConfirmacionCliente, enviarEmailCredencialesCliente } = await import('../config/email.js')
    const bcrypt = await import('bcryptjs')

    // Generar credenciales únicas para el cliente
    const credenciales = generarCredencialesCliente(datosSolicitud)
    const usuarioBase = credenciales.usuario
    const usuarioUnico = await generarUsuarioUnico(usuarioBase)

    console.log(`🔑 Usuario generado para solicitud ${solicitudId}: ${usuarioUnico}`)

    // Hashear la contraseña temporal
    const passwordHash = await bcrypt.default.hash(credenciales.passwordTemporal, 10)

    // Crear cliente en Firestore
    const datosCliente = {
      nombreCompleto: datosSolicitud.nombrePropietario,
      email: datosSolicitud.email,
      telefono: datosSolicitud.telefono,
      nombreSalon: datosSolicitud.nombreSalon,
      usuario: usuarioUnico,
      passwordHash: passwordHash,
      solicitudId: solicitudId,
      planSeleccionado: datosSolicitud.plan
    }

    const resultadoCliente = await crearCliente(datosCliente)
    const clienteId = resultadoCliente.id

    console.log(`✅ Cliente creado con ID: ${clienteId}`)

    // Actualizar solicitud con datos de Stripe y clienteId
    await db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes')
      .doc(solicitudId)
      .update({
        estado: 'procesado',
        stripeCustomerEmail: customer_email,
        stripeSubscriptionId: subscription,
        stripeSessionId: session.id,
        clienteId: clienteId,
        fechaPago: admin.firestore.FieldValue.serverTimestamp(),
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      })

    // Actualizar cliente con suscripción activa
    await db
      .collection('landing-page')
      .doc('data')
      .collection('clientes')
      .doc(clienteId)
      .update({
        suscripcionId: subscription,
        estadoSuscripcion: 'activa',
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      })

    // Enviar emails de confirmación y credenciales
    Promise.all([
      enviarEmailConfirmacionCliente(datosSolicitud),
      enviarEmailCredencialesCliente(
        {
          nombreCompleto: datosSolicitud.nombrePropietario,
          email: datosSolicitud.email,
          nombreSalon: datosSolicitud.nombreSalon
        },
        {
          usuario: usuarioUnico,
          passwordTemporal: credenciales.passwordTemporal
        }
      )
    ])
      .then(() => {
        console.log(`✅ Emails de confirmación y credenciales enviados para solicitud ${solicitudId}`)
      })
      .catch(error => {
        console.error('⚠️  Error al enviar emails (cliente creado exitosamente):', error.message)
      })

    console.log(`✅ Solicitud ${solicitudId} completamente procesada`)
  } catch (error) {
    console.error('❌ Error al manejar checkout.session.completed:', error)
  }
}

/**
 * Maneja el evento customer.subscription.created
 */
async function handleSubscriptionCreated(subscription) {
  console.log(`📋 Suscripción creada: ${subscription.id}`)
  // Lógica adicional si es necesaria
}

/**
 * Maneja el evento customer.subscription.updated
 */
async function handleSubscriptionUpdated(subscription) {
  console.log(`🔄 Suscripción actualizada: ${subscription.id}`)

  const db = getFirestore()

  // Buscar cliente por subscription ID
  const clientesSnapshot = await db
    .collection('landing-page')
    .doc('data')
    .collection('clientes')
    .where('suscripcionId', '==', subscription.id)
    .limit(1)
    .get()

  if (!clientesSnapshot.empty) {
    const clienteDoc = clientesSnapshot.docs[0]

    // Mapear estado de Stripe a nuestro sistema
    let estadoSuscripcion = 'pendiente'
    if (subscription.status === 'active') {
      estadoSuscripcion = 'activa'
    } else if (subscription.status === 'canceled') {
      estadoSuscripcion = 'cancelada'
    } else if (subscription.status === 'past_due') {
      estadoSuscripcion = 'vencida'
    }

    await clienteDoc.ref.update({
      estadoSuscripcion: estadoSuscripcion,
      fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
    })

    console.log(`✅ Cliente actualizado - estado: ${estadoSuscripcion}`)
  }
}

/**
 * Maneja el evento customer.subscription.deleted
 */
async function handleSubscriptionDeleted(subscription) {
  console.log(`🗑️  Suscripción eliminada: ${subscription.id}`)

  const db = getFirestore()

  // Buscar cliente por subscription ID
  const clientesSnapshot = await db
    .collection('landing-page')
    .doc('data')
    .collection('clientes')
    .where('suscripcionId', '==', subscription.id)
    .limit(1)
    .get()

  if (!clientesSnapshot.empty) {
    const clienteDoc = clientesSnapshot.docs[0]

    await clienteDoc.ref.update({
      estadoSuscripcion: 'cancelada',
      estado: 'suspendido',
      fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
    })

    console.log(`✅ Cliente suspendido por cancelación de suscripción`)
  }
}

/**
 * Maneja el evento invoice.payment_succeeded
 */
async function handleInvoicePaymentSucceeded(invoice) {
  console.log(`💰 Pago exitoso - Invoice: ${invoice.id}`)
  // Lógica para registrar pagos exitosos
}

/**
 * Maneja el evento invoice.payment_failed
 */
async function handleInvoicePaymentFailed(invoice) {
  console.log(`⚠️  Pago fallido - Invoice: ${invoice.id}`)
  // Lógica para manejar pagos fallidos (notificar al cliente, etc.)
}

export default {
  createCheckout,
  verifyCheckoutSession,
  handleWebhook
}
