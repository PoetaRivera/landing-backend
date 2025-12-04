# ✅ Backend Landing MultiSalon - LISTO PARA KOYEB

## 📦 Estado del Proyecto

**Repositorio:** https://github.com/PoetaRivera/landing-backend.git
**Último commit:** Preparar backend para deployment en Koyeb
**Estado:** ✅ LISTO PARA DESPLEGAR

---

## 🎯 Lo que se hizo

### 1. ✅ Configuración de Producción

- **Stripe removido como dependencia requerida** (no se usará)
- **Variables de entorno simplificadas** (solo las necesarias)
- **Soporte para Firebase JSON en variable de entorno** (GOOGLE_APPLICATION_CREDENTIALS_JSON)
- **Validaciones flexibles** para desarrollo y producción

### 2. ✅ Seguridad

- **Nuevo JWT_SECRET generado** (diferente del backend principal)
- **.gitignore actualizado** para proteger credenciales
- **KOYEB_ENV.txt NO se sube a GitHub** (en .gitignore)

### 3. ✅ Documentación

- **README_KOYEB.md:** Guía completa paso a paso
- **KOYEB_ENV.txt:** Variables listas para copiar/pegar (archivo LOCAL)
- **.env.production.example:** Template de variables

### 4. ✅ Repositorio

- **Cambios commiteados** y **pusheados** a GitHub
- **Repositorio actualizado** y listo para conectar con Koyeb

---

## 📋 Próximos Pasos (Manual)

### Paso 1: Ir a Koyeb

1. Ve a https://app.koyeb.com
2. Click en **"Create Web Service"**

### Paso 2: Conectar Repositorio

- **GitHub:** `PoetaRivera/landing-backend`
- **Branch:** `main`
- **Builder:** Buildpack
- **Run command:** `npm start`

### Paso 3: Configurar Variables de Entorno

Abre el archivo local `KOYEB_ENV.txt` y copia las 13 variables:

```
✅ NODE_ENV
✅ PORT
✅ JWT_SECRET (NUEVO - diferente del backend principal)
✅ JWT_EXPIRES_IN
✅ GOOGLE_APPLICATION_CREDENTIALS_JSON (JSON completo)
✅ EMAIL_USER
✅ EMAIL_PASSWORD
✅ EMAIL_ADMIN
✅ CLOUDINARY_CLOUD_NAME
✅ CLOUDINARY_API_KEY
✅ CLOUDINARY_API_SECRET
✅ FRONTEND_URL (actualizar después)
```

### Paso 4: Deploy

- Click en **"Create Service"**
- Esperar 3-5 minutos
- Verificar en `/api/health`

---

## 📁 Archivos Importantes

### Archivos en el Proyecto

```
backend/
├── README_KOYEB.md              ✅ Guía de deployment (en GitHub)
├── .env.production.example      ✅ Template (en GitHub)
├── KOYEB_ENV.txt               ⚠️  Variables con valores reales (NO en GitHub)
├── package.json                 ✅ Scripts configurados
├── src/
│   ├── config/
│   │   └── validateEnv.js      ✅ Validaciones actualizadas
│   │   └── firebase.js         ✅ Soporte para JSON en variable
│   └── server.js                ✅ Express configurado
└── .gitignore                   ✅ Protege credenciales
```

### ⚠️ Archivo LOCAL (NO en GitHub)

- **KOYEB_ENV.txt:** Contiene las variables CON VALORES REALES
  - 📍 Ubicación: `C:\CARPETA-RESPALDO\Escritorio\misproyectos\MULTISALON\landing-multisalon\backend\KOYEB_ENV.txt`
  - 🔒 Protegido por .gitignore
  - 📋 Úsalo para copiar/pegar en Koyeb Dashboard

---

## 🔐 Credenciales Compartidas

El backend del landing **comparte** estas credenciales con el backend principal:

✅ **Firebase/Firestore:** Mismo proyecto (`backenduserfirebase`)
✅ **Cloudinary:** Misma cuenta (`dyqva9iej`)
✅ **Email:** Mismo Gmail (`nrrvrivera+misalons@gmail.com`)

❌ **JWT_SECRET:** DIFERENTE (seguridad)

---

## 🏗️ Arquitectura Final

```
┌─────────────────────────────────┐
│     FIRESTORE (Compartido)      │
│  ├── landing-page/data/         │
│  └── salones/{salonId}/         │
└─────────────────────────────────┘
           ↑          ↑
           │          │
    ┌──────┴────┐  ┌──┴──────────┐
    │ Backend   │  │ Backend     │
    │ Landing   │  │ Principal   │
    │ (Koyeb)   │  │ (Koyeb)     │
    └───────────┘  └─────────────┘
```

**Beneficios:**
- 🎯 Servicios independientes
- 🔄 Deployments separados
- 📊 Monitoreo individual
- 💰 Dentro del plan gratuito de Koyeb (2 servicios)

---

## ✅ Checklist Pre-Deployment

- [x] Código actualizado en GitHub
- [x] Stripe removido de dependencias requeridas
- [x] JWT_SECRET nuevo generado
- [x] Firebase credentials en formato JSON listo
- [x] Variables de entorno preparadas en KOYEB_ENV.txt
- [x] .gitignore protege credenciales
- [x] README con instrucciones completas
- [ ] **PENDIENTE:** Crear servicio en Koyeb
- [ ] **PENDIENTE:** Configurar variables en Koyeb
- [ ] **PENDIENTE:** Verificar deployment exitoso
- [ ] **PENDIENTE:** Actualizar FRONTEND_URL después de desplegar frontend

---

## 🧪 Cómo Verificar Deployment

Una vez desplegado en Koyeb, probar:

### 1. Health Check
```bash
curl https://tu-url.koyeb.app/api/health
```

Esperado:
```json
{
  "status": "OK",
  "timestamp": "2025-12-03T..."
}
```

### 2. Root Endpoint
```bash
curl https://tu-url.koyeb.app/
```

Esperado:
```json
{
  "mensaje": "API Landing MultiSalon funcionando correctamente",
  "version": "1.0.0",
  "puerto": 8000
}
```

### 3. Logs en Koyeb

Deberías ver:
```
╔═══════════════════════════════════════════════════════╗
║   🚀 Servidor Landing MultiSalon Iniciado            ║
║   🌐 URL: http://localhost:8000                      ║
║   📝 Ambiente: production                            ║
╚═══════════════════════════════════════════════════════╝
```

---

## 📞 Si Algo Sale Mal

### Error: "Application failed to start"

1. Revisa Koyeb Logs
2. Verifica que TODAS las variables estén configuradas
3. Especialmente `GOOGLE_APPLICATION_CREDENTIALS_JSON` (debe ser JSON completo)

### Error: "Firebase credentials not found"

1. Verifica que `GOOGLE_APPLICATION_CREDENTIALS_JSON` esté en Koyeb
2. Debe ser UNA línea (sin saltos extras)
3. Debe tener todos los campos del JSON

### Error: CORS en Frontend

1. Actualiza `FRONTEND_URL` en Koyeb con la URL de Firebase Hosting
2. Redeploy el servicio
3. Espera 2-3 minutos

---

## 🎉 Resultado Esperado

**Backend Landing desplegado en:**
```
https://landing-multisalon-backend-poetarivera.koyeb.app
```

**Costo:** $0/mes (Koyeb Free Tier)
**Uptime:** 24/7 (no se duerme)
**Deploy automático:** Cada `git push`

---

**Última actualización:** 3 de Diciembre 2025
**Estado:** ✅ LISTO PARA KOYEB
**Siguiente paso:** Crear servicio en Koyeb Dashboard
