import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { initializeFirebase, getFirestore } from '../src/config/firebase.js'
import readline from 'readline'

// Cargar variables de entorno
dotenv.config()

// Crear interfaz para leer input del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Función helper para hacer preguntas
function question(query) {
  return new Promise((resolve) => rl.question(query, resolve))
}

/**
 * Script para crear un usuario administrador
 * Uso: node scripts/createAdmin.js
 */
async function createAdminUser() {
  try {
    console.log('╔═══════════════════════════════════════════════════════╗')
    console.log('║                                                       ║')
    console.log('║   🔐 Crear Usuario Administrador                      ║')
    console.log('║                                                       ║')
    console.log('╚═══════════════════════════════════════════════════════╝')
    console.log('')

    // Inicializar Firebase
    console.log('Inicializando Firebase...')
    initializeFirebase()
    const db = getFirestore()
    console.log('✅ Firebase inicializado\n')

    // Solicitar datos del administrador
    const nombre = await question('Nombre completo del administrador: ')
    const email = await question('Email: ')
    const password = await question('Contraseña (mínimo 8 caracteres): ')
    const confirmPassword = await question('Confirmar contraseña: ')

    // Validaciones
    if (!nombre || nombre.trim().length < 3) {
      console.error('❌ El nombre debe tener al menos 3 caracteres')
      rl.close()
      process.exit(1)
    }

    if (!email || !email.includes('@')) {
      console.error('❌ Email inválido')
      rl.close()
      process.exit(1)
    }

    if (!password || password.length < 8) {
      console.error('❌ La contraseña debe tener al menos 8 caracteres')
      rl.close()
      process.exit(1)
    }

    if (password !== confirmPassword) {
      console.error('❌ Las contraseñas no coinciden')
      rl.close()
      process.exit(1)
    }

    console.log('\n⏳ Verificando si el email ya existe...')

    // Verificar si el email ya existe
    const existingUser = await db
      .collection('usuarios_admin')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get()

    if (!existingUser.empty) {
      console.error('❌ Ya existe un usuario con ese email')
      rl.close()
      process.exit(1)
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
      creadoPor: 'script',
      ultimoLogin: null,
      ultimaIP: null
    }

    const userRef = await db.collection('usuarios_admin').add(userData)

    console.log('\n╔═══════════════════════════════════════════════════════╗')
    console.log('║                                                       ║')
    console.log('║   ✅ Usuario Administrador Creado Exitosamente        ║')
    console.log('║                                                       ║')
    console.log('╚═══════════════════════════════════════════════════════╝')
    console.log('')
    console.log('📋 Detalles del Usuario:')
    console.log(`   ID: ${userRef.id}`)
    console.log(`   Nombre: ${userData.nombre}`)
    console.log(`   Email: ${userData.email}`)
    console.log(`   Role: ${userData.role}`)
    console.log('')
    console.log('🔑 Ahora puedes usar estas credenciales para hacer login:')
    console.log(`   POST /api/auth/login`)
    console.log(`   Body: { "email": "${userData.email}", "password": "<tu-contraseña>" }`)
    console.log('')

    rl.close()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error al crear usuario administrador:', error.message)
    rl.close()
    process.exit(1)
  }
}

// Ejecutar el script
createAdminUser()
