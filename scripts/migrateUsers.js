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
 * Script para migrar usuarios_admin de la raíz a landing-page/data/usuarios_admin
 * Uso: node scripts/migrateUsers.js
 */
async function migrateUsers() {
  try {
    console.log('╔═══════════════════════════════════════════════════════╗')
    console.log('║                                                       ║')
    console.log('║   🔄 Migrar Usuarios Admin                            ║')
    console.log('║   De: usuarios_admin (raíz)                           ║')
    console.log('║   A:  landing-page/data/usuarios_admin                ║')
    console.log('║                                                       ║')
    console.log('╚═══════════════════════════════════════════════════════╝')
    console.log('')

    // Inicializar Firebase
    console.log('Inicializando Firebase...')
    initializeFirebase()
    const db = getFirestore()
    console.log('✅ Firebase inicializado\n')

    // Verificar si hay usuarios en la ubicación antigua
    console.log('⏳ Buscando usuarios en ubicación antigua (usuarios_admin)...')
    const oldUsersSnapshot = await db.collection('usuarios_admin').get()

    if (oldUsersSnapshot.empty) {
      console.log('ℹ️  No se encontraron usuarios en la ubicación antigua.')
      console.log('   La colección usuarios_admin (raíz) está vacía.')
      console.log('')
      rl.close()
      process.exit(0)
    }

    const totalUsers = oldUsersSnapshot.size
    console.log(`✅ Encontrados ${totalUsers} usuario(s) para migrar\n`)

    // Listar usuarios
    console.log('📋 Usuarios encontrados:')
    oldUsersSnapshot.forEach((doc, index) => {
      const data = doc.data()
      console.log(`   ${index + 1}. ${data.nombre} (${data.email})`)
    })
    console.log('')

    // Confirmar migración
    const confirm = await question(
      `¿Deseas migrar ${totalUsers} usuario(s) a landing-page/data/usuarios_admin? (si/no): `
    )

    if (confirm.toLowerCase() !== 'si' && confirm.toLowerCase() !== 's') {
      console.log('\n⚠️  Migración cancelada por el usuario')
      rl.close()
      process.exit(0)
    }

    console.log('\n⏳ Iniciando migración...\n')

    // Verificar si ya existen usuarios en la nueva ubicación
    const newUsersSnapshot = await db
      .collection('landing-page')
      .doc('data')
      .collection('usuarios_admin')
      .get()

    if (!newUsersSnapshot.empty) {
      console.log('⚠️  ADVERTENCIA: Ya existen usuarios en la nueva ubicación.')
      console.log(`   Usuarios existentes: ${newUsersSnapshot.size}`)
      const overwrite = await question(
        '¿Deseas continuar de todas formas? Los duplicados se sobrescribirán. (si/no): '
      )

      if (overwrite.toLowerCase() !== 'si' && overwrite.toLowerCase() !== 's') {
        console.log('\n⚠️  Migración cancelada')
        rl.close()
        process.exit(0)
      }
    }

    // Migrar usuarios
    let migrated = 0
    let errors = 0

    for (const doc of oldUsersSnapshot.docs) {
      try {
        const userData = doc.data()

        // Escribir en nueva ubicación
        await db
          .collection('landing-page')
          .doc('data')
          .collection('usuarios_admin')
          .doc(doc.id)
          .set(userData)

        migrated++
        console.log(`✅ [${migrated}/${totalUsers}] Usuario migrado: ${userData.email}`)
      } catch (error) {
        errors++
        console.error(`❌ Error al migrar usuario ${doc.id}:`, error.message)
      }
    }

    console.log('\n╔═══════════════════════════════════════════════════════╗')
    console.log('║                                                       ║')
    console.log('║   ✅ Migración Completada                             ║')
    console.log('║                                                       ║')
    console.log('╚═══════════════════════════════════════════════════════╝')
    console.log('')
    console.log('📊 Resumen:')
    console.log(`   Total usuarios: ${totalUsers}`)
    console.log(`   Migrados exitosamente: ${migrated}`)
    console.log(`   Errores: ${errors}`)
    console.log('')

    if (errors === 0) {
      const deleteOld = await question(
        '¿Deseas eliminar la colección antigua usuarios_admin (raíz)? (si/no): '
      )

      if (deleteOld.toLowerCase() === 'si' || deleteOld.toLowerCase() === 's') {
        console.log('\n⏳ Eliminando colección antigua...')

        // Eliminar documentos de la colección antigua
        const batch = db.batch()
        oldUsersSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref)
        })
        await batch.commit()

        console.log('✅ Colección antigua eliminada')
      } else {
        console.log('\nℹ️  Colección antigua conservada.')
        console.log(
          '   IMPORTANTE: Elimínala manualmente desde Firebase Console cuando estés seguro.'
        )
      }
    } else {
      console.log('\n⚠️  Hubo errores durante la migración.')
      console.log('   Revisa los logs y verifica los datos antes de eliminar la colección antigua.')
    }

    console.log('\n🎉 Proceso completado')
    console.log('')

    rl.close()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message)
    rl.close()
    process.exit(1)
  }
}

// Ejecutar el script
migrateUsers()
