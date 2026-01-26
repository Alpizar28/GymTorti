// FILE: supabase/migrations/001_core.sql

-- 1. Tabla de configuración general del Tenant
-- Solo debe existir 1 fila activa por deployment, pero usamos ID fijo para consistencia.
CREATE TABLE IF NOT EXISTS public.tenant_settings (
    id                  VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    timezone            VARCHAR(50) NOT NULL DEFAULT 'UTC',
    locale              VARCHAR(10) NOT NULL DEFAULT 'en-US',
    
    currency_code       VARCHAR(10) NOT NULL DEFAULT 'USD',
    currency_symbol     VARCHAR(5) NOT NULL DEFAULT '$',
    currency_decimals   INT NOT NULL DEFAULT 2,
    
    unit_weight         VARCHAR(10) NOT NULL DEFAULT 'kg',
    unit_length         VARCHAR(10) NOT NULL DEFAULT 'cm',
    
    rule_warning_days   INT NOT NULL DEFAULT 5,
    rule_grace_days     INT DEFAULT 0,
    
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de overrides de planes (enabled/price)
-- Se cruza con el ID del plan definido en código (universal).
CREATE TABLE IF NOT EXISTS public.tenant_plan_overrides (
    plan_id             VARCHAR(50) PRIMARY KEY,
    enabled             BOOLEAN NOT NULL DEFAULT false,
    visible             BOOLEAN NOT NULL DEFAULT false,
    price               NUMERIC(10, 2), -- Puede ser NULL
    currency_override   VARCHAR(10),
    notes               TEXT,
    
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) - IMPORTANTE
-- Deshabilitar escritura pública por defecto
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_plan_overrides ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública (todo el mundo puede ver precios y settings públicos)
CREATE POLICY "Public generic read access settings" ON public.tenant_settings FOR SELECT USING (true);
CREATE POLICY "Public generic read access plans" ON public.tenant_plan_overrides FOR SELECT USING (true);

-- Política de escritura solo para Service Role (Seeds/Admin)
-- (Supabase Service Role obvia RLS, así que esto es explícito para usuarios)
