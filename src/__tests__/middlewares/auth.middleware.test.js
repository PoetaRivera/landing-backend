/**
 * Tests para Auth Middleware
 * Valida autenticación JWT y protección de rutas
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import { authenticateToken, requireAdmin } from '../../middlewares/auth.middleware.js'

describe('Auth Middleware', () => {
  let req, res, next

  beforeEach(() => {
    // Mock request, response y next
    req = {
      cookies: {},
      headers: {}
    }
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }
    next = vi.fn()
  })

  describe('authenticateToken', () => {
    test('debe rechazar requests sin token', () => {
      authenticateToken(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Acceso denegado',
        mensaje: 'Se requiere autenticación para acceder a este recurso'
      })
      expect(next).not.toHaveBeenCalled()
    })

    test('debe rechazar tokens inválidos', () => {
      req.cookies.adminToken = 'token-invalido'

      authenticateToken(req, res, next)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(next).not.toHaveBeenCalled()
    })

    test('debe aceptar tokens válidos desde cookie', () => {
      const payload = { id: '123', email: 'test@test.com', role: 'admin' }
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })

      req.cookies.adminToken = token

      authenticateToken(req, res, next)

      // Esperar que next se llame
      expect(next).toHaveBeenCalled()
      expect(req.user).toBeDefined()
      expect(req.user.id).toBe('123')
      expect(req.user.role).toBe('admin')
    })

    test('debe aceptar tokens válidos desde header Authorization', () => {
      const payload = { id: '456', email: 'user@test.com', role: 'user' }
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })

      req.headers.authorization = `Bearer ${token}`

      authenticateToken(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(req.user).toBeDefined()
      expect(req.user.id).toBe('456')
    })

    test('debe rechazar tokens expirados', () => {
      const payload = { id: '789', email: 'expired@test.com', role: 'user' }
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '-1h' }) // Token expirado

      req.cookies.adminToken = token

      authenticateToken(req, res, next)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Token inválido o expirado'
        })
      )
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('requireAdmin', () => {
    test('debe rechazar si no hay usuario autenticado', () => {
      // req.user no definido

      requireAdmin(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No autenticado'
      })
      expect(next).not.toHaveBeenCalled()
    })

    test('debe rechazar si el usuario no es admin', () => {
      req.user = { id: '123', email: 'user@test.com', role: 'user' }

      requireAdmin(req, res, next)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Acceso denegado',
        mensaje: 'No tienes permisos suficientes para acceder a este recurso'
      })
      expect(next).not.toHaveBeenCalled()
    })

    test('debe permitir acceso si el usuario es admin', () => {
      req.user = { id: '123', email: 'admin@test.com', role: 'admin' }

      requireAdmin(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })
  })
})
