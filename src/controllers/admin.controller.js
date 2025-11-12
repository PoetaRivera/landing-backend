/**
 * Controlador del Panel de Administración
 * Gestión de clientes, solicitudes y estadísticas
 */

import { getFirestore } from '../config/firebase.js'
import admin from 'firebase-admin'

/**
 * Obtener todos los clientes con filtros opcionales
 * GET /api/admin/clientes
 */
export const getClientes = async (req, res) => {
  try {
    const { estado, plan, limite = 50, offset = 0 } = req.query

    const db = getFirestore()
    let query = db
      .collection('landing-page')
      .doc('data')
      .collection('clientes')
      .orderBy('fechaCreacion', 'desc')

    // Aplicar filtros
    if (estado) {
      query = query.where('estado', '==', estado)
    }
    if (plan) {
      query = query.where('planSeleccionado', '==', plan)
    }

    // Aplicar límite
    query = query.limit(parseInt(limite))

    // Aplicar offset si existe
    if (parseInt(offset) > 0) {
      query = query.offset(parseInt(offset))
    }

    const snapshot = await query.get()

    const clientes = []
    snapshot.forEach(doc => {
      const data = doc.data()
      clientes.push({
        id: doc.id,
        nombreCompleto: data.nombreCompleto,
        email: data.email,
        telefono: data.telefono,
        nombreSalon: data.nombreSalon,
        usuario: data.usuario,
        planSeleccionado: data.planSeleccionado,
        estado: data.estado,
        estadoSuscripcion: data.estadoSuscripcion,
        suscripcionId: data.suscripcionId,
        fechaCreacion: data.fechaCreacion?.toDate().toISOString(),
        fechaActualizacion: data.fechaActualizacion?.toDate().toISOString()
      })
    })

    res.status(200).json({
      success: true,
      total: clientes.length,
      clientes
    })
  } catch (error) {
    console.error('❌ Error al obtener clientes:', error)
    res.status(500).json({
      success: false,
      error: 'Error al obtener clientes',
      mensaje: 'Ocurrió un error al obtener la lista de clientes'
    })
  }
}

/**
 * Obtener detalles de un cliente específico
 * GET /api/admin/clientes/:id
 */
export const getClienteById = async (req, res) => {
  try {
    const { id } = req.params

    const db = getFirestore()
    const clienteDoc = await db
      .collection('landing-page')
      .doc('data')
      .collection('clientes')
      .doc(id)
      .get()

    if (!clienteDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado',
        mensaje: 'No se encontró un cliente con ese ID'
      })
    }

    const data = clienteDoc.data()

    res.status(200).json({
      success: true,
      cliente: {
        id: clienteDoc.id,
        ...data,
        fechaCreacion: data.fechaCreacion?.toDate().toISOString(),
        fechaActualizacion: data.fechaActualizacion?.toDate().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Error al obtener cliente:', error)
    res.status(500).json({
      success: false,
      error: 'Error al obtener cliente',
      mensaje: 'Ocurrió un error al obtener el cliente'
    })
  }
}

/**
 * Actualizar estado de un cliente (suspender/activar)
 * PATCH /api/admin/clientes/:id/estado
 */
export const updateClienteEstado = async (req, res) => {
  try {
    const { id } = req.params
    const { estado, razon } = req.body

    // Validar estado
    const estadosValidos = ['activo', 'suspendido', 'cancelado']
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido',
        mensaje: `El estado debe ser uno de: ${estadosValidos.join(', ')}`
      })
    }

    const db = getFirestore()
    await db
      .collection('landing-page')
      .doc('data')
      .collection('clientes')
      .doc(id)
      .update({
        estado: estado,
        razonCambioEstado: razon || null,
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      })

    console.log(`✅ Estado de cliente ${id} actualizado a: ${estado}`)

    res.status(200).json({
      success: true,
      mensaje: 'Estado del cliente actualizado exitosamente'
    })
  } catch (error) {
    console.error('❌ Error al actualizar estado del cliente:', error)
    res.status(500).json({
      success: false,
      error: 'Error al actualizar estado',
      mensaje: 'Ocurrió un error al actualizar el estado del cliente'
    })
  }
}

/**
 * Obtener estadísticas del dashboard
 * GET /api/admin/estadisticas
 */
export const getEstadisticas = async (req, res) => {
  try {
    const db = getFirestore()

    // Obtener todos los clientes
    const clientesSnapshot = await db
      .collection('landing-page')
      .doc('data')
      .collection('clientes')
      .get()

    // Obtener todas las solicitudes
    const solicitudesSnapshot = await db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes')
      .get()

    // Procesar clientes
    const clientes = []
    clientesSnapshot.forEach(doc => {
      clientes.push({ id: doc.id, ...doc.data() })
    })

    // Procesar solicitudes
    const solicitudes = []
    solicitudesSnapshot.forEach(doc => {
      solicitudes.push({ id: doc.id, ...doc.data() })
    })

    // Calcular estadísticas
    const stats = {
      clientes: {
        total: clientes.length,
        activos: clientes.filter(c => c.estado === 'activo').length,
        suspendidos: clientes.filter(c => c.estado === 'suspendido').length,
        cancelados: clientes.filter(c => c.estado === 'cancelado').length
      },
      suscripciones: {
        activas: clientes.filter(c => c.estadoSuscripcion === 'activa').length,
        canceladas: clientes.filter(c => c.estadoSuscripcion === 'cancelada').length,
        vencidas: clientes.filter(c => c.estadoSuscripcion === 'vencida').length,
        pendientes: clientes.filter(c => c.estadoSuscripcion === 'pendiente').length
      },
      planes: {
        basico: clientes.filter(c => c.planSeleccionado?.includes('Básico')).length,
        estandar: clientes.filter(c => c.planSeleccionado?.includes('Estándar')).length,
        premium: clientes.filter(c => c.planSeleccionado?.includes('Premium')).length
      },
      solicitudes: {
        total: solicitudes.length,
        pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
        procesadas: solicitudes.filter(s => s.estado === 'procesado').length,
        rechazadas: solicitudes.filter(s => s.estado === 'rechazado').length
      },
      ingresos: {
        mensual: calcularIngresosMensuales(clientes)
      }
    }

    res.status(200).json({
      success: true,
      estadisticas: stats
    })
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error)
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      mensaje: 'Ocurrió un error al calcular las estadísticas'
    })
  }
}

/**
 * Calcular ingresos mensuales estimados
 */
function calcularIngresosMensuales(clientes) {
  const planesPrecios = {
    'Básico': 15,
    'Estándar': 30,
    'Premium': 50
  }

  let total = 0
  clientes.forEach(cliente => {
    if (cliente.estadoSuscripcion === 'activa' && cliente.planSeleccionado) {
      for (const [plan, precio] of Object.entries(planesPrecios)) {
        if (cliente.planSeleccionado.includes(plan)) {
          total += precio
          break
        }
      }
    }
  })

  return total
}

/**
 * Obtener todas las solicitudes con filtros
 * GET /api/admin/solicitudes
 */
export const getSolicitudesAdmin = async (req, res) => {
  try {
    const { estado, plan, limite = 50, offset = 0 } = req.query

    const db = getFirestore()
    let query = db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes')
      .orderBy('fechaSolicitud', 'desc')

    // Aplicar filtros
    if (estado) {
      query = query.where('estado', '==', estado)
    }
    if (plan) {
      query = query.where('plan', '==', plan)
    }

    // Aplicar límite
    query = query.limit(parseInt(limite))

    // Aplicar offset si existe
    if (parseInt(offset) > 0) {
      query = query.offset(parseInt(offset))
    }

    const snapshot = await query.get()

    const solicitudes = []
    snapshot.forEach(doc => {
      const data = doc.data()
      solicitudes.push({
        id: doc.id,
        nombreSalon: data.nombreSalon,
        nombrePropietario: data.nombrePropietario,
        email: data.email,
        telefono: data.telefono,
        plan: data.plan,
        estado: data.estado,
        clienteId: data.clienteId,
        stripeSessionId: data.stripeSessionId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        fechaSolicitud: data.fechaSolicitud?.toDate().toISOString(),
        fechaPago: data.fechaPago?.toDate().toISOString(),
        fechaActualizacion: data.fechaActualizacion?.toDate().toISOString()
      })
    })

    res.status(200).json({
      success: true,
      total: solicitudes.length,
      solicitudes
    })
  } catch (error) {
    console.error('❌ Error al obtener solicitudes:', error)
    res.status(500).json({
      success: false,
      error: 'Error al obtener solicitudes',
      mensaje: 'Ocurrió un error al obtener la lista de solicitudes'
    })
  }
}

export default {
  getClientes,
  getClienteById,
  updateClienteEstado,
  getEstadisticas,
  getSolicitudesAdmin
}
