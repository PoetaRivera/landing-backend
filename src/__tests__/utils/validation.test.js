/**
 * Tests para Validación con Zod
 * Valida schemas de suscripción y otros datos
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { suscripcionSchema, actualizarEstadoSchema, validarDatos } from '../../utils/validation.js'

describe('Validation Schemas', () => {
  describe('suscripcionSchema', () => {
    const datosValidos = {
      nombreSalon: 'Salón Bella Vista',
      nombrePropietario: 'María García',
      email: 'maria@salonbella.com',
      telefono: '7123-4567',
      plan: 'Plan Básico - $15/mes',
      mensaje: 'Estoy interesada en el sistema'
    }

    test('debe validar datos correctos', () => {
      const resultado = suscripcionSchema.safeParse(datosValidos)

      expect(resultado.success).toBe(true)
      expect(resultado.data.email).toBe('maria@salonbella.com')
    })

    test('debe convertir email a minúsculas', () => {
      const datos = { ...datosValidos, email: 'MARIA@SALONBELLA.COM' }
      const resultado = suscripcionSchema.safeParse(datos)

      expect(resultado.success).toBe(true)
      expect(resultado.data.email).toBe('maria@salonbella.com')
    })

    test('debe rechazar nombreSalon vacío', () => {
      const datos = { ...datosValidos, nombreSalon: '' }
      const resultado = suscripcionSchema.safeParse(datos)

      expect(resultado.success).toBe(false)
      expect(resultado.error.errors[0].message).toContain('al menos 2 caracteres')
    })

    test('debe rechazar nombreSalon muy largo', () => {
      const datos = { ...datosValidos, nombreSalon: 'A'.repeat(101) }
      const resultado = suscripcionSchema.safeParse(datos)

      expect(resultado.success).toBe(false)
      expect(resultado.error.errors[0].message).toContain('no puede exceder 100 caracteres')
    })

    test('debe rechazar email inválido', () => {
      const datos = { ...datosValidos, email: 'email-invalido' }
      const resultado = suscripcionSchema.safeParse(datos)

      expect(resultado.success).toBe(false)
      expect(resultado.error.errors[0].message).toContain('email válido')
    })

    test('debe rechazar teléfono muy corto', () => {
      const datos = { ...datosValidos, telefono: '123' }
      const resultado = suscripcionSchema.safeParse(datos)

      expect(resultado.success).toBe(false)
      expect(resultado.error.errors[0].message).toContain('al menos 8 dígitos')
    })

    test('debe rechazar teléfono con caracteres inválidos', () => {
      const datos = { ...datosValidos, telefono: '1234-ABCD' }
      const resultado = suscripcionSchema.safeParse(datos)

      expect(resultado.success).toBe(false)
      expect(resultado.error.errors[0].message).toContain('solo puede contener números')
    })

    test('debe aceptar teléfonos con formato válido', () => {
      const formatos = [
        '7123-4567',
        '2234 5678',
        '+503 7123-4567',
        '(503) 7123-4567'
      ]

      formatos.forEach(telefono => {
        const datos = { ...datosValidos, telefono }
        const resultado = suscripcionSchema.safeParse(datos)
        expect(resultado.success).toBe(true)
      })
    })

    test('debe rechazar plan inválido', () => {
      const datos = { ...datosValidos, plan: 'Plan Inexistente' }
      const resultado = suscripcionSchema.safeParse(datos)

      expect(resultado.success).toBe(false)
      expect(resultado.error.errors[0].message).toContain('Invalid enum value')
    })

    test('debe permitir mensaje opcional', () => {
      const { mensaje, ...datosSinMensaje } = datosValidos
      const resultado = suscripcionSchema.safeParse(datosSinMensaje)

      expect(resultado.success).toBe(true)
      expect(resultado.data.mensaje).toBe('')
    })

    test('debe rechazar mensaje muy largo', () => {
      const datos = { ...datosValidos, mensaje: 'A'.repeat(1001) }
      const resultado = suscripcionSchema.safeParse(datos)

      expect(resultado.success).toBe(false)
      expect(resultado.error.errors[0].message).toContain('no puede exceder 1000 caracteres')
    })

    test('debe trimear espacios en blanco', () => {
      const datos = {
        ...datosValidos,
        nombreSalon: '  Salón Bella Vista  ',
        nombrePropietario: '  María García  '
      }
      const resultado = suscripcionSchema.safeParse(datos)

      expect(resultado.success).toBe(true)
      expect(resultado.data.nombreSalon).toBe('Salón Bella Vista')
      expect(resultado.data.nombrePropietario).toBe('María García')
    })
  })

  describe('actualizarEstadoSchema', () => {
    test('debe validar estado válido', () => {
      const datos = { estado: 'procesado', notas: 'Cliente contactado' }
      const resultado = actualizarEstadoSchema.safeParse(datos)

      expect(resultado.success).toBe(true)
      expect(resultado.data.estado).toBe('procesado')
    })

    test('debe rechazar estado inválido', () => {
      const datos = { estado: 'estado-invalido' }
      const resultado = actualizarEstadoSchema.safeParse(datos)

      expect(resultado.success).toBe(false)
    })

    test('debe permitir notas opcionales', () => {
      const datos = { estado: 'contactado' }
      const resultado = actualizarEstadoSchema.safeParse(datos)

      expect(resultado.success).toBe(true)
      expect(resultado.data.notas).toBe('')
    })
  })

  describe('validarDatos middleware', () => {
    let req, res, next

    beforeEach(() => {
      req = { body: {} }
      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
      }
      next = vi.fn()
    })

    test('debe llamar next() con datos válidos', async () => {
      req.body = {
        nombreSalon: 'Test Salon',
        nombrePropietario: 'Test Owner',
        email: 'test@test.com',
        telefono: '12345678',
        plan: 'Plan Básico - $15/mes'
      }

      const middleware = validarDatos(suscripcionSchema)
      await middleware(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    test('debe retornar error 400 con datos inválidos', async () => {
      req.body = {
        nombreSalon: 'A', // Muy corto
        email: 'invalid-email' // Email inválido
      }

      const middleware = validarDatos(suscripcionSchema)
      await middleware(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error de validación',
          errores: expect.any(Array)
        })
      )
      expect(next).not.toHaveBeenCalled()
    })
  })
})
