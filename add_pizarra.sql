-- Trazos de pizarra colaborativa por sesión
-- Aplicar: sudo -u postgres psql -d profelink < add_pizarra.sql

CREATE TABLE IF NOT EXISTS trazos_pizarra (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id   UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  autor_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  datos       JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trazos_pizarra_sesion_id_created_at_idx
  ON trazos_pizarra(sesion_id, created_at);
