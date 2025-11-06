import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Configuración del transportador de email con Gmail
 */
const crearTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  })
}

/**
 * Envía un email de notificación al admin cuando hay una nueva solicitud
 */
export const enviarEmailNuevaSolicitud = async (datosSolicitud) => {
  try {
    const transporter = crearTransporter()

    const mailOptions = {
      from: `"MultiSalon Landing" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_ADMIN,
      subject: `🎉 Nueva Solicitud de Suscripción - ${datosSolicitud.nombreSalon}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .info-row { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
            .label { font-weight: bold; color: #2563eb; }
            .footer { margin-top: 20px; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
            .badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Nueva Solicitud de Suscripción</h1>
            </div>
            <div class="content">
              <p>Se ha recibido una nueva solicitud de suscripción desde la landing page:</p>

              <div class="info-row">
                <span class="label">Salón:</span> ${datosSolicitud.nombreSalon}
              </div>

              <div class="info-row">
                <span class="label">Propietario:</span> ${datosSolicitud.nombrePropietario}
              </div>

              <div class="info-row">
                <span class="label">Email:</span> <a href="mailto:${datosSolicitud.email}">${datosSolicitud.email}</a>
              </div>

              <div class="info-row">
                <span class="label">Teléfono:</span> <a href="tel:${datosSolicitud.telefono}">${datosSolicitud.telefono}</a>
              </div>

              <div class="info-row">
                <span class="label">Plan:</span> <span class="badge">${datosSolicitud.plan}</span>
              </div>

              ${datosSolicitud.mensaje ? `
              <div class="info-row">
                <span class="label">Mensaje:</span><br>
                <p style="margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 4px; font-style: italic;">
                  "${datosSolicitud.mensaje}"
                </p>
              </div>
              ` : ''}

              <div class="info-row">
                <span class="label">Fecha:</span> ${new Date().toLocaleString('es-SV', {
                  dateStyle: 'full',
                  timeStyle: 'short'
                })}
              </div>
            </div>

            <div class="footer">
              <p>Este correo fue generado automáticamente desde el sistema Landing MultiSalon</p>
              <p>Por favor, contacta al cliente lo antes posible para procesar su solicitud</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email enviado al admin:', info.messageId)

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Error al enviar email al admin:', error)
    throw error
  }
}

/**
 * Envía un email de confirmación al cliente que solicitó la suscripción
 */
export const enviarEmailConfirmacionCliente = async (datosSolicitud) => {
  try {
    const transporter = crearTransporter()

    const mailOptions = {
      from: `"MultiSalon" <${process.env.EMAIL_USER}>`,
      to: datosSolicitud.email,
      subject: '✅ Solicitud de Suscripción Recibida - MultiSalon',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
            .highlight { background: #f0f9ff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; border-radius: 4px; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            ul { padding-left: 20px; }
            li { margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">¡Gracias por tu interés!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Tu solicitud ha sido recibida correctamente</p>
            </div>

            <div class="content">
              <p>Hola <strong>${datosSolicitud.nombrePropietario}</strong>,</p>

              <p>Nos complace confirmar que hemos recibido tu solicitud de suscripción al <strong>${datosSolicitud.plan}</strong> para <strong>${datosSolicitud.nombreSalon}</strong>.</p>

              <div class="highlight">
                <h3 style="margin-top: 0; color: #2563eb;">📋 Próximos Pasos:</h3>
                <ol>
                  <li>Nuestro equipo revisará tu solicitud en las próximas 24-48 horas</li>
                  <li>Te contactaremos al email <strong>${datosSolicitud.email}</strong> o al teléfono <strong>${datosSolicitud.telefono}</strong></li>
                  <li>Coordinaremos los detalles del montaje y configuración de tu salón</li>
                  <li>Te enviaremos el formulario de onboarding detallado</li>
                </ol>
              </div>

              <h3>✨ ¿Qué incluye el ${datosSolicitud.plan}?</h3>
              <ul>
                <li>Sistema completo de gestión de reservas</li>
                <li>Base de datos de clientes</li>
                <li>Catálogo de servicios y productos</li>
                <li>Panel de administración intuitivo</li>
                <li>Personalización de marca y colores</li>
                <li>Capacitación completa para tu equipo</li>
                <li>Soporte técnico continuo</li>
              </ul>

              <p style="margin-top: 30px;">Si tienes alguna pregunta urgente, no dudes en responder a este correo.</p>

              <p>¡Estamos emocionados de trabajar contigo!</p>

              <p style="margin-top: 30px;">
                Saludos cordiales,<br>
                <strong>El equipo de MultiSalon</strong>
              </p>
            </div>

            <div class="footer">
              <p><strong>MultiSalon</strong> - Sistema de Gestión para Salones de Belleza</p>
              <p>info@multisalon.com</p>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
                Este correo fue generado automáticamente. Por favor, no respondas a este mensaje.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email de confirmación enviado al cliente:', info.messageId)

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Error al enviar email de confirmación:', error)
    throw error
  }
}

export default {
  enviarEmailNuevaSolicitud,
  enviarEmailConfirmacionCliente
}
