-- Migration: 20260203_harden_security.sql
-- Description: Revoke public access and enforce authentication for business data.

-- 1. Drop existing permissive policies
DROP POLICY IF EXISTS "Enable read/write for anon/authenticated users" ON public.memberships;
DROP POLICY IF EXISTS "Enable read/write for anon/authenticated users" ON public.clients;
DROP POLICY IF EXISTS "Enable read/write for anon/authenticated users" ON public.subscriptions;
DROP POLICY IF EXISTS "Enable read/write for anon/authenticated users" ON public.payments;
DROP POLICY IF EXISTS "Enable read/write for anon/authenticated users" ON public.measurements;

-- 2. Create new restricted policies (Authenticated users only)

-- MEMBERSHIPS
CREATE POLICY "Allow read for authenticated users" ON public.memberships
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "Allow write for authenticated users" ON public.memberships
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CLIENTS
CREATE POLICY "Allow read for authenticated users" ON public.clients
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write for authenticated users" ON public.clients
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SUBSCRIPTIONS
CREATE POLICY "Allow read for authenticated users" ON public.subscriptions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write for authenticated users" ON public.subscriptions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PAYMENTS
CREATE POLICY "Allow read for authenticated users" ON public.payments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write for authenticated users" ON public.payments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- MEASUREMENTS
CREATE POLICY "Allow read for authenticated users" ON public.measurements
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write for authenticated users" ON public.measurements
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
