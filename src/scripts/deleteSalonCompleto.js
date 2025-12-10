/**
 * Script para borrar un salón COMPLETO (documento + todas las subcolecciones)
 *
 * USO:
 * node src/scripts/deleteSalonCompleto.js <salonId>
 *
 * EJEMPLO:
 * node src/scripts/deleteSalonCompleto.js misalon131025
 */

import { initializeFirebase } from '../config/firebase.js'

/**
 * Borrar todos los documentos de una colección
 */
async function deleteCollection(db, collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath)
  const query = collectionRef.limit(batchSize)

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject)
  })
}

async function deleteQueryBatch(db, query, resolve) {
  const snapshot = await query.get()

  const batchSize = snapshot.size
  if (batchSize === 0) {
    // Terminado
    resolve()
    return
  }

  // Borrar documentos en batch
  const batch = db.batch()
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })
  await batch.commit()

  // Recurse en el siguiente batch
  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve)
  })
}

/**
 * Borrar salón completo con todas sus subcolecciones
 */
async function deleteSalonCompleto(salonId) {
  try {
    console.log(`\n🗑️  Iniciando borrado completo del salón: "${salonId}"\n`)

    const db = initializeFirebase()

    // =====================================================================
    // 1. BORRAR SUBCOLECCIONES DE salones/{salonId}
    // =====================================================================

    console.log('📂 Borrando subcolecciones...')

    const subcollections = [
      'usuarios',
      'servicios',
      'productos',
      'estilistas',
      'configuracion',
      'titulos',
      'foot',
      'imagenes',
      'duracion',
      'reservas',
      'pre-reservas',
      'tokens_recuperacion',
      'tokens_cancelacion'
    ]

    for (const subcol of subcollections) {
      const path = `salones/${salonId}/${subcol}`
      try {
        await deleteCollection(db, path)
        console.log(`  ✅ ${subcol}`)
      } catch (error) {
        console.log(`  ⚠️  ${subcol} (no existe o error: ${error.message})`)
      }
    }

    // =====================================================================
    // 2. BORRAR DOCUMENTO PRINCIPAL salones/{salonId}
    // =====================================================================

    console.log('\n📄 Borrando documento principal...')
    try {
      await db.collection('salones').doc(salonId).delete()
      console.log('  ✅ salones/' + salonId)
    } catch (error) {
      console.log(`  ⚠️  Error: ${error.message}`)
    }

    // =====================================================================
    // 3. BORRAR METADATA salones_map/{salonId}
    // =====================================================================

    console.log('\n🗺️  Borrando metadata...')
    try {
      await db.collection('salones_map').doc(salonId).delete()
      console.log('  ✅ salones_map/' + salonId)
    } catch (error) {
      console.log(`  ⚠️  Error: ${error.message}`)
    }

    // =====================================================================
    // 4. BORRAR REGISTRO DE ID (si existe)
    // =====================================================================

    console.log('\n🔑 Borrando registro de ID...')
    try {
      await db
        .collection('landing-page')
        .doc('data')
        .collection('salonesId')
        .doc(salonId)
        .delete()
      console.log('  ✅ landing-page/data/salonesId/' + salonId)
    } catch (error) {
      console.log(`  ⚠️  Error: ${error.message}`)
    }

    // =====================================================================
    // 5. BORRAR PENDIENTES (si existe)
    // =====================================================================

    console.log('\n⏳ Borrando pendientes...')
    try {
      await db
        .collection('landing-page')
        .doc('data')
        .collection('salones_pendientes')
        .doc(salonId)
        .delete()
      console.log('  ✅ landing-page/data/salones_pendientes/' + salonId)
    } catch (error) {
      console.log(`  ⚠️  Error: ${error.message}`)
    }

    // =====================================================================
    // 6. BORRAR IMÁGENES EN CLOUDINARY-PENDING (si existe)
    // =====================================================================

    console.log('\n🖼️  Borrando imágenes pendientes...')
    try {
      await db
        .collection('landing-page')
        .doc('data')
        .collection('cloudinary-pending')
        .doc(salonId)
        .delete()
      console.log('  ✅ landing-page/data/cloudinary-pending/' + salonId)
    } catch (error) {
      console.log(`  ⚠️  Error: ${error.message}`)
    }

    console.log(`\n✅ Salón "${salonId}" borrado completamente\n`)
    console.log('⚠️  NOTA: Las imágenes en Cloudinary deben borrarse manualmente si existen\n')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error al borrar salón:', error)
    process.exit(1)
  }
}

// Obtener salonId de argumentos
const salonId = process.argv[2]

if (!salonId) {
  console.error('\n❌ Error: Debes proporcionar un salonId\n')
  console.log('USO: node src/scripts/deleteSalonCompleto.js <salonId>\n')
  console.log('EJEMPLO: node src/scripts/deleteSalonCompleto.js misalon131025\n')
  process.exit(1)
}

// Confirmar antes de borrar
console.log(`\n⚠️  ¿Estás seguro de que quieres borrar el salón "${salonId}"?`)
console.log('Esta acción es IRREVERSIBLE.\n')
console.log('Presiona Ctrl+C para cancelar o Enter para continuar...\n')

process.stdin.once('data', () => {
  deleteSalonCompleto(salonId)
})
