import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server.js'

describe('Health Check Endpoint', () => {
    it('should return 200 OK and status OK', async () => {
        const res = await request(app).get('/api/health')

        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('status', 'OK')
        expect(res.body).toHaveProperty('timestamp')
    })

    it('should return 200 OK for root endpoint', async () => {
        const res = await request(app).get('/')

        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('mensaje', 'API Landing MultiSalon funcionando correctamente')
    })
})
