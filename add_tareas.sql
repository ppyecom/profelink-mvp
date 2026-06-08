-- Tabla de tareas/asignaciones por sesión
-- Aplicar: sudo -u postgres psql -d profelink < add_tareas.sql

CREATE TABLE IF NOT EXISTS tareas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id     UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  titulo        VARCHAR(200) NOT NULL,
  descripcion   TEXT,
  archivo_url   TEXT,
  completada    BOOLEAN     NOT NULL DEFAULT false,
  respuesta     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completada_en TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS tareas_sesion_id_idx ON tareas(sesion_id);
