# 🏗️ ESTRUCTURA DE CLIENTE - FIRESTORE

## 📊 Estructura de Datos

### Colección: `landing-page/data/clientes/{clienteId}`

```javascript
{
  // ===== INFORMACIÓN BÁSICA =====
  nombreCompleto: "María García",
  email: "maria@ejemplo.com",        // Único - índice necesario
  telefono: "+503 7777-8888",

  // ===== CREDENCIALES =====
  usuario: "maria.garcia",            // Único - generado automáticamente
  passwordHash: "$2a$10$...",         // Hasheado con bcryptjs

  // ===== INFORMACIÓN DEL SALÓN =====
  nombreSalon: "Bella Estética",
  salonId: null,                      // Referencia al salón (null hasta que se cree)

  // ===== REFERENCIAS =====
  solicitudId: "abc123",              // ID de la solicitud que generó este cliente

  // ===== ESTADO Y METADATA =====
  estado: "activo",                   // activo, suspendido, cancelado
  emailVerificado: false,             // Para futuro: verificación de email

  // ===== PLAN Y SUSCRIPCIÓN =====
  planSeleccionado: "Plan Premium",   // Plan que eligió inicialmente
  suscripcionId: null,                // ID de suscripción Stripe (null hasta pago)
  estadoSuscripcion: "pendiente",     // pendiente, activa, cancelada, vencida

  // ===== TIMESTAMPS =====
  fechaCreacion: Timestamp,           // Cuando se auto-registró
  fechaUltimoAcceso: null,            // Última vez que hizo login
  fechaActualizacion: Timestamp,      // Última modificación

  // ===== METADATA ADICIONAL =====
  creadoPor: "auto_registro",         // Indica que fue auto-generado
  origen: "landing_page"
}
```

## 🔑 Generación de Credenciales

### Usuario
```javascript
// Formato: nombre.apellido + número aleatorio si existe
// Ejemplo: "maria.garcia", "maria.garcia2", etc.

function generarUsuario(nombreCompleto) {
  // 1. Convertir a minúsculas
  // 2. Remover acentos
  // 3. Reemplazar espacios por puntos
  // 4. Verificar si existe en BD
  // 5. Si existe, agregar número incremental

  // Ejemplos:
  // "María García López" → "maria.garcia"
  // "José Alberto Pérez" → "jose.alberto"
}
```

### Contraseña Temporal
```javascript
// Formato: 8 caracteres alfanuméricos
// Ejemplo: "Ab3k9Qz2"

function generarPasswordTemporal() {
  // Mayúsculas + minúsculas + números
  // Min 8 caracteres
  // Al menos 1 mayúscula, 1 minúscula, 1 número
}
```

## 📧 Email de Bienvenida

### Contenido
- Confirmación de registro
- Usuario generado
- Contraseña temporal
- Instrucciones para cambiar contraseña
- Link para acceder al portal
- Próximos pasos

## 🔄 Flujo de Auto-Registro

```
1. Cliente llena formulario en landing
   ↓
2. Backend recibe solicitud
   ↓
3. Guardar solicitud en: landing-page/data/solicitudes/{id}
   ↓
4. Generar credenciales automáticas
   - Usuario único
   - Contraseña temporal
   ↓
5. Hashear contraseña con bcryptjs
   ↓
6. Crear cliente en: landing-page/data/clientes/{id}
   - Vincular solicitudId
   - Guardar credenciales
   ↓
7. Actualizar solicitud con clienteId
   ↓
8. Enviar 3 emails en paralelo:
   - Email al admin (nueva solicitud)
   - Email de confirmación al cliente
   - Email con credenciales de acceso ⭐ NUEVO
   ↓
9. Responder al frontend con éxito
```

## 🔐 Seguridad

### Validaciones Necesarias
- ✅ Email único (no permitir duplicados)
- ✅ Usuario único (agregar número si existe)
- ✅ Password hasheado (NUNCA guardar en texto plano)
- ✅ Validar formato de email
- ✅ Validar longitud de password (min 8 caracteres)

### Índices en Firestore
```javascript
// Índices necesarios para consultas rápidas:
clientes.email          // Para login y verificar duplicados
clientes.usuario        // Para login
clientes.solicitudId    // Para vincular con solicitud
```

## 📝 Campos Adicionales Futuros

```javascript
// Para futuras implementaciones:
{
  // Verificación de email
  tokenVerificacion: "abc123",
  fechaVerificacion: Timestamp,

  // Reset de contraseña
  tokenResetPassword: null,
  fechaTokenResetPassword: null,

  // Preferencias
  notificaciones: {
    email: true,
    whatsapp: false
  },

  // Auditoría
  intentosLoginFallidos: 0,
  ultimoIntentLogin: Timestamp,

  // Datos del navegador (opcional)
  ipRegistro: "192.168.1.1",
  navegadorRegistro: "Chrome 120"
}
```

## 🚀 Implementación

### Archivos a Crear/Modificar

1. **`src/utils/clienteUtils.js`** - NUEVO
   - `generarUsuario()`
   - `generarPasswordTemporal()`
   - `validarUsuarioUnico()`

2. **`src/config/firebase.js`** - MODIFICAR
   - `crearCliente()` - Nueva función
   - `buscarClientePorEmail()` - Nueva función
   - `buscarClientePorUsuario()` - Nueva función

3. **`src/controllers/suscripciones.controller.js`** - MODIFICAR
   - `crearSolicitud()` - Agregar creación de cliente

4. **`src/config/email.js`** - MODIFICAR
   - `enviarEmailCredencialesCliente()` - Nueva función

5. **`src/routes/clientes.routes.js`** - NUEVO (para futuro)
   - Login de clientes
   - Cambiar contraseña
   - Ver perfil

## ✅ Checklist de Implementación

- [ ] Crear utilidades para generar credenciales
- [ ] Crear funciones de Firestore para clientes
- [ ] Modificar guardarSolicitudSuscripcion para incluir clienteId
- [ ] Modificar crearSolicitud para crear cliente
- [ ] Crear plantilla de email con credenciales
- [ ] Agregar envío de email de credenciales
- [ ] Probar flujo completo
- [ ] Documentar API
