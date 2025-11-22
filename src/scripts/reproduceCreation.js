
import { initializeFirebase } from '../config/firebase.js';
import { crearSalonCompleto } from '../utils/crearSalonCompleto.js';

async function reproduceCreation() {
    try {
        console.log('🚀 Iniciando script de reproducción de creación de salón...');
        const db = initializeFirebase();

        const solicitudId = 'UllRDHnQnBtvZsnUXwrV'; // ID obtenido de logs anteriores
        const salonId = 'caroline'; // ID esperado

        console.log(`🔍 Buscando solicitud ${solicitudId}...`);
        const snapshot = await db.collection('landing-page')
            .doc('data')
            .collection('solicitudes_completas')
            .doc(solicitudId)
            .get();

        if (!snapshot.exists) {
            console.error('❌ Solicitud no encontrada');
            return;
        }

        const solicitud = snapshot.data();
        console.log('✅ Solicitud encontrada:', solicitud.nombreSalon);

        console.log('🛠️  Intentando ejecutar crearSalonCompleto...');
        const resultado = await crearSalonCompleto(solicitud, salonId);

        console.log('✅ Resultado:', resultado);

    } catch (error) {
        console.error('❌ ERROR CAPTURADO EN SCRIPT:', error);
        if (error.stack) console.error(error.stack);
    }
}

reproduceCreation();
