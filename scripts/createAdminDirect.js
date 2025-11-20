import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { initializeFirebase, getFirestore } from '../src/config/firebase.js'

// Cargar variables de entorno
dotenv.config()

/**
 * Script para crear administrador directamente
 * Uso: node scripts/createAdminDirect.js
 */
async function createAdminUser() {
  try {
    console.log('╔═══════════════════════════════════════════════════════╗')
    console.log('║   🔐 Crear Usuario Administrador                      ║')
    console.log('╚═══════════════════════════════════════════════════════╝\n')

    // Inicializar Firebase
    console.log('⏳ Inicializando Firebase...')
    initializeFirebase()
    const db = getFirestore()
    console.log('✅ Firebase inicializado\n')

    // Datos del administrador
    const nombre = 'Administrador Principal'
    const email = 'nrrvrivera@gmail.com'
    const password = 'Admin2025!' // Cambiar después del primer login

    console.log('📋 Creando administrador:')
    console.log(`   Nombre: ${nombre}`)
    console.log(`   Email: ${email}\n`)

    console.log('⏳ Verificando si el email ya existe...')

    // Verificar si el email ya existe
    const existingUser = await db
      .collection('landing-page')
      .doc('data')
      .collection('usuarios_admin')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get()

    if (!existingUser.empty) {
      console.log('⚠️  Ya existe un usuario con ese email')
      console.log('   Si necesitas resetear la contraseña, usa el nuevo flujo de recuperación.\n')
      process.exit(0)
    }

    console.log('⏳ Hasheando contraseña...')

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    console.log('⏳ Creando usuario en Firestore...')

    // Crear usuario en Firestore
    const userData = {
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'admin',
      activo: true,
      fechaCreacion: new Date().toISOString(),
      creadoPor: 'script-direct',
      ultimoLogin: null,
      ultimaIP: null
    }

    const userRef = await db
      .collection('landing-page')
      .doc('data')
      .collection('usuarios_admin')
      .add(userData)

    console.log('\n╔═══════════════════════════════════════════════════════╗')
    console.log('║   ✅ Usuario Administrador Creado Exitosamente        ║')
    console.log('╚═══════════════════════════════════════════════════════╝\n')
    console.log('📋 Detalles del Usuario:')
    console.log(`   ID: ${userRef.id}`)
    console.log(`   Nombre: ${userData.nombre}`)
    console.log(`   Email: ${userData.email}`)
    console.log(`   Role: ${userData.role}\n`)
    console.log('🔑 Credenciales de acceso:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log('\n⚠️  IMPORTANTE: Cambia esta contraseña después del primer login\n')
    console.log('📍 Endpoints disponibles:')
    console.log('   Login: POST /api/auth/login')
    console.log('   Cambiar contraseña: POST /api/auth/change-password')
    console.log('   Recuperar contraseña: POST /api/auth/forgot-password\n')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error al crear usuario administrador:', error.message)
    process.exit(1)
  }
}

// Ejecutar el script
createAdminUser()
