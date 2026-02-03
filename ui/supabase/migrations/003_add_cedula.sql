-- Add cedula column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cedula TEXT;
