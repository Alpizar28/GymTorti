-- Migration: Sincronización Automática de Estado del Cliente
-- Propósito: Mantener consistencia entre cliente.status y subscripciones activas
-- 
-- Reglas:
-- - Cliente con al menos 1 subscripción activa → status = 'active'
-- - Cliente sin subscripciones activas → status = 'inactive'
-- - Se ejecuta automáticamente en INSERT, UPDATE, DELETE de subscriptions

-- ============================================================================
-- 1. Función para sincronizar el estado del cliente
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_client_status()
RETURNS TRIGGER AS $$
DECLARE
  target_client_id UUID;
  has_active_subscription BOOLEAN;
  new_status TEXT;
BEGIN
  -- Determinar el client_id afectado según la operación
  IF TG_OP = 'DELETE' THEN
    target_client_id := OLD.client_id;
  ELSE
    target_client_id := NEW.client_id;
  END IF;

  -- Verificar si el cliente tiene al menos una subscripción activa
  SELECT EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE client_id = target_client_id
      AND active = true
      AND end_date >= CURRENT_DATE
  ) INTO has_active_subscription;

  -- Determinar el nuevo estado
  IF has_active_subscription THEN
    new_status := 'active';
  ELSE
    new_status := 'inactive';
  END IF;

  -- Actualizar el estado del cliente si cambió
  UPDATE clients
  SET status = new_status,
      updated_at = NOW()
  WHERE id = target_client_id
    AND status != new_status; -- Solo actualizar si cambió

  -- Si fue UPDATE y cambió el client_id, también sincronizar el anterior
  IF TG_OP = 'UPDATE' AND OLD.client_id != NEW.client_id THEN
    -- Sincronizar el cliente anterior
    SELECT EXISTS (
      SELECT 1
      FROM subscriptions
      WHERE client_id = OLD.client_id
        AND active = true
        AND end_date >= CURRENT_DATE
    ) INTO has_active_subscription;

    IF has_active_subscription THEN
      new_status := 'active';
    ELSE
      new_status := 'inactive';
    END IF;

    UPDATE clients
    SET status = new_status,
        updated_at = NOW()
    WHERE id = OLD.client_id
      AND status != new_status;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. Triggers para mantener sincronización automática
-- ============================================================================

-- Trigger para INSERT
DROP TRIGGER IF EXISTS sync_client_status_on_insert ON subscriptions;
CREATE TRIGGER sync_client_status_on_insert
  AFTER INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_client_status();

-- Trigger para UPDATE
DROP TRIGGER IF EXISTS sync_client_status_on_update ON subscriptions;
CREATE TRIGGER sync_client_status_on_update
  AFTER UPDATE ON subscriptions
  FOR EACH ROW
  WHEN (
    OLD.active IS DISTINCT FROM NEW.active OR
    OLD.end_date IS DISTINCT FROM NEW.end_date OR
    OLD.client_id IS DISTINCT FROM NEW.client_id
  )
  EXECUTE FUNCTION sync_client_status();

-- Trigger para DELETE
DROP TRIGGER IF EXISTS sync_client_status_on_delete ON subscriptions;
CREATE TRIGGER sync_client_status_on_delete
  AFTER DELETE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_client_status();

-- ============================================================================
-- 3. Función manual para corregir estados existentes
-- ============================================================================

CREATE OR REPLACE FUNCTION fix_all_client_statuses()
RETURNS TABLE(client_id UUID, old_status VARCHAR, new_status VARCHAR, changed BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  WITH updates AS (
    SELECT 
      c.id,
      c.status AS old_status,
      CASE 
        WHEN EXISTS (
          SELECT 1 
          FROM subscriptions s 
          WHERE s.client_id = c.id 
            AND s.active = true 
            AND s.end_date >= CURRENT_DATE
        ) THEN 'active'::VARCHAR
        ELSE 'inactive'::VARCHAR
      END AS new_status
    FROM clients c
  )
  UPDATE clients c
  SET status = u.new_status,
      updated_at = NOW()
  FROM updates u
  WHERE c.id = u.id
    AND c.status != u.new_status
  RETURNING c.id, u.old_status, u.new_status, true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. Ejecutar corrección inicial
-- ============================================================================

-- Corregir todos los estados actuales
SELECT * FROM fix_all_client_statuses();

-- ============================================================================
-- 5. Comentarios y documentación
-- ============================================================================

COMMENT ON FUNCTION sync_client_status() IS 
'Sincroniza automáticamente el estado del cliente basado en sus subscripciones activas. 
Un cliente está activo si tiene al menos una subscripción activa y no vencida.';

COMMENT ON FUNCTION fix_all_client_statuses() IS 
'Función manual para corregir todos los estados de clientes basados en sus subscripciones.
Útil para ejecutar una vez después de aplicar esta migración o para mantenimiento.';

-- ============================================================================
-- Verificación
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration completada exitosamente!';
  RAISE NOTICE 'Los estados de clientes ahora se sincronizan automáticamente.';
  RAISE NOTICE '';
  RAISE NOTICE 'Reglas aplicadas:';
  RAISE NOTICE '- Cliente con subscripción activa → status = active';
  RAISE NOTICE '- Cliente sin subscripciones activas → status = inactive';
  RAISE NOTICE '- Se ejecuta automáticamente en cambios de subscriptions';
END $$;
