-- Planes de estudio generados con IA
-- Aplicar: sudo -u postgres psql -d profelink < add_planes_estudio.sql

CREATE TABLE IF NOT EXISTS planes_estudio (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id             UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  profesor_id               UUID REFERENCES perfiles_profesor(id) ON DELETE SET NULL,
  meta                      VARCHAR(300) NOT NULL,
  fecha_objetivo            TIMESTAMPTZ,
  temas                     JSONB NOT NULL,
  num_sesiones_recomendadas INTEGER NOT NULL,
  estado                    VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS planes_estudio_estudiante_estado_idx
  ON planes_estudio(estudiante_id, estado);

-- Vincular sesiones a planes
ALTER TABLE sesiones
  ADD COLUMN IF NOT EXISTS plan_id        UUID REFERENCES planes_estudio(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS orden_en_plan  INTEGER,
  ADD COLUMN IF NOT EXISTS tema_asignado  VARCHAR(200);

CREATE INDEX IF NOT EXISTS sesiones_plan_id_idx ON sesiones(plan_id);
