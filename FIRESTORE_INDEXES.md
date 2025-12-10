# Índices de Firestore para Landing MultiSalon

## ⚠️ Estado Actual

**Solución Temporal Implementada:** Ordenamiento en memoria cuando hay filtros activos.

Esta solución funciona correctamente para volúmenes bajos/medios de datos (<1000 registros por colección). Para escala mayor, se recomienda implementar índices compuestos.

## 📋 Índices Recomendados

### Colección: `landing-page/data/solicitudes`

```json
{
  "collectionGroup": "solicitudes",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "estado",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "fechaCreacion",
      "order": "DESCENDING"
    }
  ]
}
```

**Justificación:** Filtro por estado + ordenamiento por fecha (query más común en admin panel).

### Colección: `landing-page/data/solicitudes` (por plan)

```json
{
  "collectionGroup": "solicitudes",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "plan",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "fechaCreacion",
      "order": "DESCENDING"
    }
  ]
}
```

**Justificación:** Filtro por plan + ordenamiento por fecha.

### Colección: `landing-page/data/clientes`

```json
{
  "collectionGroup": "clientes",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "estado",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "fechaCreacion",
      "order": "DESCENDING"
    }
  ]
}
```

**Justificación:** Filtro por estado + ordenamiento por fecha.

### Colección: `landing-page/data/clientes` (por plan)

```json
{
  "collectionGroup": "clientes",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "planSeleccionado",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "fechaCreacion",
      "order": "DESCENDING"
    }
  ]
}
```

**Justificación:** Filtro por plan + ordenamiento por fecha.

## 🚀 Cómo Implementar

### Opción 1: Firebase Console (Manual)

1. Ve a: https://console.firebase.google.com/project/adminmisalons/firestore/indexes
2. Click en "Crear índice"
3. Selecciona colección: `solicitudes` (dentro de `landing-page/data`)
4. Agrega campos:
   - `estado` - ASC
   - `fechaCreacion` - DESC
5. Repite para los demás índices

### Opción 2: CLI (Recomendado)

1. Crear archivo `firestore.indexes.json` en la raíz del proyecto:

```json
{
  "indexes": [
    {
      "collectionGroup": "solicitudes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "estado", "order": "ASCENDING" },
        { "fieldPath": "fechaCreacion", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "solicitudes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "plan", "order": "ASCENDING" },
        { "fieldPath": "fechaCreacion", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "clientes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "estado", "order": "ASCENDING" },
        { "fieldPath": "fechaCreacion", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "clientes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "planSeleccionado", "order": "ASCENDING" },
        { "fieldPath": "fechaCreacion", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

2. Ejecutar:
```bash
firebase deploy --only firestore:indexes
```

### Opción 3: Automático (desde error)

Cuando Firestore detecta una query que necesita índice, el error incluye un link directo para crearlo:

```
Error: The query requires an index. You can create it here:
https://console.firebase.google.com/v1/r/project/adminmisalons/...
```

Click en el link y Firebase creará el índice automáticamente.

## ⏱️ Tiempo de Creación

Los índices tardan entre **5-30 minutos** en crearse (dependiendo del volumen de datos existente).

## 📊 Beneficios de los Índices

| Aspecto | Sin Índices (actual) | Con Índices |
|---------|---------------------|-------------|
| **Queries sin filtro** | ✅ Rápido (orderBy directo) | ✅ Rápido |
| **Queries con filtro** | ⚠️ Ordena en memoria | ✅ Ordenado en DB |
| **Límite de registros** | ⚠️ Lee todos, filtra después | ✅ Lee solo los necesarios |
| **Escalabilidad** | ❌ Lento con >1000 registros | ✅ Rápido con cualquier volumen |
| **Costo Firestore** | ⚠️ Lee docs innecesarios | ✅ Solo lee docs filtrados |

## 🔄 Migración Futura

Una vez creados los índices, modificar `admin.controller.js`:

```javascript
// Cambiar de:
const tieneFiltros = estado || plan
if (!tieneFiltros) {
  query = query.orderBy('fechaCreacion', 'desc')
}

// A:
// Siempre usar orderBy (los índices lo soportan)
query = query.orderBy('fechaCreacion', 'desc')
```

Y remover el ordenamiento en memoria.

## 📝 Notas

- Los índices ocupan espacio en Firestore (negligible para este volumen)
- Firestore mantiene automáticamente los índices actualizados
- No afectan las writes, solo las reads
- Se pueden eliminar sin afectar los datos

---

**Última actualización:** Diciembre 2024
**Estado:** Pendiente de implementación
