/**
 * Setup global de Jest
 * Se ejecuta antes de cada archivo de test
 */

// Variables de entorno para tests
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only-32-chars-min'
process.env.JWT_EXPIRES_IN = '24h'
process.env.PORT = '4002' // Puerto diferente para tests
process.env.FRONTEND_URL = 'http://localhost:5174'

// Email (mock - no enviará emails reales)
process.env.EMAIL_USER = 'test@example.com'
process.env.EMAIL_PASSWORD = 'test-password-1234'
process.env.EMAIL_ADMIN = 'admin@example.com'

// Stripe (test keys - deben ser reales de test mode)
process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_placeholder'
process.env.STRIPE_PRICE_ID_BASICO = 'price_test_placeholder'

// Firebase (se mockeará)
process.env.GOOGLE_APPLICATION_CREDENTIALS = './firebase-credentials-test.json'

// Suprimir logs en tests (opcional)
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}
