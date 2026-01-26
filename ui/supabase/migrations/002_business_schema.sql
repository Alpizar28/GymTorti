
-- FILE: supabase/migrations/002_business_schema.sql

-- 1. Memberships (Catálogo de membresías disponibles)
CREATE TABLE IF NOT EXISTS public.memberships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(50) NOT NULL UNIQUE, -- Identificador legible (ej: 'monthly', 'daily')
    name            VARCHAR(100) NOT NULL,
    price           NUMERIC(10, 2) NOT NULL,
    duration_days   INT NOT NULL DEFAULT 30,
    features        JSONB DEFAULT '[]'::jsonb,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clients (Personas inscritas)
CREATE TABLE IF NOT EXISTS public.clients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100),
    full_name       VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || COALESCE(last_name, '')) STORED,
    
    email           VARCHAR(255),
    phone           VARCHAR(50),
    photo_url       TEXT,
    
    status          VARCHAR(20) DEFAULT 'active', -- active, inactive, banned
    notes           TEXT,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Subscriptions (Relación Cliente - Membresía Activa)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    membership_id   UUID REFERENCES public.memberships(id) ON DELETE SET NULL,
    
    start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date        DATE NOT NULL,
    
    payment_status  VARCHAR(20) DEFAULT 'paid', -- paid, pending, failed
    active          BOOLEAN DEFAULT true,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Payments (Historial de transacciones)
CREATE TABLE IF NOT EXISTS public.payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    
    amount          NUMERIC(10, 2) NOT NULL,
    currency        VARCHAR(10) DEFAULT 'USD',
    method          VARCHAR(50) NOT NULL, -- cash, card, transfer
    date            TIMESTAMPTZ DEFAULT NOW(),
    
    reference       VARCHAR(100), -- ID externo o nro de recibo
    notes           TEXT,

    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Measurements (Seguimiento físico - Opcional pero requerido por legado)
CREATE TABLE IF NOT EXISTS public.measurements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    
    fecha           DATE DEFAULT CURRENT_DATE,
    peso            NUMERIC(6, 2),
    altura          NUMERIC(6, 2),
    
    -- Medidas corporales
    pecho_cm        NUMERIC(6, 2),
    cintura_cm      NUMERIC(6, 2),
    cadera_cm       NUMERIC(6, 2),
    brazo_izq_cm    NUMERIC(6, 2),
    brazo_der_cm    NUMERIC(6, 2),
    pierna_izq_cm   NUMERIC(6, 2),
    pierna_der_cm   NUMERIC(6, 2),
    
    grasa_corporal  NUMERIC(5, 2),
    notas           TEXT,
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- RLS Configuration
-- Habilitamos RLS en todas las tablas
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo/template (se pueden restringir luego)
CREATE POLICY "Enable read/write for anon/authenticated users" ON public.memberships FOR ALL USING (true);
CREATE POLICY "Enable read/write for anon/authenticated users" ON public.clients FOR ALL USING (true);
CREATE POLICY "Enable read/write for anon/authenticated users" ON public.subscriptions FOR ALL USING (true);
CREATE POLICY "Enable read/write for anon/authenticated users" ON public.payments FOR ALL USING (true);
CREATE POLICY "Enable read/write for anon/authenticated users" ON public.measurements FOR ALL USING (true);
