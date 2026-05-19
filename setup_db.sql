-- =============================================================================
-- ProfeLink — Setup completo de tablas adicionales
-- Ejecutar después de schema.sql y fix_db.sql
-- psql -U postgres -d profelink -f setup_db.sql
-- =============================================================================

-- Tabla de mensajes para el chat
CREATE TABLE IF NOT EXISTS mensajes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id    UUID        NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  remitente_id UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido    TEXT        NOT NULL,
  leido        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mensajes_sesion    ON mensajes(sesion_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_remitente ON mensajes(remitente_id);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id     UUID          NOT NULL UNIQUE REFERENCES sesiones(id) ON DELETE CASCADE,
  estudiante_id UUID          NOT NULL REFERENCES usuarios(id),
  monto         NUMERIC(8,2)  NOT NULL,
  comision      NUMERIC(8,2)  NOT NULL,
  monto_profe   NUMERIC(8,2)  NOT NULL,
  metodo        VARCHAR(30)   NOT NULL DEFAULT 'TARJETA',
  estado        VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE',
  referencia    VARCHAR(60),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pagos_sesion     ON pagos(sesion_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estudiante ON pagos(estudiante_id);

-- Columnas adicionales en perfiles_profesor
ALTER TABLE perfiles_profesor
  ADD COLUMN IF NOT EXISTS ciudad           VARCHAR(80),
  ADD COLUMN IF NOT EXISTS anos_experiencia INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS institucion      VARCHAR(120);

-- Permisos al usuario profelink
GRANT ALL ON ALL TABLES    IN SCHEMA public TO profelink;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO profelink;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO profelink;

SELECT 'Setup completado correctamente' AS status;
