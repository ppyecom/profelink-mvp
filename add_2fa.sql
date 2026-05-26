-- Aplicar en Ubuntu: psql $DATABASE_URL < add_2fa.sql
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS totp_secret      TEXT,
  ADD COLUMN IF NOT EXISTS totp_habilitado  BOOLEAN NOT NULL DEFAULT false;
