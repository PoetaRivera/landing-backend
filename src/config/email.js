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

/**
 * Envía un email con las credenciales de acceso al cliente recién registrado
 */
export const enviarEmailCredencialesCliente = async (datosCliente, credenciales) => {
  try {
    const transporter = crearTransporter()

    const mailOptions = {
      from: `"MultiSalon" <${process.env.EMAIL_USER}>`,
      to: datosCliente.email,
      subject: '🔑 Tus Credenciales de Acceso - MultiSalon',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
            .credentials-box { background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .credential-item { margin: 15px 0; }
            .credential-label { font-weight: bold; color: #059669; display: block; margin-bottom: 5px; }
            .credential-value { background: #ffffff; padding: 12px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; color: #1f2937; border: 1px solid #d1d5db; }
            .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .steps { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            ul { padding-left: 20px; }
            li { margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🎉 ¡Bienvenido a MultiSalon!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Tu cuenta ha sido creada exitosamente</p>
            </div>

            <div class="content">
              <p>Hola <strong>${datosCliente.nombreCompleto}</strong>,</p>

              <p>¡Estamos emocionados de tenerte a bordo! Tu solicitud para <strong>${datosCliente.nombreSalon}</strong> ha sido recibida y hemos creado tu cuenta de acceso automáticamente.</p>

              <div class="credentials-box">
                <h3 style="margin-top: 0; color: #059669; text-align: center;">🔑 Tus Credenciales de Acceso</h3>

                <div class="credential-item">
                  <span class="credential-label">Usuario:</span>
                  <div class="credential-value">${credenciales.usuario}</div>
                </div>

                <div class="credential-item">
                  <span class="credential-label">Contraseña Temporal:</span>
                  <div class="credential-value">${credenciales.passwordTemporal}</div>
                </div>
              </div>

              <div class="warning-box">
                <strong>⚠️ Importante:</strong> Por seguridad, te recomendamos cambiar tu contraseña temporal en tu primer inicio de sesión. Puedes hacerlo desde tu perfil.
              </div>

              <div class="steps">
                <h3 style="margin-top: 0; color: #2563eb;">📋 Próximos Pasos:</h3>
                <ol>
                  <li><strong>Guarda estas credenciales en un lugar seguro</strong></li>
                  <li>Accede al portal del cliente con tus credenciales</li>
                  <li>Cambia tu contraseña temporal por una segura</li>
                  <li>Completa la información de tu perfil</li>
                  <li>Nuestro equipo te contactará para coordinar los detalles del montaje</li>
                </ol>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://misalons.com'}/cliente/login" class="button">
                  Acceder al Portal
                </a>
              </div>

              <h3>✨ ¿Qué puedes hacer en el portal?</h3>
              <ul>
                <li>Ver el estado de tu solicitud</li>
                <li>Consultar información de tu salón (una vez configurado)</li>
                <li>Ver el estado de tu suscripción</li>
                <li>Gestionar tus datos de pago</li>
                <li>Ver historial de pagos</li>
                <li>Cancelar tu suscripción si lo necesitas</li>
                <li>Actualizar tu información de contacto</li>
              </ul>

              <p style="margin-top: 30px;">Si tienes alguna pregunta o necesitas ayuda, no dudes en responder a este correo o contactarnos.</p>

              <p>¡Gracias por confiar en MultiSalon!</p>

              <p style="margin-top: 30px;">
                Saludos cordiales,<br>
                <strong>El equipo de MultiSalon</strong>
              </p>
            </div>

            <div class="footer">
              <p><strong>MultiSalon</strong> - Sistema de Gestión para Salones de Belleza</p>
              <p>Email: info@multisalon.com</p>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
                Por favor, no compartas tus credenciales con nadie. Este es un email automático, pero puedes responder si necesitas ayuda.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email de credenciales enviado al cliente:', info.messageId)

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Error al enviar email de credenciales:', error)
    throw error
  }
}

/**
 * Envía un email con el link de recuperación de contraseña
 */
export const enviarEmailRecuperacionPassword = async (email, nombreCompleto, resetToken) => {
  try {
    const transporter = crearTransporter()

    const resetUrl = `${process.env.FRONTEND_URL || 'https://misalons.com'}/cliente/reset-password?token=${resetToken}`

    const mailOptions = {
      from: `"MultiSalon" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔒 Recuperación de Contraseña - MultiSalon',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .button:hover { background: #d97706; }
            .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-radius: 0 0 8px 8px; }
            .code-box { background: #f3f4f6; padding: 15px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 12px; word-break: break-all; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🔒 Recuperación de Contraseña</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Restablecer tu contraseña</p>
            </div>

            <div class="content">
              <p>Hola <strong>${nombreCompleto}</strong>,</p>

              <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en MultiSalon.</p>

              <p>Si fuiste tú quien solicitó esto, haz clic en el siguiente botón para crear una nueva contraseña:</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button">
                  Restablecer Contraseña
                </a>
              </div>

              <p style="font-size: 14px; color: #6b7280;">
                O copia y pega este enlace en tu navegador:
              </p>
              <div class="code-box">
                ${resetUrl}
              </div>

              <div class="warning-box">
                <p style="margin: 0;"><strong>⏰ Este enlace expirará en 1 hora</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Por razones de seguridad, el enlace solo será válido durante 1 hora.</p>
              </div>

              <div class="warning-box">
                <p style="margin: 0;"><strong>⚠️ ¿No solicitaste esto?</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura. Tu contraseña actual seguirá siendo válida.</p>
              </div>

              <p style="margin-top: 30px;">Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>

              <p>Saludos cordiales,<br>
              <strong>El equipo de MultiSalon</strong></p>
            </div>

            <div class="footer">
              <p><strong>MultiSalon</strong> - Sistema de Gestión para Salones de Belleza</p>
              <p>Email: info@multisalon.com</p>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
                Este es un email automático, por favor no respondas a este mensaje.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email de recuperación enviado:', info.messageId)

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Error al enviar email de recuperación:', error)
    throw error
  }
}

export default {
  enviarEmailNuevaSolicitud,
  enviarEmailConfirmacionCliente,
  enviarEmailCredencialesCliente,
  enviarEmailRecuperacionPassword
}
