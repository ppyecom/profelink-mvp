-- Fix: permitir precio_acordado = 0 cuando se usa cupón PRIMERA_GRATIS
-- Aplicar: sudo -u postgres psql -d profelink < add_fix_precio_check.sql

ALTER TABLE sesiones DROP CONSTRAINT IF EXISTS sesiones_precio_acordado_check;
ALTER TABLE sesiones ADD CONSTRAINT sesiones_precio_acordado_check CHECK (precio_acordado >= 0);
