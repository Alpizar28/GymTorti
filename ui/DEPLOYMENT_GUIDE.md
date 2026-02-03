# 🚀 Guía de Despliegue Paso a Paso (JokemGym SaaS)

Esta guía explica cómo desplegar un nuevo gimnasio (Tenant) desde cero. Sigue los pasos en orden para asegurar un funcionamiento correcto y seguro.

## 📋 Prerrequisitos

*   Acceso a **Supabase** (para crear bases de datos).
*   Acceso a **Vercel** (para hosting).
*   Acceso a **Resend** (para envío de correos).
*   Dominio propio (opcional, pero recomendado para emails).
*   CLI de Supabase instalado (`npm install -g supabase`).

---

## 1️⃣ Configuración del Tenant (Json)

Cada gimnasio se define por un archivo JSON.

1.  Ve a la carpeta `tenants/` en el proyecto.
2.  Duplica un archivo existente (ej. `gym-azul.json`) y renómbralo (ej. `gym-rojo.json`).
3.  Edita el archivo con la información del nuevo cliente:
    *   **`id`**: Identificador único (ej. `gym-rojo`).
    *   **`branding`**: Colores, URL del logo, redes sociales.
    *   **`product`**: Moneda (USD/CRC), impuestos.
    *   **`email`**: Configuración de recordatorios.

**Ejemplo:**
```json
{
  "tenant": {
    "id": "gym-rojo",
    "displayName": "Gym Rojo Fitness",
    "website": "https://gymrojo.com"
  },
  ...
}
```

---

## 2️⃣ Base de Datos (Supabase)

Cada gimnasio debe tener su PROPIA base de datos aislada.

1.  **Crear Proyecto:**
    *   Ve a [Supabase Dashboard](https://supabase.com/dashboard).
    *   Crea un nuevo proyecto: `gym-rojo-db`.
    *   Guarda la contraseña de la base de datos segura.
    *   Una vez creado, ve a **Settings > API** y copia:
        *   `Project URL`
        *   `anon public` Key
        *   `service_role` Key (¡Secreto!)

2.  **Aplicar Estructura (Migraciones):**
    Desde tu terminal local (en la carpeta del proyecto):
    ```bash
    # Login si no lo has hecho
    npx supabase login

    # Vincular proyecto (te pedirá la password DB)
    npx supabase link --project-ref <PROJECT_REF_DE_SUPABASE>

    # Subir tablas y funciones a la nube
    npx supabase db push
    ```

3.  **Habilitar Auth (Usuarios):**
    *   En Supabase Dashboard > **Authentication** > **Providers**.
    *   Asegúrate de que "Email" está habilitado.
    *   Deshabilita "Confirm email" si quieres registro inmediato sin verificación (opcional).

---

## 3️⃣ Correos Electrónicos (Resend)

Nota: Si no usas dominio propio, solo podrás enviar emails a la dirección registrada en Resend (modo testing).

1.  **Crear API Key:**
    *   Ve a [Resend](https://resend.com).
    *   Crea una API Key nueva. Nómbrala `gym-rojo`.
    *   Guárdala (comienza con `re_...`).

2.  **Configurar Dominio (Recomendado):**
    *   En Resend > **Domains** > **Add Domain**.
    *   Ingresa el dominio del gimnasio (ej. `gymrojo.com`).
    *   Resend te dará unos registros DNS (tipo `MX`, `TXT`).
    *   Ve a tu proveedor de dominio (GoDaddy, Namecheap, Cloudflare) y agrega esos registros.
    *   Haz clic en "Verify DNS Records" en Resend hasta que salgan en verde.

---

## 4️⃣ Hosting (Vercel)

Aquí es donde subimos la aplicación web.

1.  Ve a [Vercel Dashboard](https://vercel.com/dashboard).
2.  **Add New...** > **Project**.
3.  Importa el repositorio de `JokemGym-Template`.
4.  Nombra el proyecto: `gym-rojo-app`.
5.  **Configuración del Build:**
    *   Abre la sección "Build and Output Settings".
    *   **Build Command:** `npm run build:prod`
    *   *(Esto es vital para que lea el JSON correcto)*.

6.  **Variables de Entorno (Environment Variables):**
    Agrega las siguientes variables con los datos que obtuviste en los pasos 2 y 3:

| Nombre Variable | Valor | Descripción |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xyz.supabase.co` | URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Clave Pública (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Clave Privada (service_role) |
| `RESEND_API_KEY` | `re_123...` | API Key de Resend |
| `CRON_SECRET` | `genera_un_uuid_o_texto_largo` | Secreto para proteger Cron Jobs |
| **`TENANT_FILE`** | `gym-rojo.json` | **¡IMPORTANTE!** Nombre del archivo JSON |

7.  Haz clic en **Deploy**.

---

## 5️⃣ Automatización (Cron Jobs)

Los recordatorios de pago se ejecutan automáticamente a las 2:00 PM (hora configurada en `vercel.json`).

1.  Para que funcionen, asegúrate de haber configurado `CRON_SECRET` en Vercel (paso anterior).
2.  Vercel ejecutará el trabajo diariamente.
3.  Puedes ver los logs en Vercel > Project > **Logs** para verificar si se enviaron correos.

---

## ✅ ¡Listo!

El gimnasio está desplegado y operando.

*   URL: `https://gym-rojo-app.vercel.app` (o su dominio propio).
*   Base de Datos: Segura y aislada.
*   Emails: Funcionando.

### Mantenimiento Futuro
Si haces mejoras al código en el Template:
1.  Haz `push` a GitHub.
2.  Vercel re-desplegará automáticamente **todos** los proyectos conectados (Gym Azul, Gym Rojo, etc.) con las mejoras, manteniendo cada uno su configuración única.
