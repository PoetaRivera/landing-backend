/**
 * Configuración de Vitest para Backend Landing MultiSalon
 * Vitest tiene soporte nativo para ESM (type: "module")
 */

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Archivos de setup global
    setupFiles: ['./vitest.setup.js'],

    // Patrón de archivos de test
    include: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],

    // Directorios a ignorar
    exclude: ['node_modules', 'dist'],

    // Modo de ejecución
    globals: true, // Hace disponibles describe, test, expect sin import
    environment: 'node', // Ambiente Node.js

    // Coverage (opcional - requiere @vitest/coverage-v8)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/__tests__/**',
        '**/vitest.*.js',
        '**/*.config.js'
      ],
      // Umbrales de cobertura
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50
      }
    },

    // Timeout para tests
    testTimeout: 10000
  }
})
