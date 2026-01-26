
# 🏋️‍♂️ JokemGym Template - Guía de Despliegue

Este documento explica cómo utilizar el Template White-Label para crear y desplegar una nueva instancia de gimnasio.

## 📋 Paso 0: Prerrequisitos

Asegúrate de tener instalado en tu máquina:
1.  **Node.js** (v20 o superior).
2.  **Supabase CLI**: `npm install -g supabase`.
3.  **Git**.
4.  Una cuenta activa en [Supabase.com](https://supabase.com).

---

## 🧹 Paso 1: Clonar y Preparar

1.  Clona el repositorio:
    ```bash
    git clone <url-del-repo> nombre-nuevo-gimnasio
    cd nombre-nuevo-gimnasio/ui
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Borra la carpeta `.git` si quieres iniciar un historial limpio para este cliente (opcional).

---

## 🎨 Paso 2: Configurar Branding (Tenant)

La personalización se hace **sin tocar código**. Solo edita el archivo de configuración.

1.  Copia la plantilla:
    ```bash
    cp tenant.setup.json.example tenant.setup.json
    ```
2.  Edita `tenant.setup.json` con los datos del nuevo cliente:
    *   **id**: Usa un slug único (ej: `iron-gym-pty`).
    *   **displayName**: Nombre público (ej: "Iron Gym").
    *   **theme**: Elige los colores primarios (hex codes).
    *   **plans**: Habilita (`enabled: true`) los planes que ofrece el gym y pon sus precios reales.

---

## ☁️ Paso 3: Configurar Base de Datos (Supabase)

1.  Crea un nuevo proyecto en Supabase.
2.  Obtén las credenciales (`Project URL`, `Anon Key`) desde los Settings del proyecto.
3.  Crea el archivo `.env.local` basado en `.env.example`:
    ```bash
    cp .env.example .env.local
    ```
4.  Rellena las variables:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-publica
    # Opcional para despliegues automatizados (¡Cuidado! No subir al repo o usar Secrets)
    SUPABASE_SERVICE_ROLE_KEY=...
    ```
5.  Vincula el proyecto local con Supabase (te pedirá login):
    ```bash
    npx supabase link --project-ref <tu-project-id>
    ```
    *Nota: El Project ID es la parte `xyz` de tu URL `https://xyz.supabase.co`.*

---

## 🚀 Paso 4: Despliegue Maestro

El comando mágico que prepara todo (Frontend + Base de Datos):

```bash
npm run deploy:tenant
```

**¿Qué hace este comando?**
1.  **Build Config**: Lee tu `tenant.setup.json` y configura la UI y los Seeds SQL.
2.  **DB Push**: Sube la estructura de tablas (`supabase/migrations`) a tu proyecto Supabase.
3.  **Seed Prep**: Prepara los datos iniciales (planes, settings) para inserción.

> **Importante:** Si es la primera vez, para insertar los datos de configuración (precios, colores) en la DB, ejecuta:
> ```bash
> npx supabase db reset
> ```
> *Esto borrará cualquier dato previo en la DB remota y aplicará el seed limpio.*

---

## ✅ Verificación

1.  Arranca el servidor local:
    ```bash
    npm run dev
    ```
2.  Abre `http://localhost:3000`.
3.  Deberías ver:
    *   El logo y nombre de tu gimnasio.
    *   Los colores configurados.
    *   La pantalla de Login (funcional contra Supabase).

---

## 💡 Variables de Entorno (.env.local)

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de API Supabase | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Key pública segura | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | (Opcional) Admin key | `eyJ...` (Solo en scripts locales) |
| `APP_URL` | URL base de la app | `http://localhost:3000` |

---
*Template Version: 1.0.0 - Supabase Native*
