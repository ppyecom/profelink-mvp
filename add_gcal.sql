-- Google Calendar sync — Aplicar en Ubuntu: sudo -u postgres psql -d profelink < add_gcal.sql
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS gcal_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS gcal_sync_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE sesiones
  ADD COLUMN IF NOT EXISTS gcal_event_id_estudiante TEXT,
  ADD COLUMN IF NOT EXISTS gcal_event_id_profesor TEXT;
