-- Migra una tabla legacy `solicitudes_retiro` al esquema actual esperado por Prisma/app.
-- Uso sugerido en producción:
--   cp /home/profelink/profelink-mvp/fix_retiros_legacy_prod.sql /tmp/fix_retiros_legacy_prod.sql
--   sudo -u postgres psql -d profelink -f /tmp/fix_retiros_legacy_prod.sql

BEGIN;

DO $$
BEGIN
  CREATE TYPE "EstadoRetiro" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'PAGADO');
EXCEPTION
  WHEN duplicate_object THEN NULL;
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

ALTER TABLE solicitudes_retiro
  ADD COLUMN IF NOT EXISTS metodo VARCHAR(40),
  ADD COLUMN IF NOT EXISTS cuenta_destino VARCHAR(120),
  ADD COLUMN IF NOT EXISTS nota_admin TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Si la tabla legacy referenciaba usuarios.id, la convertimos a perfiles_profesor.id.
UPDATE solicitudes_retiro sr
SET profesor_id = pp.id
FROM perfiles_profesor pp
WHERE pp.usuario_id = sr.profesor_id
  AND NOT EXISTS (
    SELECT 1
    FROM perfiles_profesor direct_pp
    WHERE direct_pp.id = sr.profesor_id
  );

-- Completar columnas nuevas a partir del esquema legacy.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'solicitudes_retiro'
      AND column_name = 'banco'
  ) THEN
    EXECUTE '
      UPDATE solicitudes_retiro
      SET metodo = COALESCE(metodo, banco)
    ';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'solicitudes_retiro'
      AND column_name = 'cuenta'
  ) THEN
    EXECUTE '
      UPDATE solicitudes_retiro
      SET cuenta_destino = COALESCE(cuenta_destino, cuenta)
    ';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'solicitudes_retiro'
      AND column_name = 'notas_admin'
  ) THEN
    EXECUTE '
      UPDATE solicitudes_retiro
      SET nota_admin = COALESCE(nota_admin, notas_admin)
    ';
  END IF;
END $$;

UPDATE solicitudes_retiro
SET
  metodo = COALESCE(NULLIF(metodo, ''), 'OTRO'),
  cuenta_destino = COALESCE(NULLIF(cuenta_destino, ''), 'NO_DEFINIDA');

-- Asegurar que la columna estado use el enum actual.
ALTER TABLE solicitudes_retiro
  ALTER COLUMN estado DROP DEFAULT;

ALTER TABLE solicitudes_retiro
  ALTER COLUMN estado TYPE "EstadoRetiro"
  USING estado::text::"EstadoRetiro";

ALTER TABLE solicitudes_retiro
  ALTER COLUMN estado SET DEFAULT 'PENDIENTE';

ALTER TABLE solicitudes_retiro
  ALTER COLUMN metodo SET NOT NULL,
  ALTER COLUMN cuenta_destino SET NOT NULL;

DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT tc.constraint_name
  INTO fk_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
  WHERE tc.table_schema = 'public'
    AND tc.table_name = 'solicitudes_retiro'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'profesor_id'
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE solicitudes_retiro DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

ALTER TABLE solicitudes_retiro
  ADD CONSTRAINT solicitudes_retiro_profesor_id_fkey
  FOREIGN KEY (profesor_id) REFERENCES perfiles_profesor(id) ON DELETE CASCADE;

ALTER TABLE solicitudes_retiro
  DROP COLUMN IF EXISTS banco,
  DROP COLUMN IF EXISTS cuenta,
  DROP COLUMN IF EXISTS titular,
  DROP COLUMN IF EXISTS notas_admin;

CREATE INDEX IF NOT EXISTS idx_retiros_profesor_estado
  ON solicitudes_retiro(profesor_id, estado);

COMMIT;
