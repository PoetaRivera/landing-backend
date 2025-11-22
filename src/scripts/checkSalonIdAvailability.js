
import { initializeFirebase } from '../config/firebase.js';

async function checkSalonId() {
    try {
        console.log('🔍 Verificando disponibilidad del ID "caroline"...');
        const db = initializeFirebase();

        // 1. Check salones_map (Main project mapping)
        const mapDoc = await db.collection('salones_map').doc('caroline').get();
        console.log(`- salones_map/caroline: ${mapDoc.exists ? 'OCUPADO ❌' : 'DISPONIBLE ✅'}`);

        // 2. Check salones collection (Main project salons)
        const salonDoc = await db.collection('salones').doc('caroline').get();
        console.log(`- salones/caroline: ${salonDoc.exists ? 'OCUPADO ❌' : 'DISPONIBLE ✅'}`);

        // 3. Check landing-page pending salons
        const pendingDoc = await db.collection('landing-page').doc('data').collection('salones_pendientes').doc('caroline').get();
        console.log(`- landing-page/.../salones_pendientes/caroline: ${pendingDoc.exists ? 'OCUPADO ❌' : 'DISPONIBLE ✅'}`);

    } catch (error) {
        console.error('❌ Error al verificar ID:', error);
    }
}

checkSalonId();
