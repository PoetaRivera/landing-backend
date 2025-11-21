/**
 * Controlador de Solicitudes Completas (Formulario de Onboarding)
 * Gestiona solicitudes con toda la información del salón para creación automática
 */

import { getFirestore } from '../config/firebase.js'
import admin from 'firebase-admin'
import bcrypt from 'bcryptjs'
import {
  crearCliente,
  vincularClienteSolicitud,
  generarUsuarioUnico
} from '../config/firebase.js'
import { enviarEmailCredencialesCliente } from '../config/email.js'
import { crearSalonCompleto } from '../utils/crearSalonCompleto.js'

/**
 * Crear solicitud completa con toda la información del salón
 * POST /api/solicitudes-completas
 */
export const crearSolicitudCompleta = async (req, res) => {
  try {
    const datosFormulario = req.body

    console.log('📝 Creando solicitud completa...')

    const db = getFirestore()

    // Estructura de la solicitud completa
    const solicitudCompleta = {
      // Paso 1: Información Básica
      nombreSalon: datosFormulario.nombreSalon,
      nombrePropietario: datosFormulario.nombrePropietario,
      email: datosFormulario.email,
      telefono: datosFormulario.telefono,
      direccion: datosFormulario.direccion || '',
      ciudad: datosFormulario.ciudad || '',
      pais: datosFormulario.pais || 'El Salvador',

      // Paso 2: Plan Seleccionado
      plan: datosFormulario.plan,

      // Paso 3: Branding y Logo
      logo: datosFormulario.logo || null, // URL de Cloudinary
      nombreEmpresa: datosFormulario.nombreEmpresa || datosFormulario.nombreSalon,
      slogan: datosFormulario.slogan || '',

      // Paso 4: Paleta de Colores
      paletaId: datosFormulario.paletaId || 'paleta1',
      coloresPersonalizados: datosFormulario.coloresPersonalizados || null,

      // Paso 5: Servicios
      servicios: datosFormulario.servicios || [], // Array de {nombre, descripcion, precio, duracion, activo}

      // Paso 6: Productos
      productos: datosFormulario.productos || [], // Array de {nombre, descripcion, precio, stock, activo, imagen}

      // Paso 7: Estilistas
      estilistas: datosFormulario.estilistas || [], // Array de {nombre, especialidad, imagen, activo}

      // Paso 8: Imágenes del Salón
      imagenesCarrusel: datosFormulario.imagenesCarrusel || [], // URLs de Cloudinary
      imagenPrincipal: datosFormulario.imagenPrincipal || null,

      // Paso 9: Configuración General
      configuracion: {
        horarios: datosFormulario.horarios || {
          lunes: { abierto: true, inicio: '09:00', fin: '18:00' },
          martes: { abierto: true, inicio: '09:00', fin: '18:00' },
          miercoles: { abierto: true, inicio: '09:00', fin: '18:00' },
          jueves: { abierto: true, inicio: '09:00', fin: '18:00' },
          viernes: { abierto: true, inicio: '09:00', fin: '18:00' },
          sabado: { abierto: true, inicio: '09:00', fin: '14:00' },
          domingo: { abierto: false, inicio: '', fin: '' }
        },
        ubicacionMaps: datosFormulario.ubicacionMaps || '',
        telefono: datosFormulario.telefono,
        email: datosFormulario.email,
        redesSociales: {
          facebook: datosFormulario.facebook || '',
          instagram: datosFormulario.instagram || '',
          whatsapp: datosFormulario.whatsapp || ''
        },
        duracionesPorDefecto: datosFormulario.duracionesPorDefecto || {
          '30min': '00:30',
          '1h': '01:00',
          '1h30min': '01:30',
          '2h': '02:00',
          '2h30min': '02:30',
          '3h': '03:00'
        }
      },

      // Metadatos
      estado: 'pendiente_revision', // pendiente_revision, aprobado, en_proceso, completado, rechazado
      tipo: 'solicitud_completa',
      origen: 'formulario_onboarding',
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      fechaActualizacion: admin.firestore.FieldValue.serverTimestamp(),

      // Referencias (se llenan después)
      clienteId: null,
      salonId: null,
      notas: datosFormulario.notas || '',
      mensaje: datosFormulario.mensaje || ''
    }

    // Guardar en Firestore
    const docRef = await db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes_completas')
      .add(solicitudCompleta)

    console.log(`✅ Solicitud completa creada: ${docRef.id}`)

    // TODO: Enviar email de confirmación al cliente
    // TODO: Enviar email de notificación al admin

    res.status(201).json({
      success: true,
      mensaje: 'Solicitud completa recibida exitosamente',
      data: {
        solicitudId: docRef.id
      }
    })
  } catch (error) {
    console.error('❌ Error al crear solicitud completa:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Error al crear solicitud',
      mensaje: 'Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.'
    })
  }
}

/**
 * Obtener todas las solicitudes completas con filtros
 * GET /api/admin/solicitudes-completas
 */
export const getSolicitudesCompletas = async (req, res) => {
  try {
    const { estado, limite = 50, offset = 0 } = req.query

    console.log('📋 Obteniendo solicitudes completas con filtros:', { estado, limite, offset })

    const db = getFirestore()
    let query = db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes_completas')
      .orderBy('fechaCreacion', 'desc')

    // Aplicar filtros
    if (estado) {
      query = query.where('estado', '==', estado)
    }

    // Aplicar límite
    query = query.limit(parseInt(limite))

    // Aplicar offset
    if (parseInt(offset) > 0) {
      query = query.offset(parseInt(offset))
    }

    const snapshot = await query.get()

    console.log(`✅ Solicitudes completas encontradas: ${snapshot.size}`)

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
        salonId: data.salonId,
        cantidadServicios: data.servicios?.length || 0,
        cantidadProductos: data.productos?.length || 0,
        cantidadEstilistas: data.estilistas?.length || 0,
        cantidadImagenes: data.imagenesCarrusel?.length || 0,
        fechaCreacion: data.fechaCreacion?.toDate().toISOString(),
        fechaActualizacion: data.fechaActualizacion?.toDate().toISOString()
      })
    })

    res.status(200).json({
      success: true,
      total: solicitudes.length,
      solicitudes
    })
  } catch (error) {
    console.error('❌ Error al obtener solicitudes completas:', error)
    res.status(500).json({
      success: false,
      error: 'Error al obtener solicitudes',
      mensaje: 'Ocurrió un error al obtener la lista de solicitudes'
    })
  }
}

/**
 * Obtener solicitud completa por ID
 * GET /api/admin/solicitudes-completas/:id
 */
export const getSolicitudCompletaById = async (req, res) => {
  try {
    const { id } = req.params

    console.log(`📋 Obteniendo solicitud completa: ${id}`)

    const db = getFirestore()
    const solicitudDoc = await db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes_completas')
      .doc(id)
      .get()

    if (!solicitudDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      })
    }

    const data = solicitudDoc.data()

    res.status(200).json({
      success: true,
      solicitud: {
        id: solicitudDoc.id,
        ...data,
        fechaCreacion: data.fechaCreacion?.toDate().toISOString(),
        fechaActualizacion: data.fechaActualizacion?.toDate().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Error al obtener solicitud completa:', error)
    res.status(500).json({
      success: false,
      error: 'Error al obtener solicitud',
      mensaje: 'Ocurrió un error al obtener la solicitud'
    })
  }
}

/**
 * Crear salón completo automáticamente desde solicitud
 * POST /api/admin/solicitudes-completas/:id/crear-salon
 */
export const crearSalonDesdeSolicitudCompleta = async (req, res) => {
  try {
    const { id: solicitudId } = req.params

    console.log(`🏢 Creando salón completo desde solicitud: ${solicitudId}`)

    const db = getFirestore()

    // 1. Obtener la solicitud completa
    const solicitudDoc = await db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes_completas')
      .doc(solicitudId)
      .get()

    if (!solicitudDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      })
    }

    const solicitud = solicitudDoc.data()

    // 2. Verificar que no esté ya procesada
    if (solicitud.salonId) {
      return res.status(400).json({
        success: false,
        error: 'Solicitud ya procesada',
        mensaje: 'Esta solicitud ya tiene un salón creado',
        salonId: solicitud.salonId
      })
    }

    // 3. Generar salonId único
    const salonIdBase = solicitud.nombreSalon
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20)

    const salonId = await generarSalonIdUnico(salonIdBase)

    console.log(`🆔 SalonId generado: ${salonId}`)

    // 4. Crear cliente con usuario y contraseña
    const emailBase = solicitud.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
    const usuarioBase = emailBase.substring(0, 15)
    const usuarioUnico = await generarUsuarioUnico(usuarioBase)
    const passwordTemporal = generarPasswordTemporal()
    const passwordHash = await bcrypt.hash(passwordTemporal, 10)

    const datosCliente = {
      nombreCompleto: solicitud.nombrePropietario,
      email: solicitud.email,
      telefono: solicitud.telefono,
      nombreSalon: solicitud.nombreSalon,
      usuario: usuarioUnico,
      passwordHash: passwordHash,
      solicitudId: solicitudId,
      planSeleccionado: solicitud.plan,
      salonId: salonId,
      estado: 'activo',
      estadoSuscripcion: 'pendiente'
    }

    const resultadoCliente = await crearCliente(datosCliente)
    const clienteId = resultadoCliente.id

    console.log(`✅ Cliente creado: ${clienteId}`)

    // 5. Crear estructura COMPLETA del salón en el proyecto principal
    console.log(`🏗️  Creando salón completo en el sistema principal...`)

    const resultadoSalon = await crearSalonCompleto(solicitud, salonId)

    console.log(`✅ Salón creado exitosamente: ${salonId}`)
    console.log(`   - Estilistas creados: ${resultadoSalon.estilistas}`)
    console.log(`   - Password admin: ${resultadoSalon.adminPassword}`)

    // 6. Actualizar solicitud
    await db
      .collection('landing-page')
      .doc('data')
      .collection('solicitudes_completas')
      .doc(solicitudId)
      .update({
        estado: 'completado',
        clienteId: clienteId,
        salonId: salonId,
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
        actualizadoPor: req.user?.userId || 'admin'
      })

    // 7. Vincular cliente con solicitud
    await vincularClienteSolicitud(solicitudId, clienteId)

    // 8. Enviar email con credenciales del admin del salón (async)
    enviarEmailCredencialesCliente({
      email: solicitud.email,
      nombreCompleto: solicitud.nombrePropietario,
      nombreSalon: solicitud.nombreSalon,
      usuario: solicitud.email,
      passwordTemporal: resultadoSalon.adminPassword,
      plan: solicitud.plan
    })
      .then(() => console.log('✅ Email con credenciales enviado'))
      .catch(error => console.error('⚠️  Error al enviar email:', error.message))

    // 9. Responder con éxito
    res.status(201).json({
      success: true,
      mensaje: 'Salón creado exitosamente en el sistema principal',
      data: {
        salonId: salonId,
        clienteId: clienteId,
        usuario: solicitud.email,
        passwordTemporal: resultadoSalon.adminPassword,
        email: solicitud.email,
        nombreSalon: solicitud.nombreSalon,
        estilistas: resultadoSalon.estilistas,
        nota: 'El salón está completamente creado y operativo. Las reservas se generarán automáticamente por el cron job.'
      }
    })
  } catch (error) {
    console.error('❌ Error al crear salón desde solicitud:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Error al crear salón',
      mensaje: 'Ocurrió un error al crear el salón. Por favor, intenta nuevamente.'
    })
  }
}

/**
 * Generar salonId único
 */
async function generarSalonIdUnico(salonIdBase) {
  const db = getFirestore()

  // Verificar si el salonId base está disponible
  let salonId = salonIdBase
  let contador = 1

  while (true) {
    const existeEnPendientes = await db
      .collection('landing-page')
      .doc('data')
      .collection('salones_pendientes')
      .doc(salonId)
      .get()

    if (!existeEnPendientes.exists) {
      // También verificar en salones_map del proyecto principal
      // Por ahora solo verificamos en pendientes
      return salonId
    }

    // Si existe, agregar número
    salonId = `${salonIdBase}${contador}`
    contador++
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

export default {
  crearSolicitudCompleta,
  getSolicitudesCompletas,
  getSolicitudCompletaById,
  crearSalonDesdeSolicitudCompleta
}
