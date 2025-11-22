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
 * Envía email al cliente con sus credenciales de acceso
 */
export const enviarEmailCredencialesCliente = async (datos) => {
  try {
    const transporter = crearTransporter()

    const { email, nombreCompleto, nombreSalon, usuario, passwordTemporal, plan } = datos

    const mailOptions = {
      from: `"MultiSalon" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎉 ¡Bienvenido a MultiSalon! - Credenciales de Acceso`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials-box { background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .credential-row { margin: 15px 0; }
            .label { font-weight: bold; color: #374151; display: block; margin-bottom: 5px; }
            .value { background: #f3f4f6; padding: 12px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 16px; color: #1f2937; border: 1px solid #d1d5db; }
            .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { margin-top: 20px; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
            ul { padding-left: 20px; }
            li { margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">¡Bienvenido a MultiSalon!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Tu cuenta ha sido creada exitosamente</p>
            </div>

            <div class="content">
              <p style="font-size: 16px;">Hola <strong>${nombreCompleto}</strong>,</p>

              <p>¡Felicitaciones! Tu solicitud para <strong>${nombreSalon}</strong> ha sido aprobada y procesada exitosamente. Ya puedes acceder al sistema MultiSalon con las credenciales que encontrarás a continuación.</p>

              <div class="credentials-box">
                <h3 style="margin-top: 0; color: #10b981; text-align: center;">🔐 Tus Credenciales de Acceso</h3>

                <div class="credential-row">
                  <span class="label">👤 Usuario:</span>
                  <div class="value">${usuario}</div>
                </div>

                <div class="credential-row">
                  <span class="label">🔑 Contraseña Temporal:</span>
                  <div class="value">${passwordTemporal}</div>
                </div>

                <div class="credential-row">
                  <span class="label">📧 Email:</span>
                  <div class="value">${email}</div>
                </div>

                <div class="credential-row">
                  <span class="label">📋 Plan:</span>
                  <div class="value">${plan}</div>
                </div>
              </div>

              <div class="alert">
                <strong>⚠️ Importante:</strong> Esta es una contraseña temporal. Te recomendamos cambiarla al iniciar sesión por primera vez por razones de seguridad.
              </div>

              <div style="text-align: center;">
                <a href="https://app.multisalon.com/login" class="button" style="color: white;">
                  Iniciar Sesión Ahora →
                </a>
              </div>

              <h3 style="margin-top: 30px; color: #374151;">📋 Próximos Pasos:</h3>
              <ol>
                <li><strong>Inicia sesión</strong> en el sistema con tus credenciales</li>
                <li><strong>Cambia tu contraseña</strong> por una personalizada</li>
                <li><strong>Completa tu perfil</strong> con los datos de tu salón</li>
                <li><strong>Configura tu catálogo</strong> de servicios y productos</li>
                <li><strong>Personaliza los colores</strong> de tu sistema</li>
                <li><strong>Invita a tu equipo</strong> de estilistas</li>
              </ol>

              <h3 style="color: #374151;">📚 Recursos Disponibles:</h3>
              <ul>
                <li><strong>Manual de Usuario:</strong> Guía completa del sistema</li>
                <li><strong>Videos Tutoriales:</strong> Aprende paso a paso</li>
                <li><strong>Soporte Técnico:</strong> Estamos disponibles para ayudarte</li>
                <li><strong>Capacitación:</strong> Sesión personalizada para tu equipo</li>
              </ul>

              <div style="background: #eff6ff; border-radius: 8px; padding: 20px; margin-top: 25px;">
                <h3 style="margin-top: 0; color: #2563eb;">💡 ¿Necesitas Ayuda?</h3>
                <p style="margin-bottom: 0;">Nuestro equipo de soporte está listo para asistirte:</p>
                <ul style="margin-bottom: 0;">
                  <li>📧 Email: soporte@multisalon.com</li>
                  <li>📱 WhatsApp: +503 1234-5678</li>
                  <li>🕐 Horario: Lunes a Viernes, 8:00 AM - 6:00 PM</li>
                </ul>
              </div>

              <p style="margin-top: 30px; font-size: 16px;">
                ¡Estamos emocionados de que formes parte de la familia MultiSalon!
              </p>

              <p style="margin-top: 20px;">
                Saludos cordiales,<br>
                <strong>El equipo de MultiSalon</strong>
              </p>
            </div>

            <div class="footer">
              <p><strong>MultiSalon</strong> - Sistema de Gestión para Salones de Belleza</p>
              <p>www.multisalon.com | soporte@multisalon.com</p>
              <p style="font-size: 11px; color: #9ca3af; margin-top: 15px;">
                Este correo contiene información confidencial. Por favor, manténla segura.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email con credenciales enviado:', info.messageId)

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Error al enviar email con credenciales:', error)
    throw error
  }
}

/**
 * Envía un email con el link de recuperación de contraseña
 * @param {Object} datos - { email, nombre, resetUrl, expiraEn }
 */
export const enviarEmailRecuperacionPassword = async (datos) => {
  try {
    const transporter = crearTransporter()
    const { email, nombre, resetUrl, expiraEn } = datos

    const mailOptions = {
      from: `"MultiSalon - Panel Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔒 Recuperación de Contraseña - Panel Administrativo',
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
              <p>Hola <strong>${nombre}</strong>,</p>

              <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de administrador en el Panel de MultiSalon.</p>

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
                <p style="margin: 0;"><strong>⏰ Este enlace expirará en ${expiraEn}</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Por razones de seguridad, el enlace solo será válido durante ${expiraEn}.</p>
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
              <p><strong>MultiSalon</strong> - Panel Administrativo</p>
              <p>Email: soporte@multisalon.com</p>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
                Este es un email automático de seguridad. Si no solicitaste cambiar tu contraseña, ignora este mensaje.
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

/**
 * Enviar email con credenciales de acceso al onboarding
 */
export const enviarEmailCredencialesOnboarding = async (datos) => {
  try {
    const transporter = crearTransporter()

    const { email, nombreCompleto, nombreSalon, usuario, passwordTemporal, plan } = datos

    const mailOptions = {
      from: `"MultiSalon" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Pago Confirmado - Acceso al Formulario de Configuración`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials-box { background: white; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .credential-row { margin: 15px 0; }
            .label { font-weight: bold; color: #374151; display: block; margin-bottom: 5px; }
            .value { background: #f3f4f6; padding: 12px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 16px; color: #1f2937; border: 1px solid #d1d5db; }
            .alert { background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { margin-top: 20px; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
            ol { padding-left: 20px; }
            li { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">¡Pago Confirmado!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Completa la configuración de tu salón</p>
            </div>

            <div class="content">
              <p style="font-size: 16px;">Hola <strong>${nombreCompleto}</strong>,</p>

              <p>¡Excelentes noticias! Hemos confirmado tu pago para <strong>${nombreSalon}</strong>. Ahora puedes acceder al formulario de configuración para completar la información de tu salón.</p>

              <div class="credentials-box">
                <h3 style="margin-top: 0; color: #2563eb; text-align: center;">🔐 Tus Credenciales de Acceso</h3>

                <div class="credential-row">
                  <span class="label">👤 Usuario:</span>
                  <div class="value">${usuario}</div>
                </div>

                <div class="credential-row">
                  <span class="label">🔑 Contraseña Temporal:</span>
                  <div class="value">${passwordTemporal}</div>
                </div>

                <div class="credential-row">
                  <span class="label">📋 Plan Seleccionado:</span>
                  <div class="value">${plan}</div>
                </div>
              </div>

              <div class="alert">
                <strong>📝 Importante:</strong> Estas credenciales te permitirán acceder al formulario de configuración. Una vez completado, recibirás acceso al sistema completo de MultiSalon.
              </div>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/cliente/login" class="button" style="color: white;">
                  Acceder al Formulario →
                </a>
              </div>

              <h3 style="margin-top: 30px; color: #374151;">📋 Próximos Pasos:</h3>
              <ol>
                <li><strong>Inicia sesión</strong> con las credenciales proporcionadas</li>
                <li><strong>Completa el formulario</strong> de 9 pasos con la información de tu salón:
                  <ul>
                    <li>Logo y branding</li>
                    <li>Paleta de colores</li>
                    <li>Servicios y productos</li>
                    <li>Equipo de estilistas</li>
                    <li>Imágenes del salón</li>
                    <li>Horarios y configuración</li>
                  </ul>
                </li>
                <li><strong>Envía el formulario</strong> para revisión</li>
                <li><strong>Recibe acceso al sistema</strong> (24-48 horas)</li>
              </ol>

              <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin-top: 25px; border-left: 4px solid #f59e0b;">
                <h3 style="margin-top: 0; color: #92400e;">⏰ Tiempo Estimado</h3>
                <p style="margin-bottom: 0;">Completar el formulario toma aproximadamente <strong>15-20 minutos</strong>. Puedes guardar tu progreso y continuar después si lo necesitas.</p>
              </div>

              <div style="background: #eff6ff; border-radius: 8px; padding: 20px; margin-top: 25px;">
                <h3 style="margin-top: 0; color: #2563eb;">💡 ¿Necesitas Ayuda?</h3>
                <p>Si tienes alguna duda o problema, contáctanos:</p>
                <ul style="margin-bottom: 0;">
                  <li>📧 Email: soporte@multisalon.com</li>
                  <li>📱 WhatsApp: +503 1234-5678</li>
                  <li>⏰ Horario: Lunes a Viernes, 9:00 AM - 6:00 PM</li>
                </ul>
              </div>
            </div>

            <div class="footer">
              <p><strong>MultiSalon</strong> - Sistema de Gestión para Salones de Belleza</p>
              <p style="margin: 5px 0;">Este correo fue generado automáticamente</p>
              <p style="margin: 5px 0; color: #9ca3af;">Si no solicitaste este acceso, puedes ignorar este mensaje</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email de credenciales onboarding enviado:', info.messageId)

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Error al enviar email de credenciales onboarding:', error)
    throw error
  }
}

export default {
  enviarEmailNuevaSolicitud,
  enviarEmailConfirmacionCliente,
  enviarEmailCredencialesCliente,
  enviarEmailRecuperacionPassword,
  enviarEmailCredencialesOnboarding
}
