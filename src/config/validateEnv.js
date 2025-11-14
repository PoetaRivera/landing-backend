/**
 * Validación de Variables de Entorno
 * Verifica que todas las variables requeridas estén configuradas al iniciar el servidor
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * Lista de variables de entorno requeridas
 * Si alguna falta, el servidor no arrancará
 */
const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'EMAIL_ADMIN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID_BASICO'
]

/**
 * Variables opcionales con valores por defecto
 */
const OPTIONAL_ENV_VARS = {
  PORT: 4001,
  NODE_ENV: 'development',
  FRONTEND_URL: 'http://localhost:5174'
}

/**
 * Validaciones adicionales específicas
 */
const VALIDATIONS = {
  JWT_SECRET: (value) => {
    if (value.length < 32) {
      return 'JWT_SECRET debe tener al menos 32 caracteres para ser seguro'
    }
    return null
  },

  EMAIL_PASSWORD: (value) => {
    // Verificar formato de App Password de Gmail (16 caracteres)
    if (value.length === 16 && !/\s/.test(value)) {
      return null // Formato correcto
    }
    console.warn(
      '⚠️  EMAIL_PASSWORD no parece ser un App Password de Gmail (debe tener 16 caracteres sin espacios)'
    )
    return null // No bloquear, solo advertir
  },

  STRIPE_WEBHOOK_SECRET: (value) => {
    if (!value.startsWith('whsec_')) {
      return 'STRIPE_WEBHOOK_SECRET debe comenzar con "whsec_"'
    }
    return null
  },

  STRIPE_SECRET_KEY: (value) => {
    const isTest = value.startsWith('sk_test_')
    const isLive = value.startsWith('sk_live_')

    if (!isTest && !isLive) {
      return 'STRIPE_SECRET_KEY debe comenzar con "sk_test_" o "sk_live_"'
    }

    // Advertir si es placeholder
    if (value.includes('placeholder')) {
      console.warn('⚠️  STRIPE_SECRET_KEY es un valor placeholder - Los pagos NO funcionarán')
    }

    if (isLive && process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  Usando STRIPE_SECRET_KEY de PRODUCCIÓN en ambiente de desarrollo')
    }

    return null
  }
}

/**
 * Valida que todas las variables de entorno requeridas estén presentes
 * @throws {Error} Si falta alguna variable requerida o falla una validación
 */
export function validateEnv() {
  console.log('\n🔍 Validando variables de entorno...\n')

  const errors = []
  const warnings = []

  // 1. Verificar variables requeridas
  REQUIRED_ENV_VARS.forEach((varName) => {
    const value = process.env[varName]

    if (!value || value.trim() === '') {
      errors.push(`❌ Variable requerida faltante: ${varName}`)
    } else {
      // Aplicar validación específica si existe
      if (VALIDATIONS[varName]) {
        const validationError = VALIDATIONS[varName](value)
        if (validationError) {
          errors.push(`❌ ${varName}: ${validationError}`)
        }
      }
      console.log(`✅ ${varName}: Configurado`)
    }
  })

  // 2. Aplicar valores por defecto a variables opcionales
  Object.entries(OPTIONAL_ENV_VARS).forEach(([varName, defaultValue]) => {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue.toString()
      warnings.push(`⚠️  ${varName}: No configurado, usando valor por defecto: ${defaultValue}`)
    } else {
      console.log(`✅ ${varName}: ${process.env[varName]}`)
    }
  })

  // 3. Mostrar advertencias
  if (warnings.length > 0) {
    console.log('\n⚠️  ADVERTENCIAS:\n')
    warnings.forEach((warning) => console.log(warning))
  }

  // 4. Mostrar errores y salir si hay errores críticos
  if (errors.length > 0) {
    console.error('\n❌ ERRORES DE CONFIGURACIÓN:\n')
    errors.forEach((error) => console.error(error))
    console.error('\n📖 Revisa el archivo .env.example para ver las variables requeridas\n')
    process.exit(1)
  }

  // 5. Verificar archivo de credenciales Firebase
  try {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    const isAbsolute = credPath.startsWith('/') || credPath.match(/^[A-Za-z]:/)

    const finalPath = isAbsolute ? credPath : resolve(process.cwd(), credPath)

    readFileSync(finalPath, 'utf8')
    console.log('✅ GOOGLE_APPLICATION_CREDENTIALS: Archivo encontrado')
  } catch (error) {
    console.error(
      `❌ GOOGLE_APPLICATION_CREDENTIALS: No se pudo leer el archivo: ${error.message}`
    )
    console.error('   Verifica que la ruta sea correcta y el archivo exista\n')
    process.exit(1)
  }

  console.log('\n✅ Todas las variables de entorno están correctamente configuradas\n')
}

/**
 * Obtiene información del ambiente actual
 * @returns {Object} Información del ambiente
 */
export function getEnvInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    frontendUrl: process.env.FRONTEND_URL,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    stripeMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'LIVE' : 'TEST'
  }
}

export default {
  validateEnv,
  getEnvInfo
}
