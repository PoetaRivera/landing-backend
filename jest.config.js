/**
 * Configuración de Jest para Backend Landing MultiSalon
 * Configurado para ESM (type: "module")
 */

export default {
  // Indicar que usamos ESM
  testEnvironment: 'node',

  // Transformaciones (no necesarias para ESM puro)
  transform: {},

  // Extensiones de archivos a considerar
  moduleFileExtensions: ['js', 'json'],

  // Patrón de archivos de test
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Directorios a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],

  // Cobertura de código
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // Excluir entry point
    '!**/__tests__/**',
    '!**/node_modules/**'
  ],

  // Umbrales de cobertura (empezar conservador)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // Timeout para tests (aumentado para tests de integración)
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
}
