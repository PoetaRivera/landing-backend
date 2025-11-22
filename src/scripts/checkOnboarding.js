
import { initializeFirebase } from '../config/firebase.js';

async function checkOnboarding() {
    try {
        console.log('🔍 Verificando solicitudes completas (Onboarding)...');
        const db = initializeFirebase();

        const snapshot = await db.collection('landing-page')
            .doc('data')
            .collection('solicitudes_completas')
            .orderBy('fechaCreacion', 'desc')
            .limit(5)
            .get();

        if (snapshot.empty) {
            console.log('⚠️  NO hay solicitudes completas registradas.');
        } else {
            console.log(`✅ Se encontraron ${snapshot.size} solicitudes completas:`);
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log('\n-------------------');
                console.log(`ID: ${doc.id}`);
                console.log(`Email: ${data.email}`);
                console.log(`Estado: ${data.estado}`);
                console.log('Datos del Negocio:', JSON.stringify(data.datosNegocio, null, 2));
                console.log('Servicios:', JSON.stringify(data.servicios, null, 2));
                console.log('Horarios:', JSON.stringify(data.horarios, null, 2));
                console.log('Estilistas:', JSON.stringify(data.estilistas, null, 2));
                console.log('-------------------\n');
            });
        }

    } catch (error) {
        console.error('❌ Error al verificar onboarding:', error);
    }
}

checkOnboarding();
