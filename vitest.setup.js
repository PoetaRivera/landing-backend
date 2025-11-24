/**
 * Setup global de Vitest
 * Se ejecuta antes de cada archivo de test
 */

import { vi } from 'vitest'

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

// Mock de Firebase Admin
vi.mock('firebase-admin', () => {
  const firestoreMock = {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    get: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    startAfter: vi.fn().mockReturnThis(),
    batch: vi.fn().mockReturnValue({
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn()
    })
  }

  return {
    default: {
      apps: [],
      initializeApp: vi.fn(),
      credential: {
        cert: vi.fn()
      },
      firestore: vi.fn(() => firestoreMock)
    }
  }
})

// Mock de Firestore FieldValue
vi.mock('firebase-admin/firestore', () => {
  return {
    FieldValue: {
      serverTimestamp: vi.fn().mockReturnValue('TIMESTAMP'),
      increment: vi.fn()
    },
    Timestamp: {
      fromDate: vi.fn(date => date)
    }
  }
})

// Suprimir logs en tests (opcional)
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}
