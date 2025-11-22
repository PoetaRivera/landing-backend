/**
 * Configuración de Cloudinary para el Landing Page
 * Permite subir imágenes temporales y moverlas a la carpeta final del salón
 */

import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

dotenv.config()

// Configurar Cloudinary con variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

/**
 * Extraer publicId de una URL de Cloudinary
 * Ejemplo: https://res.cloudinary.com/xxx/image/upload/v123/landing-temp/logos/123456.jpg
 * Retorna: landing-temp/logos/123456
 */
export const extractPublicId = (url) => {
  if (!url) return null

  try {
    // Patrón para extraer el path después de /upload/
    const regex = /\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/
    const match = url.match(regex)

    if (match && match[1]) {
      return match[1]
    }

    return null
  } catch (error) {
    console.error('Error extrayendo publicId:', error)
    return null
  }
}

/**
 * Mover imagen de carpeta temporal a carpeta final del salón
 * @param {string} tempUrl - URL temporal de Cloudinary
 * @param {string} salonId - ID del salón
 * @param {string} folder - Carpeta destino (logos, carrusel, etc)
 * @param {string} filename - Nombre del archivo destino
 * @returns {Promise<string>} - URL final de la imagen movida
 */
export const moverImagenASalon = async (tempUrl, salonId, folder, filename) => {
  try {
    if (!tempUrl) {
      throw new Error('URL temporal requerida')
    }

    const publicId = extractPublicId(tempUrl)
    if (!publicId) {
      throw new Error('No se pudo extraer publicId de la URL')
    }

    // Nuevo publicId en la carpeta del salón
    const newPublicId = `${salonId}/${folder}/${filename}`

    console.log(`📦 Moviendo imagen:`)
    console.log(`   Origen: ${publicId}`)
    console.log(`   Destino: ${newPublicId}`)

    // Intentar renombrar (mover) la imagen
    try {
      const result = await cloudinary.uploader.rename(publicId, newPublicId, {
        overwrite: true,
        invalidate: true
      })

      console.log(`✅ Imagen movida exitosamente`)

      // Retornar nueva URL
      return result.secure_url
    } catch (renameError) {
      // Si falla el rename (porque la imagen ya no existe o ya fue movida),
      // intentar construir la URL manualmente
      console.warn('⚠️  No se pudo renombrar, verificando si ya existe...')

      // Verificar si la imagen ya existe en el destino
      try {
        const resource = await cloudinary.api.resource(newPublicId)
        console.log('✅ Imagen ya existe en destino, usando URL existente')
        return resource.secure_url
      } catch (checkError) {
        // Si no existe, copiar desde la URL temporal
        console.log('📋 Copiando imagen desde URL temporal...')
        const uploadResult = await cloudinary.uploader.upload(tempUrl, {
          folder: `${salonId}/${folder}`,
          public_id: filename,
          overwrite: true
        })
        return uploadResult.secure_url
      }
    }
  } catch (error) {
    console.error(`❌ Error moviendo imagen:`, error.message)
    throw error
  }
}

/**
 * Mover todas las imágenes de una solicitud a la carpeta del salón
 * @param {Object} solicitud - Solicitud completa con URLs temporales
 * @param {string} salonId - ID del salón
 * @returns {Promise<Object>} - { logo: string, carrusel: string[] }
 */
export const moverImagenesSolicitudASalon = async (solicitud, salonId) => {
  console.log(`\n🖼️  Moviendo imágenes de la solicitud al salón ${salonId}...`)

  const imagenesMovidas = {
    logo: '',
    carrusel: []
  }

  // 1. Mover logo
  if (solicitud.logo) {
    try {
      console.log(`📸 Moviendo logo...`)
      const logoUrl = await moverImagenASalon(solicitud.logo, salonId, 'logos', 'logo')
      imagenesMovidas.logo = logoUrl
      console.log(`✅ Logo movido: ${logoUrl}`)
    } catch (error) {
      console.error('❌ Error moviendo logo:', error.message)
      // Mantener URL original si falla
      imagenesMovidas.logo = solicitud.logo
    }
  } else {
    console.log('ℹ️  No hay logo para mover')
  }

  // 2. Mover imágenes del carrusel
  if (solicitud.imagenesCarrusel && solicitud.imagenesCarrusel.length > 0) {
    console.log(`📸 Moviendo ${solicitud.imagenesCarrusel.length} imágenes del carrusel...`)

    for (let i = 0; i < solicitud.imagenesCarrusel.length; i++) {
      const tempUrl = solicitud.imagenesCarrusel[i]

      try {
        const imagenUrl = await moverImagenASalon(
          tempUrl,
          salonId,
          'carrusel',
          `imagen${i + 1}`
        )
        imagenesMovidas.carrusel.push(imagenUrl)
        console.log(`✅ Imagen ${i + 1} movida: ${imagenUrl}`)
      } catch (error) {
        console.error(`❌ Error moviendo imagen ${i + 1}:`, error.message)
        // Mantener URL original si falla
        imagenesMovidas.carrusel.push(tempUrl)
      }
    }
  } else {
    console.log('ℹ️  No hay imágenes de carrusel para mover')
  }

  console.log(`✅ Imágenes movidas exitosamente`)
  console.log(`   - Logo: ${imagenesMovidas.logo ? 'Sí' : 'No'}`)
  console.log(`   - Carrusel: ${imagenesMovidas.carrusel.length} imágenes\n`)

  return imagenesMovidas
}

/**
 * Eliminar imagen de Cloudinary
 * @param {string} url - URL de la imagen a eliminar
 * @returns {Promise<boolean>}
 */
export const eliminarImagen = async (url) => {
  try {
    const publicId = extractPublicId(url)
    if (!publicId) {
      throw new Error('No se pudo extraer publicId')
    }

    await cloudinary.uploader.destroy(publicId)
    console.log(`🗑️  Imagen eliminada: ${publicId}`)
    return true
  } catch (error) {
    console.error('Error eliminando imagen:', error.message)
    return false
  }
}

export default cloudinary
