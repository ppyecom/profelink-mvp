-- Agrega columna materia_principal a planes_estudio
-- Permite filtrar tutores automáticamente cuando el alumno guarda un plan

ALTER TABLE planes_estudio
  ADD COLUMN IF NOT EXISTS materia_principal VARCHAR(80);
