
import { initializeFirebase } from '../config/firebase.js';

async function checkClient() {
    try {
        console.log('🔍 Verificando existencia de cliente...');
        const db = initializeFirebase();

        // Email de la solicitud (obtenido de logs anteriores o solicitud)
        // En los logs vi: nrrvrivera@gmail.com (admin) pero la solicitud es de caroline
        // Necesito el email de la solicitud.
        // Voy a leer la solicitud primero.

        const solicitudId = 'UllRDHnQnBtvZsnUXwrV';
        const doc = await db.collection('landing-page').doc('data').collection('solicitudes_completas').doc(solicitudId).get();

        if (!doc.exists) {
            console.log('❌ Solicitud no encontrada');
            return;
        }

        const email = doc.data().email;
        console.log(`📧 Email de la solicitud: ${email}`);

        const clientesSnapshot = await db.collection('landing-page')
            .doc('data')
            .collection('clientes')
            .where('email', '==', email)
            .get();

        if (clientesSnapshot.empty) {
            console.log('✅ Cliente NO existe. El error es otro.');
        } else {
            console.log('❌ Cliente YA EXISTE. ID:', clientesSnapshot.docs[0].id);
            console.log('   Esto causa el fallo en crearCliente().');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkClient();
