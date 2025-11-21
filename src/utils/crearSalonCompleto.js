/**
 * Utilidad para crear un salón completo en el sistema principal
 * Basado en crearNuevoSalon.js del backend principal
 */

import admin from 'firebase-admin'
import { getFirestore } from '../config/firebase.js'
import bcrypt from 'bcryptjs'

/**
 * Crear estructura completa de salón en Firestore
 * @param {Object} solicitud - Datos de la solicitud completa
 * @param {string} salonId - ID único del salón
 * @returns {Promise<Object>} - Resultado de la creación
 */
export async function crearSalonCompleto(solicitud, salonId) {
  try {
    console.log(`\n${"=".repeat(70)}`)
    console.log(`🏗️  CREANDO SALÓN COMPLETO: ${salonId}`)
    console.log(`${"=".repeat(70)}\n`)

    const db = getFirestore()
    const batch = db.batch()

    // =====================================================================
    // 1. CREAR METADATA EN salones_map/{salonId}
    // =====================================================================
    console.log('📋 Creando metadata en salones_map...')

    const metadata = {
      nombreComercial: solicitud.nombreEmpresa || solicitud.nombreSalon,
      estado: 'activo',
      fechaCreacion: new Date().toISOString(),
      ultimaActualizacion: new Date().toISOString(),

      // Configuración de reservas
      configuracionReservas: {
        empleadosVenSoloSuyas: true
      },

      // Features habilitadas
      features: {
        realtimePrereservas: true,
        clientRegistration: true,
        employeeManagement: true,
        imageUpload: true,
        nailDesignGenerator: true,
        onlineBooking: true,
        productSales: true,
        reportGeneration: true,
        serviceBooking: true
      },

      // Dominios personalizados (vacío por defecto)
      dominios: [],

      // Notificaciones
      notificaciones: {
        emailHabilitado: false,
        emailQuota: 1000,
        emailUsados: 0,
        planPermiteEmail: true,
        ultimaActualizacion: new Date().toISOString()
      }
    }

    const salonesMapRef = db.collection('salones_map').doc(salonId)
    batch.set(salonesMapRef, metadata)

    console.log('✅ Metadata preparada')

    // =====================================================================
    // 2. CREAR DOCUMENTO PRINCIPAL en salones/{salonId}
    // =====================================================================
    console.log('📁 Creando documento principal...')

    const salonRef = db.collection('salones').doc(salonId)
    batch.set(salonRef, {
      existe: true,
      creadoEn: new Date().toISOString()
    })

    console.log('✅ Documento principal preparado')

    // =====================================================================
    // 3. CREAR CONFIGURACIÓN GENERAL
    // =====================================================================
    console.log('⚙️  Creando configuración general...')

    const configuracionRef = salonRef.collection('configuracion').doc('general')
    batch.set(configuracionRef, {
      horariosBase: {
        apertura: '05:00',
        cierre: '22:00'
      },

      branding: {
        logoUrl: solicitud.logo || '',
        paletaId: solicitud.paletaId || 'paleta1',
        customCSS: ''
      },

      ui: {
        maxEstilistasInicio: 6,
        maxProductosInicio: 6,
        maxServiciosInicio: 6,
        maxEstilistasReservas: 6,
        mostrarCarrusel: true,
        mostrarEstilistas: true,
        mostrarProductos: true,
        mostrarServicios: true,
        mostrarFooter: true
      }
    })

    console.log('✅ Configuración preparada')

    // =====================================================================
    // 4. CREAR DURACIONES
    // =====================================================================
    console.log('⏱️  Creando duraciones predefinidas...')

    const duraciones = [
      { id: 'duracion_1', duracion: '00:30' },
      { id: 'duracion_2', duracion: '01:00' },
      { id: 'duracion_3', duracion: '01:30' },
      { id: 'duracion_4', duracion: '02:00' },
      { id: 'duracion_5', duracion: '02:30' },
      { id: 'duracion_6', duracion: '03:00' }
    ]

    duraciones.forEach(dur => {
      const duracionRef = salonRef.collection('duracion').doc(dur.id)
      batch.set(duracionRef, { duracion: dur.duracion })
    })

    console.log('✅ Duraciones preparadas')

    // =====================================================================
    // 5. CREAR TÍTULOS
    // =====================================================================
    console.log('📝 Creando títulos...')

    const titulosRef = salonRef.collection('titulos').doc('titulo1')
    batch.set(titulosRef, {
      existe: true,
      titulocarrusel: `Bienvenidos a ${solicitud.nombreEmpresa || solicitud.nombreSalon}`,
      tituloestilistas: 'Nuestro equipo',
      tituloproductos: 'Nuestros productos',
      tituloservicios: 'Nuestros servicios',
      tituloinfo: 'Nuestra información'
    })

    console.log('✅ Títulos preparados')

    // =====================================================================
    // 6. CREAR FOOTER
    // =====================================================================
    console.log('🦶 Creando footer...')

    const horarios = solicitud.configuracion?.horarios || solicitud.horarios || {}

    const footRef = salonRef.collection('foot').doc('pie1')
    batch.set(footRef, {
      actualizadoEn: new Date().toISOString(),
      derechos: '© 2025 - Todos los derechos reservados',
      descripcion: solicitud.slogan || 'Tu salón de belleza de confianza',
      direccion: solicitud.direccion || 'Dirección del salón',
      email: solicitud.email,
      telefono: solicitud.telefono,
      whatsapp: solicitud.configuracion?.redesSociales?.whatsapp || solicitud.whatsapp || solicitud.telefono,
      eslogan: solicitud.slogan || 'Descansa mientras te embellecemos',
      nombre: solicitud.nombreEmpresa || solicitud.nombreSalon,

      horarios: {
        diasemana: {
          apertura: horarios.lunes?.inicio || '09:00 a.m.',
          cierre: horarios.lunes?.fin || '05:00 p.m.'
        },
        sabado: {
          apertura: horarios.sabado?.inicio || '09:00 a.m.',
          cierre: horarios.sabado?.fin || '07:00 p.m.'
        },
        domingo: {
          apertura: horarios.domingo?.abierto ? (horarios.domingo.inicio || '09:00 a.m.') : 'Cerrado',
          cierre: horarios.domingo?.abierto ? (horarios.domingo.fin || '03:00 p.m.') : 'Cerrado'
        }
      },

      redesSociales: {
        facebook: solicitud.configuracion?.redesSociales?.facebook || solicitud.facebook || '',
        instagram: solicitud.configuracion?.redesSociales?.instagram || solicitud.instagram || '',
        X: '',
        'tik tok': '',
        YouTube: ''
      },

      ubicacion: solicitud.configuracion?.ubicacionMaps || solicitud.ubicacionMaps || ''
    })

    console.log('✅ Footer preparado')

    // =====================================================================
    // 7. CREAR IMÁGENES CARRUSEL
    // =====================================================================
    console.log('🖼️  Creando referencias de imágenes...')

    const imagenesRef = salonRef.collection('imagenes').doc('urlcarrusel')
    batch.set(imagenesRef, {
      actualizadoEn: new Date().toISOString(),
      imagen1: solicitud.imagenesCarrusel?.[0] || '',
      imagen2: solicitud.imagenesCarrusel?.[1] || '',
      imagen3: solicitud.imagenesCarrusel?.[2] || '',
      imagen4: solicitud.imagenesCarrusel?.[3] || ''
    })

    console.log('✅ Imágenes preparadas')

    // =====================================================================
    // 8. EJECUTAR BATCH INICIAL
    // =====================================================================
    console.log('💾 Ejecutando batch inicial...')
    await batch.commit()
    console.log('✅ Batch inicial completado')

    // =====================================================================
    // 9. CREAR USUARIO ADMINISTRADOR
    // =====================================================================
    console.log('👤 Creando usuario administrador...')

    const passwordAdmin = 'admin123'
    const passwordHash = await bcrypt.hash(passwordAdmin, 10)

    const adminData = {
      esEstilista: false,
      alias: 'admin',
      nombres: solicitud.nombrePropietario?.split(' ')[0] || 'Administrador',
      apellidos: solicitud.nombrePropietario?.split(' ').slice(1).join(' ') || 'Principal',
      email: solicitud.email,
      movil: solicitud.telefono,
      rol: 'admin_salon',
      direccion: solicitud.direccion || '',
      fechaCumple: '',
      fechaCreacion: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
      salonAsignado: salonId,
      clave: passwordHash,
      datosEmpleado: {
        comision: 0,
        dui: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        nup: '',
        sueldo: 0
      }
    }

    await salonRef.collection('usuarios').add(adminData)
    console.log('✅ Usuario admin creado')

    // =====================================================================
    // 10. CREAR SERVICIOS
    // =====================================================================
    console.log('✂️  Creando servicios...')

    const serviciosFormulario = solicitud.servicios || []

    if (serviciosFormulario.length > 0) {
      for (const servicio of serviciosFormulario) {
        await salonRef.collection('servicios').add({
          activo: servicio.activo !== false,
          actualizadoEn: new Date().toISOString(),
          categoria: 'general',
          creadoEn: new Date().toISOString(),
          descripcion: servicio.descripcion || '',
          descripcionCorta: servicio.nombre?.substring(0, 20) || '',
          disponibleReserva: true,
          esNuevo: true,
          esOferta: false,
          duracion: servicio.duracion || '00:30',
          nombre: servicio.nombre,
          ordenMostrar: 0,
          precio: parseFloat(servicio.precio) || 10,
          precioOferta: 0,
          url: servicio.url || ''
        })
      }
      console.log(`✅ ${serviciosFormulario.length} servicios creados`)
    } else {
      // Servicio demo si no hay servicios
      await salonRef.collection('servicios').add({
        activo: true,
        actualizadoEn: new Date().toISOString(),
        categoria: 'general',
        creadoEn: new Date().toISOString(),
        descripcion: 'Corte de cabello profesional',
        descripcionCorta: 'Corte',
        disponibleReserva: true,
        esNuevo: true,
        esOferta: false,
        duracion: '00:30',
        nombre: 'Corte de Cabello',
        ordenMostrar: 0,
        precio: 10,
        precioOferta: 0,
        url: ''
      })
      console.log('✅ 1 servicio demo creado')
    }

    // =====================================================================
    // 11. CREAR PRODUCTOS
    // =====================================================================
    console.log('🛍️  Creando productos...')

    const productosFormulario = solicitud.productos || []

    if (productosFormulario.length > 0) {
      for (const producto of productosFormulario) {
        await salonRef.collection('productos').add({
          activo: producto.activo !== false,
          actualizadoEn: new Date().toISOString(),
          categoria: 'cuidado',
          creadoEn: new Date().toISOString(),
          descripcion: producto.descripcion || '',
          descripcionCorta: producto.nombre?.substring(0, 20) || '',
          disponibleVenta: true,
          esNuevo: true,
          esOferta: false,
          marca: producto.marca || '',
          nombre: producto.nombre,
          ordenMostrar: 0,
          precio: parseFloat(producto.precio) || 15,
          precioOferta: 0,
          sku: producto.sku || '',
          stock: producto.stock || 10,
          stockMinimo: producto.stockMinimo || 5,
          tags: [],
          url: producto.url || ''
        })
      }
      console.log(`✅ ${productosFormulario.length} productos creados`)
    } else {
      // Producto demo si no hay productos
      await salonRef.collection('productos').add({
        activo: true,
        actualizadoEn: new Date().toISOString(),
        categoria: 'cuidado',
        creadoEn: new Date().toISOString(),
        descripcion: 'Shampoo profesional para todo tipo de cabello',
        descripcionCorta: 'Shampoo',
        disponibleVenta: true,
        esNuevo: true,
        esOferta: false,
        marca: '',
        nombre: 'Shampoo Profesional',
        ordenMostrar: 0,
        precio: 15,
        precioOferta: 0,
        sku: '',
        stock: 10,
        stockMinimo: 5,
        tags: [],
        url: ''
      })
      console.log('✅ 1 producto demo creado')
    }

    // =====================================================================
    // 12. CREAR 6 ESTILISTAS INICIALES
    // =====================================================================
    console.log('💇 Creando 6 estilistas iniciales...')

    const estilistasCreados = []

    for (let i = 1; i <= 6; i++) {
      const estilistaData = {
        nombre: `Estilista ${i}`,
        relacion: `empleado${i}`,
        estilista: true,
        activo: true,
        usuarioId: '',
        especialidad: 'General',
        url: '',
        creadoEn: new Date().toISOString()
      }

      const docRef = await salonRef.collection('estilistas').add(estilistaData)
      estilistasCreados.push({ id: docRef.id, ...estilistaData })
    }

    console.log('✅ 6 estilistas creados')

    // =====================================================================
    // RESUMEN
    // =====================================================================
    console.log(`\n${"=".repeat(70)}`)
    console.log('✅ SALÓN CREADO EXITOSAMENTE')
    console.log(`${"=".repeat(70)}`)
    console.log(`\n📊 Resumen:`)
    console.log(`   - SalonID: ${salonId}`)
    console.log(`   - Nombre: ${solicitud.nombreSalon}`)
    console.log(`   - Admin: ${solicitud.nombrePropietario}`)
    console.log(`   - Email: ${solicitud.email}`)
    console.log(`   - Servicios: ${serviciosFormulario.length || 1}`)
    console.log(`   - Productos: ${productosFormulario.length || 1}`)
    console.log(`   - Estilistas: 6`)
    console.log(`\n⚠️  IMPORTANTE:`)
    console.log(`   - Las RESERVAS (slots) se generarán automáticamente por el cron job`)
    console.log(`   - La DISPONIBILIDAD se generará al crear las reservas`)
    console.log(`   - Las prereservas empiezan vacías`)
    console.log(`${"=".repeat(70)}\n`)

    return {
      success: true,
      salonId,
      adminPassword: passwordAdmin,
      estilistas: estilistasCreados.length
    }
  } catch (error) {
    console.error('❌ Error creando salón completo:', error)
    throw error
  }
}

export default { crearSalonCompleto }
