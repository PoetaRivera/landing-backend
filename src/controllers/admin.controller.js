/**
 * Controlador del Panel de Administración
 * Gestión de clientes, solicitudes y estadísticas
 */

import { getFirestore } from '../config/firebase.js'
import admin from 'firebase-admin'
import bcrypt from 'bcryptjs'
import {
  crearCliente,
  vincularClienteSolicitud,
  generarUsuarioUnico,
  generarSalonIdUnico
} from '../config/firebase.js'
import {
  enviarEmailCredencialesCliente,
  enviarEmailCredencialesOnboarding
} from '../config/email.js'

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
        salonId: data.salonId,
        onboardingId: data.onboardingId,
        fechaCreacion: data.fechaCreacion?.toDate().toISOString(),
        fechaUltimoAcceso: data.fechaUltimoAcceso?.toDate().toISOString()
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
 * Obtener un cliente por ID
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
        error: 'Cliente no encontrado'
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
    const estadisticas = {
      clientes: {
        total: clientes.length,
        activos: clientes.filter(c => c.estado === 'activo').length,
        suspendidos: clientes.filter(c => c.estado === 'suspendido').length,
        cancelados: clientes.filter(c => c.estado === 'cancelado').length
      },
      suscripciones: {
        activas: clientes.filter(c => c.estadoSuscripcion === 'activa').length,
        pendientes: clientes.filter(c => c.estadoSuscripcion === 'pendiente').length,
        canceladas: clientes.filter(c => c.estadoSuscripcion === 'cancelada').length,
        vencidas: clientes.filter(c => c.estadoSuscripcion === 'vencida').length
      },
      planes: {
        basico: clientes.filter(c => c.planSeleccionado?.includes('Básico')).length,
        estandar: clientes.filter(c => c.planSeleccionado?.includes('Estándar')).length,
        premium: clientes.filter(c => c.planSeleccionado?.includes('Premium')).length
      },
      solicitudes: {
        total: solicitudes.length,
        pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
        contactadas: solicitudes.filter(s => s.estado === 'contactado').length,
        procesadas: solicitudes.filter(s => s.estado === 'procesado').length,
        rechazadas: solicitudes.filter(s => s.estado === 'rechazado').length
      },
      ingresos: {
        mensual: calcularIngresosMensuales(clientes)
      }
    }

    res.status(200).json({
      success: true,
      estadisticas
    })
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error)
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      mensaje: 'Ocurrió un error al obtener las estadísticas'
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
      .orderBy('fechaCreacion', 'desc')

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
        mensaje: data.mensaje,
        estado: data.estado,
        clienteId: data.clienteId,
        stripeSessionId: data.stripeSessionId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        fechaSolicitud: data.fechaCreacion?.toDate().toISOString(),
        fechaCreacion: data.fechaCreacion?.toDate().toISOString(),
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

/**
 * Actualizar estado de una solicitud
 * PATCH /api/admin/solicitudes/:id/estado
 */
export const updateSolicitudEstado = async (req, res) => {
  try {
    const { id } = req.params
    const { estado, notas } = req.body

    // Validar estado
    const estadosValidos = ['pendiente', 'contactado', 'procesado', 'rechazado']
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
      .collection('solicitudes')
      .doc(id)
      .update({
        estado: estado,
        notas: notas || null,
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
        actualizadoPor: req.user.userId
      })



    res.status(200).json({
      success: true,
      mensaje: 'Estado de solicitud actualizado exitosamente'
    })
  } catch (error) {
    console.error('❌ Error al actualizar estado de solicitud:', error)
    res.status(500).json({
      success: false,
      error: 'Error al actualizar estado',
      mensaje: 'Ocurrió un error al actualizar el estado de la solicitud'
    })
  }
}

/**
 * Crear cliente desde una solicitud aprobada
 * POST /api/admin/solicitudes/:id/crear-cliente
 */
export const crearClienteDesdeSolicitud = async (req, res) => {
  try {
    const { id: solicitudId } = req.params



    const db = getFirestore()

    // 1. Obtener la solicitud
    const solicitudDoc = await db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes')
      .doc(solicitudId)
      .get()

    if (!solicitudDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      })
    }

    const solicitud = solicitudDoc.data()

    // 2. Verificar que no tenga ya un cliente
    if (solicitud.clienteId) {
      return res.status(400).json({
        success: false,
        error: 'Solicitud ya procesada',
        mensaje: 'Esta solicitud ya tiene un cliente asociado',
        clienteId: solicitud.clienteId
      })
    }

    // 3. Generar usuario único basado en email
    const emailBase = solicitud.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
    const usuarioBase = emailBase.substring(0, 15) // Máximo 15 caracteres
    const usuarioUnico = await generarUsuarioUnico(usuarioBase)

    // 4. Generar contraseña temporal segura
    const passwordTemporal = generarPasswordTemporal()
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(passwordTemporal, salt)



    // 5. Crear cliente
    const datosCliente = {
      nombreCompleto: solicitud.nombrePropietario,
      email: solicitud.email,
      telefono: solicitud.telefono,
      nombreSalon: solicitud.nombreSalon,
      usuario: usuarioUnico,
      passwordHash: passwordHash,
      solicitudId: solicitudId,
      planSeleccionado: solicitud.plan
    }

    const resultadoCliente = await crearCliente(datosCliente)
    const clienteId = resultadoCliente.id



    // 6. Vincular solicitud con cliente
    await vincularClienteSolicitud(solicitudId, clienteId)

    // 7. Actualizar estado de solicitud a "procesado"
    await db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes')
      .doc(solicitudId)
      .update({
        estado: 'procesado',
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
        actualizadoPor: req.user.userId
      })



    // 8. Enviar email con credenciales (no esperar)
    enviarEmailCredencialesCliente({
      email: solicitud.email,
      nombreCompleto: solicitud.nombrePropietario,
      nombreSalon: solicitud.nombreSalon,
      usuario: usuarioUnico,
      passwordTemporal: passwordTemporal,
      plan: solicitud.plan
    })

      .catch(error => console.error('⚠️  Error al enviar email:', error.message))

    // 9. Responder con éxito
    res.status(201).json({
      success: true,
      mensaje: 'Cliente creado exitosamente',
      data: {
        clienteId: clienteId,
        usuario: usuarioUnico,
        passwordTemporal: passwordTemporal, // Solo para mostrar al admin
        email: solicitud.email,
        nombreSalon: solicitud.nombreSalon
      }
    })
  } catch (error) {
    console.error('❌ Error al crear cliente desde solicitud:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Error al crear cliente',
      mensaje: 'Ocurrió un error al crear el cliente. Por favor, intenta nuevamente.'
    })
  }
}

/**
 * Generar contraseña temporal segura
 * Formato: 3 palabras + 2 números (ej: Luna-Gato-Mar-42)
 */
function generarPasswordTemporal() {
  const palabras = [
    'Sol', 'Luna', 'Mar', 'Rio', 'Luz', 'Flor', 'Gato', 'Perro',
    'Cielo', 'Nube', 'Arbol', 'Cafe', 'Libro', 'Silla', 'Mesa', 'Casa'
  ]

  const palabra1 = palabras[Math.floor(Math.random() * palabras.length)]
  const palabra2 = palabras[Math.floor(Math.random() * palabras.length)]
  const palabra3 = palabras[Math.floor(Math.random() * palabras.length)]
  const numeros = Math.floor(Math.random() * 90) + 10 // 10-99

  return `${palabra1}-${palabra2}-${palabra3}-${numeros}`
}

/**
 * Confirmar pago y crear cliente con acceso a onboarding
 * POST /api/admin/solicitudes/:id/confirmar-pago
 */
export const confirmarPagoYCrearCliente = async (req, res) => {
  try {
    const { id: solicitudId } = req.params



    const db = getFirestore()

    // 1. Obtener la solicitud inicial
    const solicitudDoc = await db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes')
      .doc(solicitudId)
      .get()

    if (!solicitudDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      })
    }

    const solicitud = solicitudDoc.data()

    // 2. Verificar que no tenga ya un cliente
    if (solicitud.clienteId) {
      return res.status(400).json({
        success: false,
        error: 'Solicitud ya procesada',
        mensaje: 'Esta solicitud ya tiene un cliente asociado',
        clienteId: solicitud.clienteId
      })
    }

    // 3. Generar usuario único basado en email
    const emailBase = solicitud.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
    const usuarioBase = emailBase.substring(0, 15)
    const usuarioUnico = await generarUsuarioUnico(usuarioBase)

    // 4. Generar contraseña temporal segura
    const passwordTemporal = generarPasswordTemporal()
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(passwordTemporal, salt)



    // 4.5. Generar salonId basado en nombreSalon
    const salonIdBase = solicitud.nombreSalon
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con guión
      .replace(/^-+|-+$/g, '') // Quitar guiones al inicio/final
      .substring(0, 30) // Máximo 30 caracteres

    const salonId = await generarSalonIdUnico(salonIdBase)


    // 5. Crear cliente con estado pendiente_onboarding
    const datosCliente = {
      nombreCompleto: solicitud.nombrePropietario,
      email: solicitud.email,
      telefono: solicitud.telefono,
      nombreSalon: solicitud.nombreSalon,
      usuario: usuarioUnico,
      passwordHash: passwordHash,
      solicitudId: solicitudId,
      planSeleccionado: solicitud.plan,
      estado: 'pendiente_onboarding', // ✅ Estado especial para onboarding
      salonId: salonId, // ✅ Ahora incluye el salonId pre-generado
      estadoSuscripcion: 'activa'
    }

    const resultadoCliente = await crearCliente(datosCliente)
    const clienteId = resultadoCliente.id



    // 6. Vincular solicitud con cliente
    await vincularClienteSolicitud(solicitudId, clienteId)

    // 7. Actualizar estado de solicitud a "pago_confirmado"
    await db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes')
      .doc(solicitudId)
      .update({
        estado: 'pago_confirmado',
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
        actualizadoPor: req.user?.userId || 'admin'
      })



    // 8. Enviar email con credenciales y link a onboarding (no esperar)
    enviarEmailCredencialesOnboarding({
      email: solicitud.email,
      nombreCompleto: solicitud.nombrePropietario,
      nombreSalon: solicitud.nombreSalon,
      salonId: salonId, // ✅ Incluir dominio del salón
      usuario: solicitud.email, // Usamos email como usuario
      passwordTemporal: passwordTemporal,
      plan: solicitud.plan
    })

      .catch(error => console.error('⚠️  Error al enviar email:', error.message))

    // 9. Responder con éxito
    res.status(201).json({
      success: true,
      mensaje: 'Cliente creado exitosamente. Email de acceso enviado.',
      data: {
        clienteId: clienteId,
        usuario: solicitud.email,
        passwordTemporal: passwordTemporal, // Solo para mostrar al admin
        email: solicitud.email,
        nombreSalon: solicitud.nombreSalon,
        estado: 'pendiente_onboarding'
      }
    })
  } catch (error) {
    console.error('❌ Error al confirmar pago y crear cliente:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Error al crear cliente',
      mensaje: 'Ocurrió un error al procesar la confirmación de pago.'
    })
  }
}

export default {
  getClientes,
  getClienteById,
  updateClienteEstado,
  getEstadisticas,
  getSolicitudesAdmin,
  updateSolicitudEstado,
  crearClienteDesdeSolicitud,
  confirmarPagoYCrearCliente
}
