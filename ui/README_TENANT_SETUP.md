# TENANT SETUP GUIDE

Sistema de configuración white-label para JokemGym.

## 1. Configuración Inicial

1. Duplica el archivo de ejemplo:
   ```bash
   cp tenant.setup.json.example tenant.setup.json
   ```
2. Edita `tenant.setup.json` con la información del gimnasio (Timezone, Moneda, Branding, Planes).

## 2. Generar Artefactos

Ejecuta el comando de build para regenerar la configuración de UI y los scripts de base de datos:

```bash
npm run tenant:build
```

Esto generará:
- `src/config/app.config.ts`: Configuración estática para el Frontend.
- `supabase/seed/seed.<tenantId>.sql`: Script SQL con los datos del tenant.

## 3. Base de Datos (Supabase)

### Migración Inicial (Solo la primera vez)
Ejecuta el SQL core para crear las tablas necesarias:
- Archivo: `supabase/migrations/001_core.sql`
- Puedes correrlo en el SQL Editor de Supabase.

### Aplicar Configuración (Seed)
Cada vez que cambies `tenant.setup.json` y hagas build, aplica el seed generado:
- Archivo: `supabase/seed/seed.<tenantId>.sql`
- Córrelo en el SQL Editor de Supabase para actualizar precios, reglas y settings.

## 4. Variables de Entorno
Asegúrate de que tu `.env` local y de producción apunten al proyecto Supabase correcto.
