-- Aplicar en Ubuntu: psql $DATABASE_URL < add_retiros.sql
DO $$ BEGIN
  CREATE TYPE "EstadoRetiro" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'PAGADO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS solicitudes_retiro (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id     UUID NOT NULL REFERENCES perfiles_profesor(id) ON DELETE CASCADE,
  monto           DECIMAL(10, 2) NOT NULL CHECK (monto > 0),
  metodo          VARCHAR(40) NOT NULL,
  cuenta_destino  VARCHAR(120) NOT NULL,
  estado          "EstadoRetiro" NOT NULL DEFAULT 'PENDIENTE',
  nota_admin      TEXT,
  procesado_en    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retiros_profesor_estado
  ON solicitudes_retiro(profesor_id, estado);
