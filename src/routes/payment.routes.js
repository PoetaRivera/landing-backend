/**
 * Rutas de Pagos con Stripe
 * Endpoints para crear checkout sessions y recibir webhooks
 */

import express from 'express'
import { createCheckout, verifyCheckoutSession, handleWebhook } from '../controllers/payment.controller.js'

const router = express.Router()

/**
 * POST /api/payment/create-checkout-session
 * Crea una sesión de Checkout de Stripe
 *
 * Body:
 * {
 *   "solicitudId": "abc123",
 *   "plan": "basico",
 *   "email": "maria@ejemplo.com"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "sessionId": "cs_test_...",
 *     "url": "https://checkout.stripe.com/..."
 *   }
 * }
 */
router.post('/create-checkout-session', createCheckout)

/**
 * GET /api/payment/checkout-session/:sessionId
 * Verifica el estado de una sesión de Checkout
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "status": "paid",
 *     "customerEmail": "maria@ejemplo.com",
 *     "subscriptionId": "sub_...",
 *     "metadata": { ... }
 *   }
 * }
 */
router.get('/checkout-session/:sessionId', verifyCheckoutSession)

/**
 * POST /api/payment/webhook
 * Webhook de Stripe para recibir eventos
 *
 * IMPORTANTE: Este endpoint debe recibir el raw body (no parseado como JSON)
 * Se configura en server.js con express.raw()
 *
 * Headers:
 * stripe-signature: whsec_...
 */
router.post('/webhook', handleWebhook)

export default router
