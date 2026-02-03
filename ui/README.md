# JokemGym SaaS Multi-Tenant Template

Este es un **template White Label** para gestión de gimnasios, diseñado para ser desplegado múltiples veces para diferentes clientes (Tenants) desde un único código base.

## 🚀 Características Principales

*   **Multi-Tenant Real:** Configuración basada en archivos JSON (`tenants/gym-xxx.json`).
*   **Gestión Completa:** Clientes, Pagos, Subscripciones y Mediciones.
*   **Automatización:**
    *   Estado de cliente automático (`active`/`inactive`) basado en pagos.
    *   Recordatorios de vencimiento por Email (Cron Job).
*   **Tecnología Moderna:** Next.js 16 (App Router), Supabase (Base de Datos + Auth), TailwindCSS, Resend (Emails).
*   **Marca Blanca:** Personalización total de colores, logo, moneda y reglas de negocio por cliente.

## 📂 Arquitectura del Proyecto

*   `src/`: Código fuente de la aplicación (UI, lógica).
*   `tenants/`: Archivos de configuración JSON para cada gimnasio.
*   `supabase/`: Migraciones y seeds de la base de datos.
*   `scripts/`: Scripts de automatización para build y despliegue.

## 🛠️ Desarrollo Local

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Configurar entorno:**
    Copia `.env.example` a `.env.local` y configura tus credenciales de Supabase (ver `DEPLOYMENT_GUIDE.md`).

3.  **Ejecutar entorno de desarrollo:**
    ```bash
    npm run dev
    ```

## 📦 Despliegue en Producción

Para desplegar un nuevo gimnasio, sigue la **[Guía de Despliegue Paso a Paso](DEPLOYMENT_GUIDE.md)**.

El proceso se resume en:
1.  Crear archivo `tenants/nuevo-gym.json`.
2.  Crear proyecto en Supabase y aplicar migraciones.
3.  Desplegar en Vercel configurando la variable `TENANT_FILE`.

---

© 2026 JokemTech
