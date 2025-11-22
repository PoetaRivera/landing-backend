
import { initializeFirebase } from '../config/firebase.js';

async function checkLatestSalons() {
    try {
        console.log('🔍 Verificando últimos salones creados...');
        const db = initializeFirebase();

        // 1. Verificar salones_map (Metadata)
        console.log('\n📂 Colección: salones_map (Metadata)');
        const mapSnapshot = await db.collection('salones_map')
            .orderBy('fechaCreacion', 'desc')
            .limit(5)
            .get();

        if (mapSnapshot.empty) {
            console.log('   ⚠️  No hay documentos en salones_map');
        } else {
            mapSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`   - ID: ${doc.id}`);
                console.log(`     Nombre: ${data.nombreComercial}`);
                console.log(`     Creado: ${data.fechaCreacion}`);
                console.log('     -------------------');
            });
        }

        // 2. Verificar salones (Documento Principal)
        console.log('\n📂 Colección: salones (Estructura Principal)');
        const salonesSnapshot = await db.collection('salones')
            .orderBy('creadoEn', 'desc')
            .limit(5)
            .get();

        if (salonesSnapshot.empty) {
            console.log('   ⚠️  No hay documentos en salones');
        } else {
            salonesSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`   - ID: ${doc.id}`);
                console.log(`     Creado: ${data.creadoEn}`);
                console.log('     -------------------');
            });
        }

    } catch (error) {
        console.error('❌ Error al verificar salones:', error);
    }
}

checkLatestSalons();
