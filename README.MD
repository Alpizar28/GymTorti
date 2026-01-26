# JokemGym Template System 🏋️‍♂️

Este repositorio es un **TEMPLATE WHITE-LABEL** diseñado para crear instancias independientes de aplicaciones de gestión para gimnasios.

> **⚠️ IMPORTANTE:** Este código es una BASE. No debe correrse en producción tal cual. Cada gimnasio requiere su propio repositorio clonado y su propia configuración.

---

## 🏗️ Arquitectura del Sistema

El sistema utiliza un enfoque de **"Configuración como Código"** para garantizar que cada gimnasio sea único pero mantenible desde una base común.

### Componentes Clave

1.  **`tenant.setup.json` (Input):** Archivo JSON (privado por gym) que define TODO: nombre, colores, moneda, timezone, planes activos y precios.
2.  **`npm run tenant:build` (Motor):** Script que toma el JSON y genera:
    *   **Frontend Config:** `src/config/app.config.ts` (TypeScript estático).
    *   **Database Config:** `supabase/seed/seed.<id>.sql` (Datos SQL).
3.  **Guardrails:** La aplicación UI se bloquea si intentas correrla sin haber ejecutado el proceso de configuración, evitando que uses una versión "genérica" por error.

**🚫 NO Local Database**
Este template **NO UTILIZA** bases de datos locales (Docker, Postgres local, SQLite).
Cualquier intento de conexión a `localhost:5432` o similar es considerado un error de configuración.
El backend legacy Java ha sido deshabilitado (`_legacy_backend_disabled`) y el frontend conecta exclusivamente a Supabase.

---

## 🚀 Guía de Inicio Rápido (Crear nuevo Gym)

Sigue estos pasos para desplegar un nuevo cliente desde este template.

### 1. Preparación del Entorno
Clona este repositorio y entra en la carpeta `ui`:
```bash
git clone <url-repo-template> nuevo-gym
cd nuevo-gym/ui
npm install
```
> **Nota:** Si encuentras errores de dependencias (Module not found), asegúrate de haber corrido `npm install`.

### 2. Configuración del Tenant
1.  Duplica el archivo de ejemplo:
    ```bash
    cp tenant.setup.json.example tenant.setup.json
    ```
2.  Edita `tenant.setup.json` con los datos reales del cliente:
    *   **Branding:** Nombre, tagline, logo (ruta en `/public`).
    *   **Producto:** Moneda (USD, CRC, etc.), Timezone (America/Panama), Unidades.
    *   **Planes:** Habilita (`enabled: true`) solo los planes que el gym vende y define sus precios.

### 3. Generar Artefactos
Ejecuta el script de construcción del tenant. Esto transformará tu JSON en código y SQL.
```bash
npm run tenant:build
```
*Si todo sale bien, verás `✅ TENANT BUILD COMPLETE`.*

### 4. Configurar Base de Datos (Supabase)
1.  Crea un nuevo proyecto en Supabase para este cliente.
2.  Copia `.env.example` a `.env.local` y coloca las credenciales (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.).
    *   **⚠️ Seguridad:** NUNCA uses la `service_role` key en el frontend.
3.  Ve al **SQL Editor** de Supabase y ejecuta:
    1.  **Migración Core:** `supabase/migrations/001_core.sql` (Crea las tablas).
    2.  **Seed Generado:** `supabase/seed/seed.<tu-gym-id>.sql` (Inserta la configuración y planes).

### 5. Ejecutar
```bash
npm run dev
```
La aplicación debería iniciar con el branding, moneda y planes configurados.
El comando `dev` ejecuta automáticamente `npm run doctor` para verificar la salud del entorno.

---

## 🛠️ Comandos Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo (UI) tras ejecutar chequeos de salud (`doctor`). |
| `npm run tenant:build` | Genera/Actualiza la configuración basada en `tenant.setup.json`. |
| `npm run build` | Compila la aplicación Next.js para producción. |
| `npm run doctor` | Ejecuta verificaciones de entorno, dependencias y seguridad. |

---

## 🔧 Troubleshooting / Template Health Check

### Error "negated" en Tailwind / PostCSS
Si encuentras un error como `Missing field 'negated' on ScannerOptions`, es probable que haya un conflicto de caché con Tailwind v4.
**Solución:**
```bash
rm -rf .next node_modules package-lock.json
npm install
```

### Module not found
Si faltan dependencias (ej: `@radix-ui/*`):
```bash
npm install
```

### Template Health Check
Para verificar que todo está en orden sin levantar el servidor:
```bash
npm run doctor
```

---

## 📂 Estructura de Archivos Relevante

```text
ui/
├── tenant.setup.json.example   # Plantilla de configuración (copiar a .json)
├── scripts/
│   ├── tenant-build.ts         # Orquestador del build
│   ├── generate-app-config.ts  # Generador de TypeScript para UI
│   └── generate-seed-sql.ts    # Generador de SQL para DB
│   └── template-doctor.ts      # Script de chequeo de salud
├── src/
│   └── config/
│       ├── app.config.ts       # (GENERADO) Config final usada por la UI
│       └── plans.catalog.ts    # Catálogo universal de todos los planes posibles
└── supabase/
    ├── migrations/             # Schema base de la DB
    └── seed/                   # (GENERADO) Scripts de datos iniciales
```

## 🔐 Seguridad y Notas Técnicas

*   **Sin DB Local:** Este template no usa Docker ni BD local. Todo conecta a Supabase.
*   **Timezones:** El sistema respeta el timezone configurado en `product.config`.
*   **Aislamiento:** `tenant.setup.json` y `.env.local` están en `.gitignore` para evitar subir credenciales.
*   **Dependencies:** Las dependencias críticas (Next.js, Tailwind) están pinneadas en `package.json` para estabilidad.
