
import { initializeFirebase } from '../config/firebase.js';

async function debugFirestore() {
    try {
        console.log('🔍 Iniciando depuración de Firestore...');
        const db = initializeFirebase();

        console.log('📂 Listando colecciones raíz...');
        const collections = await db.listCollections();

        if (collections.length === 0) {
            console.log('⚠️  No se encontraron colecciones raíz.');
        } else {
            console.log('✅ Colecciones encontradas:');
            collections.forEach(col => console.log(`   - ${col.id}`));
        }

        // Verificar si existe la colección 'salones'
        const salonesCol = collections.find(c => c.id === 'salones');
        if (salonesCol) {
            console.log('\n🏢 Verificando documentos en "salones"...');
            const snapshot = await db.collection('salones').limit(5).get();
            if (snapshot.empty) {
                console.log('   ⚠️  La colección "salones" está vacía.');
            } else {
                console.log(`   ✅ Se encontraron ${snapshot.size} salones (mostrando primeros 5):`);
                snapshot.forEach(doc => console.log(`      - ID: ${doc.id}, Creado: ${doc.data().creadoEn}`));
            }
        } else {
            console.log('\n❌ La colección "salones" NO existe.');
        }

        // Verificar si existe la colección 'salones_map'
        const salonesMapCol = collections.find(c => c.id === 'salones_map');
        if (salonesMapCol) {
            console.log('\n🗺️  Verificando documentos en "salones_map"...');
            const snapshot = await db.collection('salones_map').limit(5).get();
            if (snapshot.empty) {
                console.log('   ⚠️  La colección "salones_map" está vacía.');
            } else {
                console.log(`   ✅ Se encontraron ${snapshot.size} mapas (mostrando primeros 5):`);
                snapshot.forEach(doc => console.log(`      - ID: ${doc.id}, Nombre: ${doc.data().nombreComercial}`));
            }
        } else {
            console.log('\n❌ La colección "salones_map" NO existe.');
        }

    } catch (error) {
        console.error('❌ Error durante la depuración:', error);
    }
}

debugFirestore();
