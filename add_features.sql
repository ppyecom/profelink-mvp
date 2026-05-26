-- =============================================================================
-- ProfeLink — Tablas adicionales para features pendientes
-- Ejecutar: psql -U postgres -d profelink -f add_features.sql
-- =============================================================================

-- 1. NOTIFICACIONES IN-APP
CREATE TABLE IF NOT EXISTS notificaciones (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    UUID         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo          VARCHAR(40)  NOT NULL,  -- SESION_CONFIRMADA, NUEVA_RESERVA, PAGO_RECIBIDO, etc.
  titulo        VARCHAR(120) NOT NULL,
  mensaje       TEXT         NOT NULL,
  url           VARCHAR(200),
  leida         BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_usuario ON notificaciones(usuario_id, leida);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notificaciones(created_at DESC);

-- 2. TOKENS DE RECUPERACIÓN DE CONTRASEÑA
CREATE TABLE IF NOT EXISTS tokens_password_reset (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token      VARCHAR(120) NOT NULL UNIQUE,
  expira_en  TIMESTAMPTZ  NOT NULL,
  usado      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_token_reset ON tokens_password_reset(token);

-- 3. TOKENS DE VERIFICACIÓN DE EMAIL
CREATE TABLE IF NOT EXISTS tokens_email_verificacion (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token      VARCHAR(120) NOT NULL UNIQUE,
  expira_en  TIMESTAMPTZ  NOT NULL,
  usado      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_token_verif ON tokens_email_verificacion(token);

-- 4. AGREGAR columna email_verificado a usuarios
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS intentos_fallidos INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMPTZ;

-- Marcar todos los usuarios existentes como verificados (no romper el seed)
UPDATE usuarios SET email_verificado = TRUE WHERE email_verificado = FALSE;

-- 5. SOLICITUDES DE RETIRO DE FONDOS
CREATE TABLE IF NOT EXISTS solicitudes_retiro (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  profesor_id   UUID          NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  monto         NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  banco         VARCHAR(80)   NOT NULL,
  cuenta        VARCHAR(40)   NOT NULL,
  titular       VARCHAR(120)  NOT NULL,
  estado        VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE',  -- PENDIENTE, PROCESADO, RECHAZADO
  notas_admin   TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  procesado_en  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_retiro_profesor ON solicitudes_retiro(profesor_id, estado);

-- Permisos
GRANT ALL ON ALL TABLES IN SCHEMA public TO profelink;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO profelink;

SELECT 'Features adicionales instaladas correctamente' AS status;
