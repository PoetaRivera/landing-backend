import {
  guardarSolicitudSuscripcion,
  obtenerSolicitudes,
  actualizarEstadoSolicitud,
  vincularClienteSolicitud,
  generarUsuarioUnico,
  crearCliente
} from '../config/firebase.js'

import {
  enviarEmailNuevaSolicitud,
  enviarEmailConfirmacionCliente,
  enviarEmailCredencialesCliente
} from '../config/email.js'

import { generarCredencialesCliente } from '../utils/clienteUtils.js'
import bcrypt from 'bcryptjs'

/**
 * Crear una nueva solicitud de suscripción + Auto-registro de cliente
 * POST /api/suscripciones
 *
 * Flujo:
 * 1. Guardar solicitud en Firestore
 * 2. Generar credenciales únicas para el cliente
 * 3. Crear cliente en Firestore con credenciales hasheadas
 * 4. Vincular solicitud con cliente
 * 5. Enviar 3 emails: admin, confirmación, credenciales
 */
export const crearSolicitud = async (req, res) => {
  try {
    const datosSolicitud = req.body

    console.log('📝 Nueva solicitud de suscripción:', {
      salon: datosSolicitud.nombreSalon,
      email: datosSolicitud.email,
      plan: datosSolicitud.plan
    })

    // PASO 1: Guardar solicitud en Firestore
    const resultadoSolicitud = await guardarSolicitudSuscripcion(datosSolicitud)
    const solicitudId = resultadoSolicitud.id

    console.log(`✅ Solicitud guardada con ID: ${solicitudId}`)

    // PASO 2: Generar credenciales únicas para el cliente
    const credenciales = generarCredencialesCliente(datosSolicitud)
    const usuarioBase = credenciales.usuario
    const usuarioUnico = await generarUsuarioUnico(usuarioBase)

    console.log(`🔑 Usuario generado: ${usuarioUnico}`)

    // PASO 3: Hashear la contraseña temporal
    const passwordHash = await bcrypt.hash(credenciales.passwordTemporal, 10)

    // PASO 4: Crear cliente en Firestore
    const datosCliente = {
      nombreCompleto: datosSolicitud.nombrePropietario,
      email: datosSolicitud.email,
      telefono: datosSolicitud.telefono,
      nombreSalon: datosSolicitud.nombreSalon,
      usuario: usuarioUnico,
      passwordHash: passwordHash,
      solicitudId: solicitudId,
      planSeleccionado: datosSolicitud.plan
    }

    const resultadoCliente = await crearCliente(datosCliente)
    const clienteId = resultadoCliente.id

    console.log(`✅ Cliente creado con ID: ${clienteId}`)

    // PASO 5: Vincular solicitud con cliente
    await vincularClienteSolicitud(solicitudId, clienteId)

    console.log(`✅ Solicitud ${solicitudId} vinculada con cliente ${clienteId}`)

    // PASO 6: Enviar emails en paralelo (no bloquean la respuesta)
    Promise.all([
      enviarEmailNuevaSolicitud(datosSolicitud),
      enviarEmailConfirmacionCliente(datosSolicitud),
      enviarEmailCredencialesCliente(
        {
          nombreCompleto: datosSolicitud.nombrePropietario,
          email: datosSolicitud.email,
          nombreSalon: datosSolicitud.nombreSalon
        },
        {
          usuario: usuarioUnico,
          passwordTemporal: credenciales.passwordTemporal
        }
      )
    ])
      .then(() => {
        console.log('✅ Todos los emails enviados correctamente')
      })
      .catch(error => {
        console.error('⚠️  Error al enviar algunos emails (solicitud y cliente creados exitosamente):', error.message)
      })

    // PASO 7: Responder al cliente inmediatamente
    res.status(201).json({
      success: true,
      mensaje: '¡Solicitud recibida correctamente! Revisa tu email para acceder con tus credenciales.',
      data: {
        solicitudId: solicitudId,
        clienteId: clienteId,
        usuario: usuarioUnico
      }
    })

  } catch (error) {
    console.error('❌ Error al crear solicitud y cliente:', error)

    // Manejo de errores específicos
    let mensajeError = 'Hubo un problema al procesar tu solicitud. Por favor, intenta nuevamente.'

    if (error.message === 'Ya existe un cliente con ese email') {
      mensajeError = 'Ya existe una cuenta con ese email. Por favor, contacta a soporte si necesitas ayuda.'
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar la solicitud',
      mensaje: mensajeError
    })
  }
}

/**
 * Obtener todas las solicitudes (con filtros opcionales)
 * GET /api/suscripciones
 */
export const getSolicitudes = async (req, res) => {
  try {
    const { estado, plan, limite } = req.query

    const filtros = {}
    if (estado) filtros.estado = estado
    if (plan) filtros.plan = plan
    if (limite) filtros.limite = parseInt(limite)

    const solicitudes = await obtenerSolicitudes(filtros)

    res.status(200).json({
      success: true,
      total: solicitudes.length,
      solicitudes
    })

  } catch (error) {
    console.error('❌ Error al obtener solicitudes:', error)

    res.status(500).json({
      success: false,
      error: 'Error al obtener las solicitudes'
    })
  }
}

/**
 * Actualizar el estado de una solicitud
 * PATCH /api/suscripciones/:id
 */
export const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params
    const { estado, notas } = req.body

    await actualizarEstadoSolicitud(id, estado, notas)

    res.status(200).json({
      success: true,
      mensaje: 'Estado actualizado correctamente'
    })

  } catch (error) {
    console.error('❌ Error al actualizar estado:', error)

    res.status(500).json({
      success: false,
      error: 'Error al actualizar el estado'
    })
  }
}

/**
 * Estadísticas de solicitudes
 * GET /api/suscripciones/stats
 */
export const getEstadisticas = async (req, res) => {
  try {
    const todasSolicitudes = await obtenerSolicitudes({})

    const stats = {
      total: todasSolicitudes.length,
      porEstado: {
        pendiente: todasSolicitudes.filter(s => s.estado === 'pendiente').length,
        contactado: todasSolicitudes.filter(s => s.estado === 'contactado').length,
        procesado: todasSolicitudes.filter(s => s.estado === 'procesado').length,
        rechazado: todasSolicitudes.filter(s => s.estado === 'rechazado').length
      },
      porPlan: {}
    }

    // Contar por plan
    todasSolicitudes.forEach(solicitud => {
      const plan = solicitud.plan || 'Sin especificar'
      stats.porPlan[plan] = (stats.porPlan[plan] || 0) + 1
    })

    res.status(200).json({
      success: true,
      estadisticas: stats
    })

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error)

    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    })
  }
}

export default {
  crearSolicitud,
  getSolicitudes,
  actualizarEstado,
  getEstadisticas
}
