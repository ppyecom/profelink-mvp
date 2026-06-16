-- Datos de pago manual (Yape / Plin) del profesor
-- Aplicar: sudo -u postgres psql -d profelink < add_pago_manual.sql

ALTER TABLE perfiles_profesor
  ADD COLUMN IF NOT EXISTS yape_numero  VARCHAR(20),
  ADD COLUMN IF NOT EXISTS yape_qr_url  TEXT,
  ADD COLUMN IF NOT EXISTS plin_numero  VARCHAR(20),
  ADD COLUMN IF NOT EXISTS plin_qr_url  TEXT;
