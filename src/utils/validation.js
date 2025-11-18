import { z } from 'zod'

/**
 * Schema de validación para solicitud de suscripción
 */
export const suscripcionSchema = z.object({
  nombreSalon: z
    .string({
      required_error: 'El nombre del salón es requerido',
      invalid_type_error: 'El nombre del salón debe ser texto'
    })
    .min(2, 'El nombre del salón debe tener al menos 2 caracteres')
    .max(100, 'El nombre del salón no puede exceder 100 caracteres')
    .trim(),

  nombrePropietario: z
    .string({
      required_error: 'El nombre del propietario es requerido',
      invalid_type_error: 'El nombre del propietario debe ser texto'
    })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),

  email: z
    .string({
      required_error: 'El email es requerido',
      invalid_type_error: 'El email debe ser texto'
    })
    .email('Debe ser un email válido')
    .toLowerCase()
    .trim(),

  telefono: z
    .string({
      required_error: 'El teléfono es requerido',
      invalid_type_error: 'El teléfono debe ser texto'
    })
    .min(8, 'El teléfono debe tener al menos 8 dígitos')
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .regex(/^[\d\s\-\+\(\)]+$/, 'El teléfono solo puede contener números, espacios, guiones, paréntesis y signo +')
    .trim(),

  plan: z
    .enum(['Plan Básico', 'Plan Premium', 'Plan Enterprise'], {
      required_error: 'Debes seleccionar un plan',
      invalid_type_error: 'Plan inválido'
    }),

  mensaje: z
    .string()
    .max(1000, 'El mensaje no puede exceder 1000 caracteres')
    .trim()
    .optional()
    .nullable()
    .transform(val => val || '')
})

/**
 * Schema para validar filtros de consulta de solicitudes
 */
export const filtrosSolicitudesSchema = z.object({
  estado: z
    .enum(['pendiente', 'contactado', 'procesado', 'rechazado'])
    .optional(),

  plan: z
    .string()
    .optional(),

  limite: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .default(50)
})

/**
 * Schema para actualizar estado de solicitud
 */
export const actualizarEstadoSchema = z.object({
  estado: z.enum(['pendiente', 'contactado', 'procesado', 'rechazado'], {
    required_error: 'El estado es requerido',
    invalid_type_error: 'Estado inválido'
  }),

  notas: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .trim()
    .optional()
    .nullable()
    .transform(val => val || '')
})

/**
 * Middleware para validar datos con un schema de Zod
 */
export const validarDatos = (schema) => {
  return async (req, res, next) => {
    try {
      const datosValidados = await schema.parseAsync(req.body)
      req.body = datosValidados
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errores = error.errors.map(err => ({
          campo: err.path.join('.'),
          mensaje: err.message
        }))

        return res.status(400).json({
          error: 'Error de validación',
          errores
        })
      }

      return res.status(500).json({
        error: 'Error al validar los datos'
      })
    }
  }
}

export default {
  suscripcionSchema,
  filtrosSolicitudesSchema,
  actualizarEstadoSchema,
  validarDatos
}
