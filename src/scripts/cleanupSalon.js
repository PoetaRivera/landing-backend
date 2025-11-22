
import { initializeFirebase } from '../config/firebase.js';

async function cleanupSalon() {
    try {
        console.log('🧹 Limpiando salón "caroline" creado manualmente...');
        const db = initializeFirebase();
        const salonId = 'caroline';

        // 1. Delete from salones_map
        await db.collection('salones_map').doc(salonId).delete();
        console.log('✅ salones_map eliminado');

        // 2. Delete from salones (document only, subcollections might remain but it frees the ID check)
        // Note: Firestore delete does not delete subcollections recursively, but checkSalonIdAvailability only checks the document existence.
        await db.collection('salones').doc(salonId).delete();
        console.log('✅ salones (doc) eliminado');

        // 3. Delete from salones_pendientes (if any)
        await db.collection('landing-page').doc('data').collection('salones_pendientes').doc(salonId).delete();
        console.log('✅ salones_pendientes eliminado');

    } catch (error) {
        console.error('❌ Error al limpiar:', error);
    }
}

cleanupSalon();
