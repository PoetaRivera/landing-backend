/**
 * Controlador para subir imágenes a Cloudinary
 * Las imágenes se suben directamente a la estructura final del salón
 * y se registran en cloudinary-pending de Firestore
 */

import cloudinary from '../config/cloudinary.js'
import { getFirestore } from '../config/firebase.js'
import admin from 'firebase-admin'
import { validateSalonId } from '../utils/generateSalonId.js'

/**
 * Subir imagen a Cloudinary (estructura final del salón)
 * POST /api/upload
 * Body: file (multipart/form-data), folder (logos, carrusel, etc), salonId
 */
export const uploadImage = async (req, res) => {
  try {
    // Validar que se envió un archivo
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        error: 'No se recibió ningún archivo',
        mensaje: 'Por favor selecciona una imagen para subir'
      })
    }

    const file = req.files.file
    const folder = req.body.folder || 'general' // logos, carrusel, productos, servicios, estilistas
    const salonId = req.body.salonId

    // Validar salonId
    if (!salonId || !validateSalonId(salonId)) {
      return res.status(400).json({
        success: false,
        error: 'salonId requerido',
        mensaje: 'Debes proporcionar un salonId válido'
      })
    }

    console.log(`📤 Subiendo imagen a Cloudinary...`)
    console.log(`   Salón: ${salonId}`)
    console.log(`   Archivo: ${file.name}`)
    console.log(`   Tamaño: ${(file.size / 1024).toFixed(2)} KB`)
    console.log(`   Tipo: ${file.mimetype}`)
    console.log(`   Carpeta: ${salonId}/${folder}`)

    // Validar tipo de archivo (solo imágenes)
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'Archivo inválido',
        mensaje: 'Solo se permiten archivos de imagen (JPG, PNG, WebP, etc.)'
      })
    }

    // Validar tamaño máximo (5MB)
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        error: 'Archivo muy grande',
        mensaje: 'El tamaño máximo permitido es 5MB'
      })
    }

    // Generar nombre único
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 10000)}`

    // Determinar transformaciones según el tipo
    let transformation = []
    let quality = 'auto:best'

    if (folder === 'logos') {
      // Logos: cuadrado 600x600
      transformation = [{ width: 600, height: 600, crop: 'fill', gravity: 'auto' }]
      quality = 'auto:good'
    } else if (folder === 'carrusel') {
      // Carrusel: 1920px ancho máximo
      transformation = [{ width: 1920, crop: 'scale' }]
      quality = 'auto:good'
    } else {
      // General: 1200px ancho máximo
      transformation = [{ width: 1200, crop: 'scale' }]
      quality = 'auto:good'
    }

    // Subir a Cloudinary en estructura final
    const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: `${salonId}/${folder}`,
      public_id: uniqueName,
      quality,
      transformation,
      resource_type: 'auto'
    })

    console.log(`✅ Imagen subida exitosamente`)
    console.log(`   URL: ${uploadResult.secure_url}`)
    console.log(`   Public ID: ${uploadResult.public_id}`)

    // Guardar URL en cloudinary-pending
    try {
      const db = getFirestore()
      const docRef = db.collection('landing-page').doc('data').collection('cloudinary-pending').doc(salonId)

      const doc = await docRef.get()

      if (doc.exists) {
        // Actualizar documento existente
        const data = doc.data()

        if (folder === 'logos') {
          await docRef.update({
            logo: uploadResult.secure_url,
            fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
          })
        } else {
          const currentArray = data[folder] || []
          currentArray.push(uploadResult.secure_url)

          await docRef.update({
            [folder]: currentArray,
            fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
          })
        }
      } else {
        // Crear nuevo documento
        const newData = {
          salonId,
          logo: folder === 'logos' ? uploadResult.secure_url : '',
          productos: folder === 'productos' ? [uploadResult.secure_url] : [],
          servicios: folder === 'servicios' ? [uploadResult.secure_url] : [],
          carrusel: folder === 'carrusel' ? [uploadResult.secure_url] : [],
          estilistas: folder === 'estilistas' ? [uploadResult.secure_url] : [],
          estado: 'pendiente',
          fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
          fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
        }

        await docRef.set(newData)
      }

      console.log(`✅ URL guardada en cloudinary-pending: ${salonId}`)
    } catch (firestoreError) {
      console.error('⚠️  Error guardando en cloudinary-pending:', firestoreError)
      // Continuar aunque falle el guardado en Firestore
    }

    res.status(200).json({
      success: true,
      mensaje: 'Imagen subida exitosamente',
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        size: uploadResult.bytes
      }
    })
  } catch (error) {
    console.error('❌ Error subiendo imagen a Cloudinary:', error)

    res.status(500).json({
      success: false,
      error: 'Error al subir imagen',
      mensaje: error.message || 'Ocurrió un error al subir la imagen. Por favor, intenta nuevamente.'
    })
  }
}

/**
 * Subir múltiples imágenes a Cloudinary
 * POST /api/upload/multiple
 * Body: files[] (multipart/form-data), folder (opcional), salonId
 */
export const uploadMultipleImages = async (req, res) => {
  try {
    // Validar que se enviaron archivos
    if (!req.files || !req.files.files) {
      return res.status(400).json({
        success: false,
        error: 'No se recibieron archivos',
        mensaje: 'Por favor selecciona al menos una imagen para subir'
      })
    }

    const folder = req.body.folder || 'general'
    const salonId = req.body.salonId

    // Validar salonId
    if (!salonId || !validateSalonId(salonId)) {
      return res.status(400).json({
        success: false,
        error: 'salonId requerido',
        mensaje: 'Debes proporcionar un salonId válido'
      })
    }

    // Convertir a array si es un solo archivo
    const filesArray = Array.isArray(req.files.files) ? req.files.files : [req.files.files]

    console.log(`📤 Subiendo ${filesArray.length} imágenes a Cloudinary...`)
    console.log(`   Salón: ${salonId}`)
    console.log(`   Carpeta: ${salonId}/${folder}`)

    // Validar límite de archivos (máximo 4 para carrusel)
    if (filesArray.length > 4) {
      return res.status(400).json({
        success: false,
        error: 'Demasiados archivos',
        mensaje: 'Máximo 4 imágenes permitidas por solicitud'
      })
    }

    const uploadedImages = []
    const errors = []

    // Subir cada imagen
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i]

      try {
        // Validar tipo de archivo
        if (!file.mimetype.startsWith('image/')) {
          errors.push({
            file: file.name,
            error: 'Tipo de archivo inválido'
          })
          continue
        }

        // Validar tamaño
        const MAX_SIZE = 5 * 1024 * 1024 // 5MB
        if (file.size > MAX_SIZE) {
          errors.push({
            file: file.name,
            error: 'Archivo muy grande (máx 5MB)'
          })
          continue
        }

        // Generar nombre único
        const uniqueName = `${Date.now()}-${i}-${Math.round(Math.random() * 10000)}`

        // Transformaciones según tipo
        const transformation =
          folder === 'carrusel'
            ? [{ width: 1920, crop: 'scale' }]
            : [{ width: 1200, crop: 'scale' }]

        // Subir a estructura final del salón
        const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: `${salonId}/${folder}`,
          public_id: uniqueName,
          quality: 'auto:good',
          transformation,
          resource_type: 'auto'
        })

        uploadedImages.push({
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          size: uploadResult.bytes
        })

        console.log(`✅ Imagen ${i + 1}/${filesArray.length} subida`)
      } catch (error) {
        console.error(`❌ Error subiendo imagen ${i + 1}:`, error.message)
        errors.push({
          file: file.name,
          error: error.message
        })
      }
    }

    console.log(
      `✅ Proceso completado: ${uploadedImages.length} exitosas, ${errors.length} fallidas`
    )

    // Guardar URLs en cloudinary-pending si hubo uploads exitosos
    if (uploadedImages.length > 0) {
      try {
        const db = getFirestore()
        const docRef = db
          .collection('landing-page')
          .doc('data')
          .collection('cloudinary-pending')
          .doc(salonId)

        const doc = await docRef.get()
        const urls = uploadedImages.map((img) => img.url)

        if (doc.exists) {
          // Actualizar documento existente - agregar URLs al array
          const data = doc.data()
          const currentArray = data[folder] || []
          currentArray.push(...urls)

          await docRef.update({
            [folder]: currentArray,
            fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
          })
        } else {
          // Crear nuevo documento
          const newData = {
            salonId,
            logo: '',
            productos: folder === 'productos' ? urls : [],
            servicios: folder === 'servicios' ? urls : [],
            carrusel: folder === 'carrusel' ? urls : [],
            estilistas: folder === 'estilistas' ? urls : [],
            estado: 'pendiente',
            fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
            fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
          }

          await docRef.set(newData)
        }

        console.log(`✅ URLs guardadas en cloudinary-pending: ${salonId}/${folder}`)
      } catch (firestoreError) {
        console.error('⚠️  Error guardando en cloudinary-pending:', firestoreError)
        // Continuar aunque falle el guardado en Firestore
      }
    }

    res.status(200).json({
      success: true,
      mensaje: `${uploadedImages.length} imágenes subidas exitosamente`,
      data: {
        uploaded: uploadedImages,
        errors: errors.length > 0 ? errors : undefined,
        total: filesArray.length,
        successful: uploadedImages.length,
        failed: errors.length
      }
    })
  } catch (error) {
    console.error('❌ Error subiendo múltiples imágenes:', error)

    res.status(500).json({
      success: false,
      error: 'Error al subir imágenes',
      mensaje: error.message || 'Ocurrió un error al subir las imágenes'
    })
  }
}

export default {
  uploadImage,
  uploadMultipleImages
}
