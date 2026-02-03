# Sistema de Templates de Email - JokemGym

Sistema profesional de templates de email HTML responsivos con branding personalizado por tenant.

## 📁 Ubicación

`src/lib/email-templates.ts`

## 🎨 Características

- ✅ **Diseño responsivo** - Se ve bien en móvil y escritorio
- ✅ **Branding personalizado** - Usa las colores y logo del gym
- ✅ **Múltiples templates** - Recordatorios, bienvenida, etc.
- ✅ **Gradientes modernos** - Efectos visuales profesionales
- ✅ **Redes sociales** - Links integrados automáticamente
- ✅ **Fácil de personalizar** - Configuración por tenant

## 📧 Templates Disponibles

### 1. Recordatorio Próximo (`reminderSoonTemplate`)

Usado cuando la membresía está próxima a vencer (ej: 3 días antes, 1 día antes).

**Características:**
- Destaca los días restantes
- Color primario del gym
- Call-to-action para renovar
- Tono amigable y motivacional

**Uso:**
```typescript
const html = reminderSoonTemplate(emailConfig, {
  clientName: 'María',
  expirationDate: '15/02/2026',
  daysRem aining: 3,
  renewUrl: 'https://gym.com/renovar' // opcional
});
```

### 2. Vence HOY (`dueTodayTemplate`)

Usado cuando la membresía vence el mismo día.

**Características:**
- Color de alerta (rojo)
- Mensaje urgente
- CTA prominente
- Diseño llamativo

**Uso:**
```typescript
const html = dueTodayTemplate(emailConfig, {
  clientName: 'Carlos',
  expirationDate: '15/02/2026',
  renewUrl: 'https://gym.com/renovar' // opcional
});
```

### 3. Bienvenida (`welcomeTemplate`)

Para nuevos miembros del gym.

**Características:**
- Mensaje de bienvenida cálido
- Lista de beneficios
- Info del plan contratado
- Tono motivacional

**Uso:**
```typescript
const html = welcomeTemplate(emailConfig, {
  clientName: 'Ana',
  membershipType: 'Plan Mensual',
  startDate: '01/02/2026'
});
```

## ⚙️ Configuración

### Crear configuración de email desde tenant config:

```typescript
import { createEmailConfigFromTenant } from '@/lib/email-templates';
import tenantConfig from './tenant.setup.json';

const emailConfig = createEmailConfigFromTenant(tenantConfig);
```

### Configuración manual:

```typescript
const emailConfig: EmailTemplateConfig = {
  gymName: 'Gym Azul',
  gymTagline: 'Transforma tu vida',
  primaryColor: '#007bff',
  secondaryColor: '#00d4ff',
  logoUrl: 'https://gym.com/logo.png',
  websiteUrl: 'https://gym.com',
  socialMedia: {
    instagram: 'https://instagram.com/gymazul',
    facebook: 'https://facebook.com/gymazul',
    whatsapp: 'https://wa.me/50612345678'
  }
};
```

## 🎨 Personalización de Branding

### En `tenant.setup.json` o `tenants/gym-azul.json`:

```json
{
  "branding": {
    "gymName": "Gym Azul",
    "gymTagline": "Transforma tu vida",
    "colors": {
      "primary": "#007bff",
      "secondary": "#00d4ff"
    },
    "logoPath": "https://ejemplo.com/logo.png",
    "socialMedia": {
      "instagram": "https://instagram.com/gymazul",
      "facebook": "https://facebook.com/gymazul",
      "whatsapp": "https://wa.me/50612345678"
    }
  },
  "tenant": {
    "website": "https://gymazul.com"
  }
}
```

## 🎨 Elementos de Diseño

### Colores

Los templates usan:
- **Color Primario**: Headers, CTAs, acentos
- **Color Secundario**: Gradientes
- **Grises**: Texto secundario y fondos

### Tipografía

- **Fuente principal**: System fonts (San Francisco, Segoe UI, Roboto)
- **Headers**: Bold, tamaños grandes
- **Cuerpo**: Regular, line-height 1.6

### Componentes

#### Header
- Logo opcional
- Nombre del gym en gradiente
- Tagline opcional

#### Highlight Box
- Fondo con gradiente suave
- Borde izquierdo con color primario
- Perfecto para fechas importantes

#### CTA Button
- Gradiente con sombra
- Bordes redondeados
- Efecto hover

#### Footer
- Links de redes sociales
- Copyright automático
- Link al sitio web

## 📱 Responsive Design

Los templates se adaptan automáticamente a:

- **Desktop**: Layout completo con espaciados amplios
- **Mobile**: Texto más pequeño, padding reducido
- **Tablet**: Intermedio

## 🧪 Testing

### Preview local:

```typescript
// Crear HTML de prueba
const html = reminderSoonTemplate(emailConfig, {
  clientName: 'Test User',
  expirationDate: '15/02/2026',
  daysRemaining: 3
});

// Guardar en archivo
fs.writeFileSync('preview.html', html);
```

### Enviar email de prueba:

```typescript
const emailConfig = createEmailConfigFromTenant(tenantConfig);

await sendEmail({
  to: 'tu-email@ejemplo.com',
  subject: 'Test Template',
  html: reminderSoonTemplate(emailConfig, { /* ... */ }),
  fromName: 'Gym Test',
  fromEmail: 'test@gym.com'
});
```

## 🛠️ Crear Nuevos Templates

### 1. Añadir función en `email-templates.ts`:

```typescript
export function customTemplate(
  config: EmailTemplateConfig,
  data: {
    // tus datos aquí
  }
): string {
  const content = `
    <h2 class="greeting">Título</h2>
    <p class="message">Tu mensaje aquí</p>
    <!-- Más HTML -->
  `;
  
  return createBaseTemplate(config, content);
}
```

### 2. Clases CSS disponibles:

- `.greeting` - Saludo principal
- `.message` - Párrafo de mensaje
- `.highlight-box` - Caja destacada
- `.highlight-label` - Label pequeño
- `.highlight-value` - Valor grande
- `.cta-button` - Botón de acción
- `.divider` - Línea divisoria

### 3. Usar en tu código:

```typescript
import { customTemplate } from '@/lib/email-templates';

const html = customTemplate(emailConfig, {
  // tus datos
});
```

## 📊 Mejores Prácticas

### ✅ DO

- Usa siempre `createBaseTemplate()` para consistencia
- Mantén el HTML simple y compatible
- Usa las clases CSS predefinidas
- Prueba en múltiples clientes de email
- Incluye texto alternativo para imágenes

### ❌ DON'T

- No uses JavaScript en emails
- No uses CSS complejo (flexbox, grid)
- No abuses de las imágenes
- No olvides el texto alternativo
- No uses fuentes externas (solo web-safe)

## 🔍 Compatibilidad

Los templates están optimizados para:

- ✅ Gmail (web y app)
- ✅ Outlook (web, desktop, app)
- ✅ Apple Mail
- ✅ Yahoo Mail
- ✅ Resend
- ✅ SendGrid
- ✅ Mailgun

## 🎯 Conversión y UX

### Tips para mejorar engagement:

1. **Subject lines** claros y urgentes
2. **Personalización** (usar nombre del client e)
3. **CTAs visibles** y con copy accionable
4. **Diseño limpio** sin distracciones
5. **Mobile-first** (60% de emails se abren en móvil)

## 📈 Métricas Recomendadas

Trackear:
- Tasa de apertura
- Tasa de clicks (CTR)
- Conversiones (renovaciones)
- Tiempo de respuesta

## 🔗 Recursos

- [Email Design Best Practices](https://www.campaignmonitor.com/best-practices/)
- [Can I Email?](https://www.caniemail.com/) - Compatibilidad CSS
- [Really Good Emails](https://reallygoodemails.com/) - Inspiración

---

**Última actualización:** 2026-02-03  
**Versión:** 1.0.0
