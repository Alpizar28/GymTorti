# JokemGym Template

White-label gym management system template.
This repository acts as a **BASE TEMPLATE** for creating specific gym instances.

## 🚀 Creating a New Gym Instance

1.  **Clone/Fork this repository.**
2.  **Configure Tenant:**
    *   Copy `tenant.setup.json.example` to `tenant.setup.json`.
    *   Edit `tenant.setup.json` with your specific gym details (Branding, Currency, Plans).
3.  **Build Configuration:**
    *   Run `npm run tenant:build`.
    *   This generates `src/config/app.config.ts` and Supabase SQL seeds.
4.  **Database Setup:**
    *   Set up a Supabase project.
    *   Run `supabase/migrations/001_core.sql`.
    *   Run the generated seed SQL from `supabase/seed/`.

## 🛠 Development

*   `npm run dev`: Starts the Next.js development server.
*   `npm run tenant:build`: Regenerates configuration artifacts from `tenant.setup.json`.

**Important:** Do not manually edit `src/config/app.config.ts`. It is an auto-generated file.
