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

-- Tabla tareas
CREATE TABLE IF NOT EXISTS tareas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id     UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  titulo        VARCHAR(200) NOT NULL,
  descripcion   TEXT,
  archivo_url   TEXT,
  completada    BOOLEAN NOT NULL DEFAULT false,
  respuesta     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completada_en TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_tareas_sesion ON tareas(sesion_id);

-- Notas privadas (tutor sobre estudiante)
CREATE TABLE IF NOT EXISTS notas_privadas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id   UUID NOT NULL,
  estudiante_id UUID NOT NULL,
  contenido     TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profesor_id, estudiante_id)
);

-- Materiales por sesión
CREATE TABLE IF NOT EXISTS materiales (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id   UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  titulo      VARCHAR(200) NOT NULL,
  archivo_url TEXT NOT NULL,
  subido_por  VARCHAR(20) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_materiales_sesion ON materiales(sesion_id);

-- Lista de espera
CREATE TABLE IF NOT EXISTS lista_espera (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL,
  profesor_id   UUID NOT NULL,
  dia_semana    SMALLINT NOT NULL,
  hora          VARCHAR(5) NOT NULL,
  notificado    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (estudiante_id, profesor_id, dia_semana, hora)
);

-- Wishlist público
CREATE TABLE IF NOT EXISTS wishlist (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL,
  materia       VARCHAR(120) NOT NULL,
  descripcion   TEXT,
  resuelto      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wishlist_estudiante ON wishlist(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_materia ON wishlist(materia);

-- Inbox de mensajes pre-reserva
ALTER TABLE mensajes
  ALTER COLUMN sesion_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS destinatario_id UUID;
CREATE INDEX IF NOT EXISTS idx_mensajes_destinatario ON mensajes(destinatario_id, leido);

-- Sesiones grupales
ALTER TABLE sesiones
  ADD COLUMN IF NOT EXISTS es_grupal BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS capacidad_max INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS participantes_grupales (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id     UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  estudiante_id UUID NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sesion_id, estudiante_id)
);

-- Promociones de tutor
CREATE TABLE IF NOT EXISTS promociones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id UUID NOT NULL UNIQUE,
  porcentaje  SMALLINT NOT NULL CHECK (porcentaje BETWEEN 5 AND 50),
  activa      BOOLEAN NOT NULL DEFAULT true,
  expira_en   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Estado configurable del tutor + plantillas
DO $$ BEGIN
  CREATE TYPE "EstadoDisponibilidad" AS ENUM ('DISPONIBLE','EN_CLASE','NO_DISPONIBLE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE perfiles_profesor
  ADD COLUMN IF NOT EXISTS estado_disponibilidad "EstadoDisponibilidad" NOT NULL DEFAULT 'DISPONIBLE',
  ADD COLUMN IF NOT EXISTS mensaje_auto_respuesta TEXT;

CREATE TABLE IF NOT EXISTS plantillas_mensaje (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id UUID NOT NULL,
  titulo      VARCHAR(80) NOT NULL,
  contenido   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_plantillas_profesor ON plantillas_mensaje(profesor_id);

-- Paquetes (bundles) de sesiones
CREATE TABLE IF NOT EXISTS bundles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id  UUID NOT NULL,
  nombre       VARCHAR(120) NOT NULL,
  num_sesiones SMALLINT NOT NULL CHECK (num_sesiones > 0),
  duracion_min INTEGER NOT NULL DEFAULT 60,
  precio_total DECIMAL(10,2) NOT NULL CHECK (precio_total > 0),
  descripcion  TEXT,
  activa       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bundles_profesor ON bundles(profesor_id, activa);
