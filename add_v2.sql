-- v2: cupones, credenciales, niveles de verificación, sesiones de 30 min
-- Aplicar: psql $DATABASE_URL < add_v2.sql

DO $$ BEGIN
  CREATE TYPE "NivelVerificacion" AS ENUM ('BASICO', 'EXPERTO', 'DOCENTE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TipoCredencial" AS ENUM (
    'IDENTIDAD','TITULO','CERTIFICADO','RECORD','PROYECTO','EXPERIENCIA','EXAMEN_INTERNO'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "EstadoCredencial" AS ENUM ('PENDIENTE','APROBADA','RECHAZADA');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TipoCupon" AS ENUM ('PRIMERA_GRATIS','REFERIDO','DESCUENTO_FIJO','PORCENTAJE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "EstadoCupon" AS ENUM ('ACTIVO','USADO','EXPIRADO');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Campos nuevos en perfiles_profesor
ALTER TABLE perfiles_profesor
  ADD COLUMN IF NOT EXISTS video_presentacion     TEXT,
  ADD COLUMN IF NOT EXISTS precio_30min           DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS acepta_primera_gratis  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nivel_verificacion     "NivelVerificacion" NOT NULL DEFAULT 'BASICO';

-- Campos nuevos en sesiones
ALTER TABLE sesiones
  ADD COLUMN IF NOT EXISTS duracion_minutos  INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS descuento_cupon   DECIMAL(8,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cupon_codigo      VARCHAR(40);

-- Tabla credenciales
CREATE TABLE IF NOT EXISTS credenciales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id     UUID NOT NULL REFERENCES perfiles_profesor(id) ON DELETE CASCADE,
  tipo            "TipoCredencial" NOT NULL,
  titulo          VARCHAR(200) NOT NULL,
  descripcion     TEXT,
  archivo_url     TEXT,
  enlace_externo  VARCHAR(500),
  estado          "EstadoCredencial" NOT NULL DEFAULT 'PENDIENTE',
  nota_admin      TEXT,
  revisado_en     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credenciales_profesor_estado
  ON credenciales(profesor_id, estado);

-- Tabla cupones
CREATE TABLE IF NOT EXISTS cupones (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id        UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  codigo            VARCHAR(40) NOT NULL UNIQUE,
  tipo              "TipoCupon" NOT NULL,
  valor             DECIMAL(8,2) NOT NULL DEFAULT 0,
  estado            "EstadoCupon" NOT NULL DEFAULT 'ACTIVO',
  expira_en         TIMESTAMPTZ,
  usado_en_sesion   UUID,
  usado_en          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cupones_usuario_estado
  ON cupones(usuario_id, estado);

-- Tabla favoritos
CREATE TABLE IF NOT EXISTS favoritos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  profesor_id   UUID NOT NULL REFERENCES perfiles_profesor(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (estudiante_id, profesor_id)
);
CREATE INDEX IF NOT EXISTS idx_favoritos_estudiante ON favoritos(estudiante_id);
