# 🧪 Guía de Pruebas de Email

Guía completa para probar los templates de email del sistema de recordatorios.

## 📋 Opciones de Prueba

### ✅ Opción 1: Preview Local (Sin enviar emails)

**Ventajas:** Rápido, no requiere configuración, ideal para ver diseño

```bash
# Generar previews HTML
npm run preview:emails

# O manualmente:
npx tsx scripts/preview-email-templates.ts
```

Esto creará la carpeta `email-previews/` con archivos HTML que puedes abrir en el navegador.

**Archivos generados:**
- `index.html` - Página principal con enlaces
- `1-reminder-3-days.html` - Recordatorio 3 días antes
- `2-reminder-1-day.html` - Recordatorio 1 día antes  
- `3-due-today.html` - Vence hoy
- `4-welcome.html` - Bienvenida

---

### ✅ Opción 2: Envío de Prueba Real

**Ventajas:** Prueba el envío real, inbox testing, compatibilidad de clientes

**Requisitos:**
- `RESEND_API_KEY` configurado en `.env.local`

```bash
# 1. Configurar email de prueba (opcional)
export TEST_EMAIL=tu-email@ejemplo.com

# 2. Enviar emails de prueba
npm run test:emails

# O manualmente:
npx tsx scripts/test-send-email.ts
```

Recibirás 3 emails de prueba con el prefijo `[TEST]` en el asunto.

---

### ✅ Opción 3: Endpoint de Producción

**Ventajas:** Prueba el flujo completo, usa datos reales de la BD

#### Paso 1: Insertar datos de prueba en Supabase

```sql
-- Ejecuta este SQL en Supabase Dashboard > SQL Editor
-- (Contenido de: supabase/seed/test-email-reminders.sql)

-- Primero limpia datos de prueba anteriores (opcional)
DELETE FROM payments WHERE client_id IN (SELECT id FROM clients WHERE notes LIKE '%Cliente de prueba%');
DELETE FROM subscriptions WHERE client_id IN (SELECT id FROM clients WHERE notes LIKE '%Cliente de prueba%');
DELETE FROM clients WHERE notes LIKE '%Cliente de prueba%';

-- Luego copia y pega todo el contenido de test-email-reminders.sql
```

#### Paso 2: Llamar al endpoint

**Desde el navegador:**
```
https://tu-dominio.vercel.app/api/cron/reminders
```

**Desde curl:**
```bash
curl https://tu-dominio.vercel.app/api/cron/reminders
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "processed": 10,
    "sent": 3,
    "success": 3,
    "failed": 0,
    "details": [...]
  },
  "message": "Processed 10 subscriptions, sent 3 emails successfully",
  "timestamp": "2026-02-03T..."
}
```

#### Paso 3: Verificar emails

Revisa tu bandeja de entrada en `jokemtech@gmail.com` (o el email configurado).

---

## 🎯 Qué Probar

### Diseño Visual
- ✅ Logo se muestra correctamente
- ✅ Colores del gym están aplicados
- ✅ Gradientes se ven bien
- ✅ Texto es legible
- ✅ Botones CTA son visibles

### Responsividad
- ✅ Se ve bien en móvil (prueba con width reducido)
- ✅ Se ve bien en desktop
- ✅ Se ve bien en tablet

### Contenido
- ✅ Nombre del cliente se muestra
- ✅ Fechas son correctas
- ✅ Días restantes son correctos
- ✅ Links funcionan (si hay)
- ✅ Redes sociales aparecen

### Compatibilidad de Email Clients
Prueba en:
- ✅ Gmail (web)
- ✅ Gmail (app móvil)
- ✅ Outlook (web)
- ✅ Apple Mail (si tienes Mac/iPhone)

---

## 🔧 Configuración Necesaria

### Para Envío Real (Opción 2 y 3)

#### 1. Variables de Entorno en `.env.local`:

```env
# Resend API
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Email de prueba (opcional, default: jokemtech@gmail.com)
TEST_EMAIL=tu-email@ejemplo.com

# Supabase (ya deberías tenerlas)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

#### 2. Variables en Vercel (para producción):

Ir a **Vercel Dashboard** → **Settings** → **Environment Variables**

Agregar:
- `RESEND_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET` (opcional, para proteger el endpoint)

---

## 🐛 Troubleshooting

### "Unauthorized" al llamar endpoint
**Problema:** El endpoint requiere autenticación  
**Solución:** La auth está desactivada temporalmente. Si sigue fallando, revisa el código en `src/app/api/cron/reminders/route.ts`

### "You can only send to your own email"
**Problema:** Resend plan gratuito solo permite enviar a tu email registrado  
**Solución:** Usa el email con el que te registraste en Resend, o verifica un dominio

### "Domain not verified"
**Problema:** El dominio `jokem.tech` no está verificado  
**Solución:** Usa `onboarding@resend.dev` como `fromEmail` (ya configurado en `tenant.setup.json`)

### No recibo emails
**Checklist:**
1. ✅ Revisar carpeta de spam
2. ✅ Verificar que `RESEND_API_KEY` es correcta
3. ✅ Confirmar que el email de destino es correcto
4. ✅ Ver logs en Resend Dashboard
5. ✅ Esperar 1-2 minutos (puede tardar)

### Emails se ven mal en Outlook
**Solución:** Outlook tiene limitaciones con CSS. Los gradientes pueden verse más simples, pero el contenido debe ser legible.

---

## 📊 Métricas a Observar

Después de enviar emails reales:

### En Resend Dashboard:
- Tasa de entrega (Delivery rate)
- Tasa de apertura (Open rate)
- Tasa de clicks (Click rate)
- Bounces y rechazos

### En tu aplicación:
- Logs del endpoint (`console.log` en route.ts)
- Success vs Failed en la respuesta JSON
- Errores específicos por cliente

---

## 🎨 Personalizar Templates

### Cambiar colores:

En `tenants/gym-azul.json`:
```json
{
  "branding": {
    "colors": {
      "primary": "#FF6B6B",
      "secondary": "#4ECDC4"
    }
  }
}
```

### Cambiar logo:

```json
{
  "branding": {
    "logoPath": "https://tu-cdn.com/logo.png"
  }
}
```

### Cambiar textos:

Edita directamente en `src/lib/email-templates.ts` las funciones:
- `reminderSoonTemplate()`
- `dueTodayTemplate()`
- `welcomeTemplate()`

---

## 📚 Recursos

- [Resend Dashboard](https://resend.com/emails)
- [Supabase SQL Editor](https://supabase.com/dashboard)
- [Email Templates Doc](./EMAIL_TEMPLATES.md)
- [Can I Email?](https://www.caniemail.com/) - Compatibilidad CSS

---

## 🚀 Comandos Rápidos

```bash
# Preview local
npm run preview:emails

# Enviar prueba real
npm run test:emails

# Ver logs del cron (Vercel)
vercel logs --follow

# Ejecutar cron manualmente
curl https://tu-dominio.vercel.app/api/cron/reminders
```

---

**💡 Tip:** Empieza con la Opción 1 (Preview Local) para ver el diseño rápidamente, luego usa Opción 2 para probar el envío real antes de ir a producción con Opción 3.
