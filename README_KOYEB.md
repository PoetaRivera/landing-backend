# 🚀 Deployment en Koyeb - Landing MultiSalon Backend

Guía paso a paso para desplegar el backend del landing en Koyeb.

---

## 📋 Pre-requisitos

- ✅ Repositorio en GitHub: `https://github.com/PoetaRivera/landing-backend.git`
- ✅ Cuenta en Koyeb: https://koyeb.com (gratis)
- ✅ Archivo `KOYEB_ENV.txt` con todas las variables listas

---

## 🎯 Paso 1: Crear Servicio en Koyeb

### 1.1 Ir a Koyeb Dashboard

1. Ve a https://app.koyeb.com
2. Click en **"Create Web Service"**

### 1.2 Configurar Repositorio

**Deployment method:**
- Selecciona: **"GitHub"**
- Click en **"Connect GitHub"** (autoriza si es primera vez)
- Selecciona el repositorio: **`PoetaRivera/landing-backend`**
- Branch: **`main`**

### 1.3 Configurar Build

**Builder:** `Buildpack`

**Build and Deployment settings:**
- **Build command:** (dejar vacío - usa `npm install` automáticamente)
- **Run command:** `npm start`

### 1.4 Configurar Instancia

**Instance:**
- **Type:** `Web`
- **Name:** `landing-multisalon-backend` (o cualquier nombre)
- **Region:** `Frankfurt (EU)` o el más cercano
- **Instance type:** `Free` (Nano - 512MB RAM)

### 1.5 Configurar Networking

**Ports:**
- **Port:** `8000` (Koyeb lo asigna automáticamente a este puerto)
- **Protocol:** `HTTP`

---

## ⚙️ Paso 2: Configurar Variables de Entorno

### 2.1 En Koyeb Dashboard

1. En la configuración del servicio, ve a **"Environment variables"**
2. Click en **"Add Variable"**

### 2.2 Agregar Variables

Abre el archivo `KOYEB_ENV.txt` y copia cada variable **una por una**:

```bash
NODE_ENV=production
PORT=8000
JWT_SECRET=539b6a68c2801b0f1d7a86f31f621b112448da2e9cb3a7c760e525af95ff57a044a4234ab45b09f40c2ff458d8696164cfd987f2950446d6a7307852357eba96
JWT_EXPIRES_IN=24h
# ... (continuar con todas las demás)
```

**⚠️ IMPORTANTE para GOOGLE_APPLICATION_CREDENTIALS_JSON:**
- Copia TODO el JSON completo (desde `{` hasta `}`)
- Debe ser UNA SOLA LÍNEA (sin saltos adicionales)
- Koyeb acepta valores largos, no hay problema

### 2.3 Variables Críticas

Asegúrate de agregar TODAS estas:

- ✅ `NODE_ENV`
- ✅ `PORT`
- ✅ `JWT_SECRET`
- ✅ `JWT_EXPIRES_IN`
- ✅ `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- ✅ `EMAIL_USER`
- ✅ `EMAIL_PASSWORD`
- ✅ `EMAIL_ADMIN`
- ✅ `CLOUDINARY_CLOUD_NAME`
- ✅ `CLOUDINARY_API_KEY`
- ✅ `CLOUDINARY_API_SECRET`
- ✅ `FRONTEND_URL` (temporal: `http://localhost:5174`)

---

## 🚢 Paso 3: Deploy

1. Revisa toda la configuración
2. Click en **"Create Service"**
3. Koyeb comenzará a:
   - Clonar el repositorio
   - Instalar dependencias (`npm install`)
   - Iniciar el servidor (`npm start`)

**Tiempo estimado:** 3-5 minutos

---

## ✅ Paso 4: Verificación

### 4.1 Obtener URL del Backend

Una vez desplegado, Koyeb te dará una URL como:

```
https://landing-multisalon-backend-poetarivera.koyeb.app
```

### 4.2 Probar Endpoints

**Health Check:**
```bash
curl https://tu-url.koyeb.app/api/health
```

Deberías ver:
```json
{
  "status": "OK",
  "timestamp": "2025-12-03T..."
}
```

**Root:**
```bash
curl https://tu-url.koyeb.app/
```

Deberías ver:
```json
{
  "mensaje": "API Landing MultiSalon funcionando correctamente",
  "version": "1.0.0",
  "puerto": 8000
}
```

---

## 🔄 Paso 5: Actualizar FRONTEND_URL

Después de desplegar el frontend en Firebase Hosting, necesitarás actualizar esta variable:

1. Ve a Koyeb Dashboard → Tu servicio → **"Settings"**
2. Ve a **"Environment variables"**
3. Edita `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://tu-proyecto.web.app
   ```
4. Click en **"Save"**
5. Koyeb redesplegará automáticamente (1-2 minutos)

---

## 📊 Monitoreo

### Ver Logs

En Koyeb Dashboard:
1. Ve a tu servicio
2. Click en **"Logs"**
3. Verás logs en tiempo real

Deberías ver el mensaje de inicio:
```
╔═══════════════════════════════════════════════════════╗
║   🚀 Servidor Landing MultiSalon Iniciado            ║
║   🌐 URL: http://localhost:8000                      ║
║   📝 Ambiente: production                            ║
║   💳 Stripe: undefined                               ║
╚═══════════════════════════════════════════════════════╝
```

### Ver Métricas

- **Uptime:** 99.9% (Koyeb no se duerme)
- **CPU:** < 5% en reposo
- **RAM:** ~100-150MB en reposo
- **Requests:** Visible en dashboard

---

## 🔄 Redeploy Automático

Cada vez que hagas `git push` al repositorio, Koyeb redesplegará automáticamente:

```bash
cd backend
git add .
git commit -m "Update: descripción del cambio"
git push
```

Koyeb detectará el push y redesplegará en 3-5 minutos.

---

## 🐛 Troubleshooting

### Error: "Application failed to start"

**Causa:** Variables de entorno mal configuradas o faltantes

**Solución:**
1. Ve a Koyeb Logs
2. Busca el error específico
3. Verifica que todas las variables estén configuradas
4. Especialmente revisa `GOOGLE_APPLICATION_CREDENTIALS_JSON`

### Error: "Port 8000 is already in use"

**Causa:** Configuración incorrecta del puerto

**Solución:**
1. Asegúrate que `PORT=8000` está en las variables
2. Koyeb asigna automáticamente el puerto correcto

### Error: "Firebase credentials not found"

**Causa:** `GOOGLE_APPLICATION_CREDENTIALS_JSON` mal formateado

**Solución:**
1. Verifica que el JSON esté completo
2. Debe ser UNA línea (sin saltos adicionales)
3. Debe tener todos los campos desde `type` hasta `universe_domain`

### Error: CORS en frontend

**Causa:** `FRONTEND_URL` no actualizado después de desplegar frontend

**Solución:**
1. Actualiza `FRONTEND_URL` con la URL de Firebase Hosting
2. Redeploy en Koyeb
3. Espera 2-3 minutos

---

## 📝 Checklist de Deployment

- [ ] Servicio creado en Koyeb
- [ ] Repositorio conectado (PoetaRivera/landing-backend)
- [ ] Variables de entorno configuradas (13 variables)
- [ ] `GOOGLE_APPLICATION_CREDENTIALS_JSON` completo
- [ ] Deploy exitoso
- [ ] `/api/health` responde 200 OK
- [ ] `/` responde con mensaje de bienvenida
- [ ] Logs muestran servidor iniciado

---

## 🎉 ¡Listo!

Tu backend está desplegado en:
```
https://landing-multisalon-backend-poetarivera.koyeb.app
```

**Próximos pasos:**
1. Desplegar frontend en Firebase Hosting
2. Actualizar `FRONTEND_URL` en Koyeb
3. Probar flujo completo (landing → backend → Firestore)

---

## 📞 Soporte

**Logs en Koyeb:**
- Dashboard → Tu servicio → Logs

**Errores comunes:**
- Revisar variables de entorno
- Verificar Firebase credentials
- Confirmar que el repo está actualizado

---

**Última actualización:** Diciembre 2025
**Backend:** Landing MultiSalon
**Hosting:** Koyeb Free Tier
**Costo:** $0/mes
