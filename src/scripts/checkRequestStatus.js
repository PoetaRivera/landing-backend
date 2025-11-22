
import { initializeFirebase } from '../config/firebase.js';

async function checkRequestStatus() {
    try {
        console.log('🔍 Verificando estado de la solicitud...');
        const db = initializeFirebase();
        const solicitudId = 'UllRDHnQnBtvZsnUXwrV';

        const doc = await db.collection('landing-page').doc('data').collection('solicitudes_completas').doc(solicitudId).get();

        if (!doc.exists) {
            console.log('❌ Solicitud no encontrada');
            return;
        }

        const data = doc.data();
        console.log('📋 Datos de la solicitud:');
        console.log(`   - Estado: ${data.estado}`);
        console.log(`   - SalonId: ${data.salonId}`);
        console.log(`   - ClienteId: ${data.clienteId}`);
        console.log(`   - Actualizado: ${data.fechaActualizacion?.toDate()}`);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkRequestStatus();
