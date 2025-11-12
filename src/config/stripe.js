/**
 * Configuración de Stripe
 * SDK para procesar pagos y suscripciones
 */

import Stripe from 'stripe'
import dotenv from 'dotenv'

dotenv.config()

// Validar que la secret key esté configurada
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY no está definido en las variables de entorno')
}

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia'
})

/**
 * Mapeo de planes a Price IDs de Stripe
 * Estos IDs deben crearse en el dashboard de Stripe
 */
export const STRIPE_PRICE_IDS = {
  basico: process.env.STRIPE_PRICE_ID_BASICO,
  estandar: process.env.STRIPE_PRICE_ID_ESTANDAR,
  premium: process.env.STRIPE_PRICE_ID_PREMIUM
}

/**
 * Obtiene el Price ID correspondiente a un plan
 * @param {string} plan - Nombre del plan (basico, estandar, premium)
 * @returns {string} - Price ID de Stripe
 */
export const getPriceIdForPlan = (plan) => {
  const planLower = plan.toLowerCase()
  const priceId = STRIPE_PRICE_IDS[planLower]

  if (!priceId) {
    throw new Error(`No se encontró Price ID para el plan: ${plan}`)
  }

  return priceId
}

/**
 * Crea una sesión de Checkout de Stripe
 * @param {object} params - Parámetros de la sesión
 * @returns {Promise<Stripe.Checkout.Session>}
 */
export const createCheckoutSession = async ({
  priceId,
  clienteEmail,
  solicitudId,
  successUrl,
  cancelUrl
}) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      customer_email: clienteEmail,
      metadata: {
        solicitudId: solicitudId
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Configuraciones adicionales
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          solicitudId: solicitudId
        }
      }
    })

    return session
  } catch (error) {
    console.error('❌ Error al crear sesión de Checkout:', error)
    throw error
  }
}

/**
 * Obtiene una sesión de Checkout por ID
 * @param {string} sessionId - ID de la sesión
 * @returns {Promise<Stripe.Checkout.Session>}
 */
export const getCheckoutSession = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return session
  } catch (error) {
    console.error('❌ Error al obtener sesión de Checkout:', error)
    throw error
  }
}

/**
 * Obtiene una suscripción por ID
 * @param {string} subscriptionId - ID de la suscripción
 * @returns {Promise<Stripe.Subscription>}
 */
export const getSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription
  } catch (error) {
    console.error('❌ Error al obtener suscripción:', error)
    throw error
  }
}

/**
 * Cancela una suscripción
 * @param {string} subscriptionId - ID de la suscripción
 * @returns {Promise<Stripe.Subscription>}
 */
export const cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId)
    return subscription
  } catch (error) {
    console.error('❌ Error al cancelar suscripción:', error)
    throw error
  }
}

/**
 * Construye un evento de Webhook a partir del payload y signature
 * @param {string|Buffer} payload - Payload del webhook
 * @param {string} signature - Firma del webhook (header stripe-signature)
 * @returns {Stripe.Event}
 */
export const constructWebhookEvent = (payload, signature) => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET no está configurado')
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    )

    return event
  } catch (error) {
    console.error('❌ Error al construir evento de webhook:', error)
    throw error
  }
}

export default stripe
