-- Archivos compartidos dentro de una sesión (profe sube material, alumno descarga)
-- Aplicar: sudo -u postgres psql -d profelink < add_archivos_sesion.sql

CREATE TABLE IF NOT EXISTS archivos_sesion (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id      UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  subido_por_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre         VARCHAR(255) NOT NULL,
  archivo_url    VARCHAR(500) NOT NULL,
  mime_type      VARCHAR(120) NOT NULL,
  tamano_bytes   INTEGER      NOT NULL,
  descripcion    VARCHAR(500),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS archivos_sesion_sesion_id_created_at_idx
  ON archivos_sesion(sesion_id, created_at);
