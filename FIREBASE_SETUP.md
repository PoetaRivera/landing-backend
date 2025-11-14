# 🔥 Configuración de Firebase - Backend Landing

## 📋 Desarrollo Local

### Opción 1: Usar archivo de credenciales (Recomendado)

1. **Obtener el archivo de credenciales Firebase:**
   - Si ya tienes el archivo del backend principal, cópialo aquí:
   ```bash
   cp ../../backend-salon-de-belleza/firebase.json ./firebase-credentials.json
   ```

2. **Configurar .env:**
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./firebase-credentials.json
   ```

3. **Verificar que esté en .gitignore:**
   ```bash
   # .gitignore debe contener:
   firebase-credentials.json
   firebase.json
   *-credentials.json
   ```

### Opción 2: Usar variables de entorno individuales

Si no tienes el archivo JSON, puedes usar variables individuales en `.env`:

```bash
# Descomentar estas líneas en .env:
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-project.iam.gserviceaccount.com
```

---

## 🚀 Producción

### Hosting en Render.com / Railway / Heroku

**NO subir el archivo de credenciales a Git.** En su lugar:

#### Opción A: Variable de entorno con JSON completo

1. Ir al dashboard de tu hosting
2. Agregar variable de entorno:
   ```
   Nombre: GOOGLE_APPLICATION_CREDENTIALS_JSON
   Valor: {todo el contenido del firebase-credentials.json}
   ```

3. Modificar `firebase.js` para leer de la variable:
   ```javascript
   // Opción 1: Archivo local (desarrollo)
   if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
     const serviceAccount = JSON.parse(
       readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')
     )
   }

   // Opción 2: Variable de entorno JSON (producción)
   if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
     const serviceAccount = JSON.parse(
       process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
     )
   }
   ```

#### Opción B: Variables individuales (Más seguro)

En el dashboard del hosting, agregar:

```
FIREBASE_PROJECT_ID=multisalon-xxxxx
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIE...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@multisalon.iam.gserviceaccount.com
```

**Nota:** La `PRIVATE_KEY` debe incluir los `\n` literalmente.

---

## 🔒 Seguridad

### ✅ Hacer siempre:

1. **Agregar a .gitignore:**
   ```bash
   firebase-credentials.json
   firebase.json
   *-credentials.json
   ```

2. **Verificar que no esté en Git:**
   ```bash
   git ls-files | grep credential
   # No debe retornar nada
   ```

3. **Si ya fue commiteado, removerlo:**
   ```bash
   git rm --cached firebase-credentials.json
   git commit -m "Remove credentials from Git"
   git push
   ```

### ❌ Nunca hacer:

- ❌ Commitear el archivo de credenciales
- ❌ Compartir las credenciales por email/chat
- ❌ Usar las mismas credenciales en proyectos públicos
- ❌ Hardcodear credenciales en el código

---

## 🧪 Verificar Configuración

### Desarrollo:

```bash
npm run dev
```

Deberías ver:
```
✅ GOOGLE_APPLICATION_CREDENTIALS: Archivo encontrado
✅ Firebase inicializado correctamente
```

### Producción:

Después de deploy, verificar logs:
```bash
# Render.com
render logs

# Railway
railway logs

# Heroku
heroku logs --tail
```

Buscar:
```
✅ Firebase inicializado correctamente
```

---

## 📞 Troubleshooting

### Error: ENOENT: no such file or directory

**Causa:** La ruta del archivo no es correcta

**Solución:**
```bash
# Verificar que el archivo existe
ls -la firebase-credentials.json

# Verificar la ruta en .env
cat .env | grep GOOGLE_APPLICATION_CREDENTIALS
```

### Error: Invalid service account

**Causa:** El JSON está malformado o es inválido

**Solución:**
```bash
# Validar que es un JSON válido
cat firebase-credentials.json | jq .
```

### Error: Permission denied

**Causa:** Permisos del archivo incorrectos

**Solución:**
```bash
chmod 600 firebase-credentials.json
```

---

## 📚 Referencias

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Service Account Credentials](https://cloud.google.com/iam/docs/service-accounts)
- [Environment Variables Best Practices](https://12factor.net/config)

---

**Última actualización:** 13 de Noviembre de 2025
