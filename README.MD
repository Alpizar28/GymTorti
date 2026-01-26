# JokemGym Template System 🏋️‍♂️

Este repositorio es un **TEMPLATE WHITE-LABEL** diseñado para crear instancias independientes de aplicaciones de gestión para gimnasios.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

*   **Node.js 18+** (Requerido para Next.js 15).
*   **Cuenta en Supabase:** Debes tener una cuenta activa para crear el backend.

## 🚀 Setup Inicial

1.  Clona el repositorio y navega a la carpeta del frontend:
    ```bash
    cd ui
    ```

2.  Instala las dependencias y el paquete de variables de entorno:
    ```bash
    npm install
    npm install dotenv
    ```

## 🔑 Variables de Entorno

Crea un archivo llamado `.env.local` en la carpeta `ui/` basado en el siguiente ejemplo.

**Archivo: `ui/.env.local`**
```env
# Conexión a Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-publica

# Rol de Servicio (NECESARIO para scripts de despliegue y administración)
# PRECAUCIÓN: NO agregues NEXT_PUBLIC_ al inicio. Esta clave es secreta.
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-secreta
```

Puedes obtener estas claves en tu Dashboard de Supabase: `Project Settings > API`.

## ☁️ Conexión a la Nube (CRÍTICO)

Para que el despliegue de la base de datos funcione, debes vincular tu entorno local con el proyecto de Supabase en la nube.

1.  Inicia sesión en la CLI de Supabase:
    ```bash
    npx supabase login
    ```
    *Sigue las instrucciones en el navegador para autorizar.*

2.  Vincula el proyecto (necesitarás el `Project Ref` que se encuentra en la URL de tu dashboard o en Settings):
    ```bash
    npx supabase link --project-ref TU_ID_DE_PROYECTO
    ```
    > **Nota:** Se te pedirá la contraseña de la base de datos de tu proyecto. Ingrésala para completar la vinculación.

## 📦 Despliegue

Una vez configurado el entorno y vinculado el proyecto, despliega la estructura de la base de datos y los datos semilla (seed):

```bash
npm run deploy:tenant
```

Este comando:
1.  Construye la configuración del tenant.
2.  Empuja (`db push`) las migraciones a Supabase.
3.  Ejecuta los scripts de seed para poblar datos iniciales (membresías, etc.).

## 👤 Primer Usuario

El sistema de autenticación utiliza **Supabase Auth**. 

**IMPORTANTE:** El primer usuario administrador debe crearse manualmente desde la nube:

1.  Ve a tu Dashboard de Supabase.
2.  Entra a la sección **Authentication > Users**.
3.  Haz clic en **Add User** -> **Create New User**.
4.  Ingresa el email y contraseña deseados.
5.  Confirma la creación (si tienes habilitado "Confirm email", valida manualmente o desactiva la opción en Providers > Email para pruebas).

¡Listo! Ahora puedes iniciar sesión en la aplicación con esas credenciales.

---

## 🛠️ Comandos Útiles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local. |
| `npm run deploy:tenant` | Despliega cambios de DB y configuración a la nube. |
| `npm run tenant:build` | Regenera la configuración sin desplegar. |


## 🆘 Solución de Problemas

* **Error: `relation "payments" does not exist`**
    * **Causa:** El comando `deploy:tenant` falló al subir las tablas.
    * **Solución:** Ejecuta `npx supabase link --project-ref TU_ID` nuevamente y asegúrate de poner el password correcto de la DB.

* **Error 400 en el Dashboard (Bad Request)**
    * **Causa:** Discrepancia entre las columnas de la BD y el Frontend.
    * **Solución:** Si modificaste el SQL manualmentne, asegúrate de que la tabla `payments` use la columna `date` y `measurements` use la columna `fecha`.