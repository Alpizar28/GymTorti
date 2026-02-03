# Sistema de Sincronización Automática de Estados

## 🎯 Problema Resuelto

**Antes:**
- Cliente nuevo → status = 'active' (manual)
- Registrar pago → crea subscription activa
- **Borrar pago → cliente sigue 'active' ❌ (inconsistencia)**

**Ahora:**
- Cliente nuevo → status = 'inactive' (sin subscripciones)
- Registrar pago → crea subscription → **cliente automáticamente 'active' ✅**
- Borrar pago → borra subscription → **cliente automáticamente 'inactive' ✅**

---

## 🔄 Cómo Funciona

### Trigger Automático en la Base de Datos

Cada vez que se **crea**, **actualiza** o **borra** una subscripción:

1. **Se verifica** si el cliente tiene al menos 1 subscripción activa y no vencida
2. **Se actualiza automáticamente** el estado del cliente:
   - `active` → Si tiene subscripción activa
   - `inactive` → Si NO tiene subscripciones activas

### Casos Cubiertos

| Acción | Resultado | Estado Cliente |
|--------|-----------|----------------|
| ➕ Crear subscripción activa | Automático | → `active` |
| 🗑️ Borrar subscripción | Automático | → `inactive` |
| ✏️ Desactivar subscripción (`active = false`) | Automático | → `inactive` |
| ⏰ Subscripción vence (`end_date` pasó) | Al actualizar | → `inactive` |
| ➕ Segunda subscripción activa | Automático | → `active` |
| 🗑️ Borrar una de varias subscripciones | Automático | → Verifica si quedan otras activas |

---

## 📝 Implementación Técnica

### 1. Función Principal: `sync_client_status()`

```sql
-- Verifica si el cliente tiene subscripciones activas
-- Actualiza el estado del cliente automáticamente
-- Se ejecuta después de INSERT, UPDATE, DELETE en subscriptions
```

**Lógica:**
```
SI existe al menos 1 subscripción donde:
  - active = true
  - end_date >= HOY
ENTONCES
  cliente.status = 'active'
SI NO
  cliente.status = 'inactive'
```

### 2. Triggers Creados

- **`sync_client_status_on_insert`** → Después de crear subscripción
- **`sync_client_status_on_update`** → Después de actualizar subscripción
- **`sync_client_status_on_delete`** → Después de borrar subscripción

### 3. Función Manual: `fix_all_client_statuses()`

Para corregir estados existentes o hacer mantenimiento:

```sql
-- Ejecutar en Supabase SQL Editor
SELECT * FROM fix_all_client_statuses();
```

Devuelve:
```
client_id | old_status | new_status | changed
----------|------------|------------|--------
uuid-123  | active     | inactive   | true
uuid-456  | inactive   | active     | true
```

---

## 🚀 Aplicar la Migración

### Opción 1: Usando Supabase CLI (Recomendado)

```bash
# Desde la carpeta ui/
npx supabase db push
```

### Opción 2: Manualmente en Supabase Dashboard

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Copia el contenido de `supabase/migrations/20260203_sync_client_status.sql`
3. Pégalo y ejecuta (**Run**)

Verás mensajes de confirmación:
```
Migration completada exitosamente!
Los estados de clientes ahora se sincronizan automáticamente.
...
```

---

## ✅ Verificación

### Prueba 1: Crear Cliente y Pago

```sql
-- 1. Crear cliente nuevo (debería ser inactive)
INSERT INTO clients (first_name, last_name, email, phone, status)
VALUES ('Test', 'Usuario', 'test@example.com', '12345678', 'inactive')
RETURNING id, status;

-- 2. Ver que es inactive
-- status = 'inactive' ✅

-- 3. Crear subscripción activa
INSERT INTO subscriptions (client_id, start_date, end_date, active)
VALUES ('<client_id>', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', true);

-- 4. Verificar que cliente ahora es active
SELECT status FROM clients WHERE id = '<client_id>';
-- status = 'active' ✅ (actualizado automáticamente)
```

### Prueba 2: Borrar Pago

```sql
-- 1. Cliente con subscripción activa (status = 'active')

-- 2. Borrar la subscripción
DELETE FROM subscriptions WHERE client_id = '<client_id>';

-- 3. Verificar que cliente es inactive
SELECT status FROM clients WHERE id = '<client_id>';
-- status = 'inactive' ✅ (actualizado automáticamente)
```

### Prueba 3: Subscripción Vence

```sql
-- 1. Actualizar end_date al pasado
UPDATE subscriptions 
SET end_date = CURRENT_DATE - INTERVAL '1 day'
WHERE client_id = '<client_id>';

-- 2. Verificar que cliente es inactive
SELECT status FROM clients WHERE id = '<client_id>';
-- status = 'inactive' ✅ (no tiene subscripciones activas vigentes)
```

---

## 🔍 Debugging y Mantenimiento

### Ver Clientes con Estado Inconsistente

```sql
-- Clientes que DEBERÍAN estar activos pero no lo están
SELECT c.id, c.first_name, c.last_name, c.status
FROM clients c
WHERE c.status != 'active'
  AND EXISTS (
    SELECT 1 FROM subscriptions s 
    WHERE s.client_id = c.id 
      AND s.active = true 
      AND s.end_date >= CURRENT_DATE
  );

-- Clientes que DEBERÍAN estar inactivos pero no lo están
SELECT c.id, c.first_name, c.last_name, c.status
FROM clients c
WHERE c.status != 'inactive'
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions s 
    WHERE s.client_id = c.id 
      AND s.active = true 
      AND s.end_date >= CURRENT_DATE
  );
```

### Corregir Todos los Estados

```sql
-- Ejecuta la función de corrección
SELECT * FROM fix_all_client_statuses();
```

### Ver Logs de Cambios

```sql
-- Ver últimas actualizaciones de clientes
SELECT id, first_name, last_name, status, updated_at
FROM clients
ORDER BY updated_at DESC
LIMIT 10;
```

---

## 🎨 Integración con la UI

El frontend **NO necesita cambios**. Los triggers funcionan automáticamente.

Pero puedes mejorar la UX mostrando el estado en tiempo real:

### En el Formulario de Pago:

```typescript
// Después de crear/borrar un pago
await createPayment(paymentData);

// Refrescar el cliente para ver el nuevo estado
const { data: updatedClient } = await supabase
  .from('clients')
  .select('status')
  .eq('id', clientId)
  .single();

// updatedClient.status estará actualizado automáticamente por el trigger
```

### Badge Dinámico:

```tsx
<Badge variant={client.status === 'active' ? 'success' : 'secondary'}>
  {client.status === 'active' ? '✅ Activo' : '❌ Inactivo'}
</Badge>
```

---

## ⚠️ Consideraciones Importantes

### 1. ¿Qué pasa con clientes nuevos?

**Recomendación:** Crear clientes siempre como `inactive`:

```typescript
await supabase.from('clients').insert({
  first_name: 'Juan',
  last_name: 'Pérez',
  email: 'juan@example.com',
  status: 'inactive', // ← Siempre inactive al crear
  // ... otros campos
});
```

Cuando se registre el primer pago → automáticamente pasa a `active`.

### 2. ¿Y si tengo datos existentes inconsistentes?

Ejecuta la función de corrección:

```sql
SELECT * FROM fix_all_client_statuses();
```

Esto corregirá todos los estados de una vez.

### 3. ¿Afecta el rendimiento?

**No significativamente.** Los triggers son muy eficientes:
- Solo se ejecutan cuando cambia una subscripción
- Solo actualizan el cliente afectado
- Usan índices existentes (client_id, active, end_date)

### 4. ¿Se puede desactivar temporalmente?

Sí, si necesitas hacer una migración masiva:

```sql
-- Desactivar triggers
ALTER TABLE subscriptions DISABLE TRIGGER sync_client_status_on_insert;
ALTER TABLE subscriptions DISABLE TRIGGER sync_client_status_on_update;
ALTER TABLE subscriptions DISABLE TRIGGER sync_client_status_on_delete;

-- ... hacer tus cambios ...

-- Reactivar triggers
ALTER TABLE subscriptions ENABLE TRIGGER sync_client_status_on_insert;
ALTER TABLE subscriptions ENABLE TRIGGER sync_client_status_on_update;
ALTER TABLE subscriptions ENABLE TRIGGER sync_client_status_on_delete;

-- Corregir estados
SELECT * FROM fix_all_client_statuses();
```

---

## 📊 Monitoreo

### Query útil para ver consistencia:

```sql
SELECT 
  COUNT(*) FILTER (WHERE c.status = 'active' AND has_active_sub) as correct_active,
  COUNT(*) FILTER (WHERE c.status = 'inactive' AND NOT has_active_sub) as correct_inactive,
  COUNT(*) FILTER (WHERE c.status = 'active' AND NOT has_active_sub) as wrong_active,
  COUNT(*) FILTER (WHERE c.status = 'inactive' AND has_active_sub) as wrong_inactive
FROM (
  SELECT 
    c.*,
    EXISTS (
      SELECT 1 FROM subscriptions s 
      WHERE s.client_id = c.id 
        AND s.active = true 
        AND s.end_date >= CURRENT_DATE
    ) as has_active_sub
  FROM clients c
) c;
```

Resultado esperado:
```
correct_active | correct_inactive | wrong_active | wrong_inactive
---------------|------------------|--------------|----------------
50             | 100              | 0            | 0
```

Si `wrong_active` o `wrong_inactive` > 0, ejecuta `fix_all_client_statuses()`.

---

## 🎯 Beneficios

✅ **Consistencia automática** - No más estados incorrectos  
✅ **Menos bugs** - La lógica está en la BD, no duplicada en el código  
✅ **Más simple** - El frontend no maneja la sincronización  
✅ **Confiable** - Los triggers son transaccionales  
✅ **Auditable** - `updated_at` se actualiza automáticamente  

---

**Última actualización:** 2026-02-03  
**Versión de migración:** 20260203_sync_client_status.sql
