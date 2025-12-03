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



    // Intentar renombrar (mover) la imagen
    try {
      const result = await cloudinary.uploader.rename(publicId, newPublicId, {
        overwrite: true,
        invalidate: true
      })



      // Retornar nueva URL
      return result.secure_url
    } catch (renameError) {
      // Si falla el rename (porque la imagen ya no existe o ya fue movida),
      // intentar construir la URL manualmente
      console.warn('⚠️  No se pudo renombrar, verificando si ya existe...')

      // Verificar si la imagen ya existe en el destino
      try {
        const resource = await cloudinary.api.resource(newPublicId)

        return resource.secure_url
      } catch (checkError) {
        // Si no existe, copiar desde la URL temporal

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


  const imagenesMovidas = {
    logo: '',
    carrusel: []
  }

  // 1. Mover logo
  if (solicitud.logo) {
    try {

      const logoUrl = await moverImagenASalon(solicitud.logo, salonId, 'logos', 'logo')
      imagenesMovidas.logo = logoUrl

    } catch (error) {
      console.error('❌ Error moviendo logo:', error.message)
      // Mantener URL original si falla
      imagenesMovidas.logo = solicitud.logo
    }
  } else {

  }

  // 2. Mover imágenes del carrusel
  if (solicitud.imagenesCarrusel && solicitud.imagenesCarrusel.length > 0) {


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

      } catch (error) {
        console.error(`❌ Error moviendo imagen ${i + 1}:`, error.message)
        // Mantener URL original si falla
        imagenesMovidas.carrusel.push(tempUrl)
      }
    }
  } else {

  }



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

    return true
  } catch (error) {
    console.error('Error eliminando imagen:', error.message)
    return false
  }
}

/**
 * Convertir nombre de salón a formato válido para salonId/carpetas
 * Formato: lowercase, sin acentos, sin espacios, sin caracteres especiales
 * Ejemplo: "Karlas Salon's" → "karlassalons"
 * Ejemplo: "Bella Spa Center" → "bellaspacenter"
 * @param {string} nombreSalon - Nombre del salón
 * @returns {string} - salonId formateado
 */
export const formatearNombreSalon = (nombreSalon) => {
  if (!nombreSalon || typeof nombreSalon !== 'string') {
    throw new Error('nombreSalon debe ser un string válido')
  }

  return nombreSalon
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]/g, '') // Eliminar caracteres especiales (espacios, apóstrofes, etc.)
    .substring(0, 30) // Limitar longitud máxima
}

/**
 * Mover todas las imágenes de una carpeta temporal a carpeta final
 * @param {string} carpetaTemporal - Carpeta origen (salonId temporal)
 * @param {string} carpetaFinal - Carpeta destino (nombre del salón)
 * @param {Object} recursos - Objeto con URLs de recursos desde cloudinary-pending
 * @returns {Promise<Object>} - URLs actualizadas { logo, carrusel, productos, servicios, estilistas }
 */
export const moverRecursosACarpetaFinal = async (carpetaTemporal, carpetaFinal, recursos) => {
  console.log(`\n🔄 Moviendo recursos de "${carpetaTemporal}" a "${carpetaFinal}"...`)

  const urlsActualizadas = {
    logo: '',
    carrusel: [],
    productos: [],
    servicios: [],
    estilistas: []
  }

  try {
    // 1. Mover logo
    if (recursos.logo) {
      try {
        console.log(`  📸 Moviendo logo...`)
        const publicIdOrigen = extractPublicId(recursos.logo)
        const publicIdDestino = `${carpetaFinal}/logos/logo`

        console.log(`     🔹 URL origen: ${recursos.logo}`)
        console.log(`     🔹 publicId origen: ${publicIdOrigen}`)
        console.log(`     🔹 publicId destino: ${publicIdDestino}`)
        console.log(`     🔹 carpetaOrigen esperada: ${carpetaTemporal}`)
        console.log(`     🔹 carpetaDestino esperada: ${carpetaFinal}`)

        const result = await cloudinary.uploader.rename(publicIdOrigen, publicIdDestino, {
          overwrite: true,
          invalidate: true
        })

        urlsActualizadas.logo = result.secure_url
        console.log(`  ✅ Logo movido exitosamente`)
        console.log(`     ✅ Nueva URL: ${result.secure_url}`)
        console.log(`     ✅ Nuevo publicId: ${result.public_id}`)
        console.log(`     ⚠️  VERIFICAR: La URL debe contener "/${carpetaFinal}/" NO "/${carpetaTemporal}/"`)
      } catch (error) {
        console.error(`  ❌ ERROR MOVIENDO LOGO:`)
        console.error(`     ❌ Mensaje: ${error.message}`)
        console.error(`     ❌ Error completo:`, JSON.stringify(error, null, 2))
        console.error(`     ❌ publicId origen intentado: ${extractPublicId(recursos.logo)}`)
        console.error(`     ❌ publicId destino intentado: ${carpetaFinal}/logos/logo`)

        // Mantener URL original si falla
        urlsActualizadas.logo = recursos.logo
        console.log(`     ⚠️  Manteniendo URL original: ${recursos.logo}`)
      }
    }

    // 2. Mover carrusel
    if (recursos.carrusel && recursos.carrusel.length > 0) {
      console.log(`  🖼️  Moviendo ${recursos.carrusel.length} imágenes de carrusel...`)

      for (let i = 0; i < recursos.carrusel.length; i++) {
        try {
          const publicIdOrigen = extractPublicId(recursos.carrusel[i])
          const publicIdDestino = `${carpetaFinal}/carrusel/imagen${i + 1}`

          const result = await cloudinary.uploader.rename(publicIdOrigen, publicIdDestino, {
            overwrite: true,
            invalidate: true
          })

          urlsActualizadas.carrusel.push(result.secure_url)
        } catch (error) {
          console.error(`  ❌ Error moviendo carrusel ${i + 1}:`, error.message)
          urlsActualizadas.carrusel.push(recursos.carrusel[i])
        }
      }
      console.log(`  ✅ ${urlsActualizadas.carrusel.length}/${recursos.carrusel.length} imágenes de carrusel movidas`)
    }

    // 3. Mover productos
    if (recursos.productos && recursos.productos.length > 0) {
      console.log(`  🛍️  Moviendo ${recursos.productos.length} imágenes de productos...`)

      for (let i = 0; i < recursos.productos.length; i++) {
        try {
          const publicIdOrigen = extractPublicId(recursos.productos[i])
          const publicIdDestino = `${carpetaFinal}/productos/producto${i + 1}`

          const result = await cloudinary.uploader.rename(publicIdOrigen, publicIdDestino, {
            overwrite: true,
            invalidate: true
          })

          urlsActualizadas.productos.push(result.secure_url)
        } catch (error) {
          console.error(`  ❌ Error moviendo producto ${i + 1}:`, error.message)
          urlsActualizadas.productos.push(recursos.productos[i])
        }
      }
      console.log(`  ✅ ${urlsActualizadas.productos.length}/${recursos.productos.length} imágenes de productos movidas`)
    }

    // 4. Mover servicios
    if (recursos.servicios && recursos.servicios.length > 0) {
      console.log(`  💇 Moviendo ${recursos.servicios.length} imágenes de servicios...`)

      for (let i = 0; i < recursos.servicios.length; i++) {
        try {
          const publicIdOrigen = extractPublicId(recursos.servicios[i])
          const publicIdDestino = `${carpetaFinal}/servicios/servicio${i + 1}`

          const result = await cloudinary.uploader.rename(publicIdOrigen, publicIdDestino, {
            overwrite: true,
            invalidate: true
          })

          urlsActualizadas.servicios.push(result.secure_url)
        } catch (error) {
          console.error(`  ❌ Error moviendo servicio ${i + 1}:`, error.message)
          urlsActualizadas.servicios.push(recursos.servicios[i])
        }
      }
      console.log(`  ✅ ${urlsActualizadas.servicios.length}/${recursos.servicios.length} imágenes de servicios movidas`)
    }

    // 5. Mover estilistas
    if (recursos.estilistas && recursos.estilistas.length > 0) {
      console.log(`  👨‍🦰 Moviendo ${recursos.estilistas.length} imágenes de estilistas...`)

      for (let i = 0; i < recursos.estilistas.length; i++) {
        try {
          const publicIdOrigen = extractPublicId(recursos.estilistas[i])
          const publicIdDestino = `${carpetaFinal}/estilistas/estilista${i + 1}`

          const result = await cloudinary.uploader.rename(publicIdOrigen, publicIdDestino, {
            overwrite: true,
            invalidate: true
          })

          urlsActualizadas.estilistas.push(result.secure_url)
        } catch (error) {
          console.error(`  ❌ Error moviendo estilista ${i + 1}:`, error.message)
          urlsActualizadas.estilistas.push(recursos.estilistas[i])
        }
      }
      console.log(`  ✅ ${urlsActualizadas.estilistas.length}/${recursos.estilistas.length} imágenes de estilistas movidas`)
    }

    console.log(`✅ Recursos movidos exitosamente a carpeta "${carpetaFinal}"\n`)

    return urlsActualizadas
  } catch (error) {
    console.error(`❌ Error moviendo recursos:`, error)
    throw error
  }
}

export default cloudinary
