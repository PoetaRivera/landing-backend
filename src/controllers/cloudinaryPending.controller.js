/**
 * Controlador para gestionar recursos pendientes en Cloudinary
 * Índice en Firestore de lo que existe en Cloudinary
 */

import { getFirestore } from '../config/firebase.js'
import admin from 'firebase-admin'
import { generateSalonId, validateSalonId } from '../utils/generateSalonId.js'
import cloudinary from '../config/cloudinary.js'

/**
 * Generar nuevo salonId
 * GET /api/cloudinary-pending/generate-id
 */
export const generarSalonId = async (req, res) => {
  try {
    const salonId = generateSalonId()

    console.log(`✨ SalonId generado: ${salonId}`)

    res.status(200).json({
      success: true,
      data: {
        salonId
      }
    })
  } catch (error) {
    console.error('❌ Error generando salonId:', error)
    res.status(500).json({
      success: false,
      error: 'Error al generar salonId',
      mensaje: error.message
    })
  }
}

/**
 * Guardar/Actualizar URLs de recursos en cloudinary-pending
 * POST /api/cloudinary-pending
 * Body: { salonId, tipo, url }
 */
export const guardarRecurso = async (req, res) => {
  try {
    const { salonId, tipo, url, solicitudId } = req.body

    // Validar salonId
    if (!validateSalonId(salonId)) {
      return res.status(400).json({
        success: false,
        error: 'salonId inválido',
        mensaje: 'El formato del salonId no es válido'
      })
    }

    // Validar tipo
    const tiposValidos = ['logo', 'productos', 'servicios', 'carrusel', 'estilistas']
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo inválido',
        mensaje: `Tipo debe ser uno de: ${tiposValidos.join(', ')}`
      })
    }

    // Validar URL
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'URL inválida',
        mensaje: 'La URL es requerida y debe ser string'
      })
    }

    const db = getFirestore()
    const docRef = db.collection('landing-page').doc('data').collection('cloudinary-pending').doc(salonId)

    // Obtener documento actual
    const doc = await docRef.get()

    if (doc.exists) {
      // Actualizar documento existente
      const data = doc.data()

      if (tipo === 'logo') {
        // Logo es único
        await docRef.update({
          logo: url,
          fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
        })
      } else {
        // Productos, servicios, carrusel, estilistas son arrays
        const currentArray = data[tipo] || []
        currentArray.push(url)

        await docRef.update({
          [tipo]: currentArray,
          fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
        })
      }

      console.log(`✅ Recurso actualizado: ${salonId}/${tipo}`)
    } else {
      // Crear nuevo documento
      const newData = {
        salonId,
        solicitudId: solicitudId || null,
        logo: tipo === 'logo' ? url : '',
        productos: tipo === 'productos' ? [url] : [],
        servicios: tipo === 'servicios' ? [url] : [],
        carrusel: tipo === 'carrusel' ? [url] : [],
        estilistas: tipo === 'estilistas' ? [url] : [],
        estado: 'pendiente',
        fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      }

      await docRef.set(newData)

      console.log(`✅ Recurso creado: ${salonId}/${tipo}`)
    }

    res.status(200).json({
      success: true,
      mensaje: 'Recurso guardado exitosamente'
    })
  } catch (error) {
    console.error('❌ Error guardando recurso:', error)
    res.status(500).json({
      success: false,
      error: 'Error al guardar recurso',
      mensaje: error.message
    })
  }
}

/**
 * Obtener recursos de un salón
 * GET /api/cloudinary-pending/:salonId
 */
export const obtenerRecursos = async (req, res) => {
  try {
    const { salonId } = req.params

    if (!validateSalonId(salonId)) {
      return res.status(400).json({
        success: false,
        error: 'salonId inválido'
      })
    }

    const db = getFirestore()
    const doc = await db
      .collection('landing-page')
      .doc('data')
      .collection('cloudinary-pending')
      .doc(salonId)
      .get()

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Recursos no encontrados',
        mensaje: 'No existen recursos para este salonId'
      })
    }

    res.status(200).json({
      success: true,
      data: doc.data()
    })
  } catch (error) {
    console.error('❌ Error obteniendo recursos:', error)
    res.status(500).json({
      success: false,
      error: 'Error al obtener recursos',
      mensaje: error.message
    })
  }
}

/**
 * Eliminar recursos de Cloudinary y Firestore
 * DELETE /api/cloudinary-pending/:salonId
 */
export const eliminarRecursos = async (req, res) => {
  try {
    const { salonId } = req.params

    if (!validateSalonId(salonId)) {
      return res.status(400).json({
        success: false,
        error: 'salonId inválido'
      })
    }

    console.log(`🗑️  Eliminando recursos de ${salonId}...`)

    // 1. Eliminar de Cloudinary
    try {
      // Eliminar todos los recursos de la carpeta
      await cloudinary.api.delete_resources_by_prefix(salonId, {
        resource_type: 'image'
      })

      // Eliminar subcarpetas
      const folders = ['logos', 'productos', 'servicios', 'carrusel', 'estilistas']
      for (const folder of folders) {
        try {
          await cloudinary.api.delete_folder(`${salonId}/${folder}`)
        } catch (err) {
          // Ignorar si la carpeta no existe
          console.log(`⚠️  Carpeta no existe: ${salonId}/${folder}`)
        }
      }

      // Eliminar carpeta raíz
      try {
        await cloudinary.api.delete_folder(salonId)
      } catch (err) {
        console.log(`⚠️  Carpeta raíz no existe: ${salonId}`)
      }

      console.log(`✅ Recursos eliminados de Cloudinary: ${salonId}`)
    } catch (cloudinaryError) {
      console.error('⚠️  Error eliminando de Cloudinary:', cloudinaryError.message)
      // Continuar con Firestore aunque falle Cloudinary
    }

    // 2. Actualizar estado en Firestore (no eliminar, marcar como rechazado)
    const db = getFirestore()
    await db
      .collection('landing-page')
      .doc('data')
      .collection('cloudinary-pending')
      .doc(salonId)
      .update({
        estado: 'rechazado',
        fechaEliminacion: admin.firestore.FieldValue.serverTimestamp()
      })

    console.log(`✅ Estado actualizado en Firestore: ${salonId}`)

    res.status(200).json({
      success: true,
      mensaje: 'Recursos eliminados exitosamente'
    })
  } catch (error) {
    console.error('❌ Error eliminando recursos:', error)
    res.status(500).json({
      success: false,
      error: 'Error al eliminar recursos',
      mensaje: error.message
    })
  }
}

export default {
  generarSalonId,
  guardarRecurso,
  obtenerRecursos,
  eliminarRecursos
}
