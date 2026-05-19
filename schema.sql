-- =============================================================================
-- ProfeLink MVP — PostgreSQL Schema
-- Ejecutar: psql -U postgres -d profelink -f schema.sql
-- =============================================================================

-- Crear base de datos (ejecutar conectado a postgres si no existe)
SELECT 'CREATE DATABASE profelink'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'profelink')\gexec

\c profelink

-- =============================================================================
-- EXTENSIONES
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- LIMPIAR SCHEMA (para re-ejecuciones)
-- =============================================================================
DROP TABLE IF EXISTS resenas CASCADE;
DROP TABLE IF EXISTS sesiones CASCADE;
DROP TABLE IF EXISTS disponibilidad CASCADE;
DROP TABLE IF EXISTS especialidades CASCADE;
DROP TABLE IF EXISTS perfiles_profesor CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

DROP TYPE IF EXISTS "RolUsuario" CASCADE;
DROP TYPE IF EXISTS "EstadoProfesor" CASCADE;
DROP TYPE IF EXISTS "EstadoSesion" CASCADE;
DROP TYPE IF EXISTS "ModalidadSesion" CASCADE;
DROP TYPE IF EXISTS "NivelAcademico" CASCADE;

-- =============================================================================
-- ENUM TYPES (PascalCase para coincidir con Prisma)
-- =============================================================================
CREATE TYPE "RolUsuario" AS ENUM ('ESTUDIANTE', 'PROFESOR', 'ADMIN');

CREATE TYPE "EstadoProfesor" AS ENUM ('PENDIENTE', 'VERIFICADO', 'RECHAZADO');

CREATE TYPE "EstadoSesion" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA');

CREATE TYPE "ModalidadSesion" AS ENUM ('VIRTUAL', 'PRESENCIAL');

CREATE TYPE "NivelAcademico" AS ENUM ('SECUNDARIA', 'TECNICA', 'UNIVERSITARIA');

-- =============================================================================
-- TABLA: usuarios
-- =============================================================================
CREATE TABLE usuarios (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre       VARCHAR(120) NOT NULL,
    email        VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    rol          "RolUsuario"  NOT NULL,
    activo       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol   ON usuarios(rol);

-- =============================================================================
-- TABLA: perfiles_profesor
-- =============================================================================
CREATE TABLE perfiles_profesor (
    id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id     UUID           NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    foto_url       TEXT,
    bio            TEXT,
    nivel          "NivelAcademico"[],
    precio_hora    NUMERIC(8, 2)  NOT NULL CHECK (precio_hora > 0),
    modalidad      "ModalidadSesion" NOT NULL DEFAULT 'VIRTUAL',
    estado         "EstadoProfesor"  NOT NULL DEFAULT 'PENDIENTE',
    rating_promedio NUMERIC(3, 2)  NOT NULL DEFAULT 0 CHECK (rating_promedio >= 0 AND rating_promedio <= 5),
    total_resenas  INTEGER         NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_perfiles_estado         ON perfiles_profesor(estado);
CREATE INDEX idx_perfiles_precio         ON perfiles_profesor(precio_hora);
CREATE INDEX idx_perfiles_rating         ON perfiles_profesor(rating_promedio DESC);
CREATE INDEX idx_perfiles_modalidad      ON perfiles_profesor(modalidad);

-- =============================================================================
-- TABLA: especialidades (materias del profesor)
-- =============================================================================
CREATE TABLE especialidades (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    profesor_id UUID        NOT NULL REFERENCES perfiles_profesor(id) ON DELETE CASCADE,
    materia     VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_especialidades_profesor ON especialidades(profesor_id);
CREATE INDEX idx_especialidades_materia  ON especialidades(materia);

-- =============================================================================
-- TABLA: disponibilidad (horarios semanales del profesor)
-- =============================================================================
CREATE TABLE disponibilidad (
    id           UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    profesor_id  UUID     NOT NULL REFERENCES perfiles_profesor(id) ON DELETE CASCADE,
    dia_semana   SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Dom, 1=Lun … 6=Sab
    hora_inicio  TIME     NOT NULL,
    hora_fin     TIME     NOT NULL,
    activo       BOOLEAN  NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_horas CHECK (hora_fin > hora_inicio)
);

CREATE INDEX idx_disponibilidad_profesor ON disponibilidad(profesor_id);
CREATE INDEX idx_disponibilidad_dia      ON disponibilidad(dia_semana);

-- =============================================================================
-- TABLA: sesiones
-- =============================================================================
CREATE TABLE sesiones (
    id            UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID             NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    profesor_id   UUID             NOT NULL REFERENCES perfiles_profesor(id) ON DELETE CASCADE,
    fecha_inicio  TIMESTAMPTZ      NOT NULL,
    fecha_fin     TIMESTAMPTZ      NOT NULL,
    modalidad     "ModalidadSesion" NOT NULL,
    estado        "EstadoSesion"    NOT NULL DEFAULT 'PENDIENTE',
    precio_acordado NUMERIC(8, 2)  NOT NULL CHECK (precio_acordado > 0),
    notas         TEXT,
    created_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_fechas CHECK (fecha_fin > fecha_inicio)
);

CREATE INDEX idx_sesiones_estudiante  ON sesiones(estudiante_id);
CREATE INDEX idx_sesiones_profesor    ON sesiones(profesor_id);
CREATE INDEX idx_sesiones_estado      ON sesiones(estado);
CREATE INDEX idx_sesiones_fecha       ON sesiones(fecha_inicio);

-- Evitar solapamiento de sesiones para el mismo profesor (excluyendo canceladas)
CREATE OR REPLACE FUNCTION check_solapamiento_sesion()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar solapamiento para el profesor
    IF EXISTS (
        SELECT 1 FROM sesiones
        WHERE profesor_id    = NEW.profesor_id
          AND id             <> NEW.id
          AND estado         NOT IN ('CANCELADA')
          AND fecha_inicio   <  NEW.fecha_fin
          AND fecha_fin      >  NEW.fecha_inicio
    ) THEN
        RAISE EXCEPTION 'El profesor ya tiene una sesión en ese horario';
    END IF;

    -- Verificar solapamiento para el estudiante
    IF EXISTS (
        SELECT 1 FROM sesiones
        WHERE estudiante_id  = NEW.estudiante_id
          AND id             <> NEW.id
          AND estado         NOT IN ('CANCELADA')
          AND fecha_inicio   <  NEW.fecha_fin
          AND fecha_fin      >  NEW.fecha_inicio
    ) THEN
        RAISE EXCEPTION 'El estudiante ya tiene una sesión en ese horario';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_solapamiento
    BEFORE INSERT OR UPDATE ON sesiones
    FOR EACH ROW EXECUTE FUNCTION check_solapamiento_sesion();

-- =============================================================================
-- TABLA: resenas
-- =============================================================================
CREATE TABLE resenas (
    id            UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    sesion_id     UUID     NOT NULL UNIQUE REFERENCES sesiones(id) ON DELETE CASCADE,
    estudiante_id UUID     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    profesor_id   UUID     NOT NULL REFERENCES perfiles_profesor(id) ON DELETE CASCADE,
    calificacion  SMALLINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- Sin updated_at: las reseñas son inmutables
);

CREATE INDEX idx_resenas_profesor   ON resenas(profesor_id);
CREATE INDEX idx_resenas_estudiante ON resenas(estudiante_id);
CREATE INDEX idx_resenas_sesion     ON resenas(sesion_id);

-- Recalcular rating del profesor al insertar una reseña
CREATE OR REPLACE FUNCTION actualizar_rating_profesor()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE perfiles_profesor
    SET rating_promedio = (
            SELECT ROUND(AVG(calificacion)::NUMERIC, 2)
            FROM resenas
            WHERE profesor_id = NEW.profesor_id
        ),
        total_resenas = (
            SELECT COUNT(*) FROM resenas WHERE profesor_id = NEW.profesor_id
        ),
        updated_at = NOW()
    WHERE id = NEW.profesor_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_rating
    AFTER INSERT ON resenas
    FOR EACH ROW EXECUTE FUNCTION actualizar_rating_profesor();

-- =============================================================================
-- FUNCIÓN: updated_at automático
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_perfiles_updated_at
    BEFORE UPDATE ON perfiles_profesor
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_disponibilidad_updated_at
    BEFORE UPDATE ON disponibilidad
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_sesiones_updated_at
    BEFORE UPDATE ON sesiones
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- DATOS SEED
-- Passwords: todos usan bcrypt de "password123"
-- Hash: $2b$10$YourHashHere — generado con bcrypt rounds=10
-- Para el seed usamos crypt() de pgcrypto con bf (blowfish / bcrypt)
-- =============================================================================

DO $$
DECLARE
    -- IDs fijos para poder referenciarlos en sesiones/reseñas
    admin_id       UUID := gen_random_uuid();
    prof1_id       UUID := gen_random_uuid(); -- verificado
    prof2_id       UUID := gen_random_uuid(); -- pendiente
    prof3_id       UUID := gen_random_uuid(); -- rechazado
    est1_id        UUID := gen_random_uuid();
    est2_id        UUID := gen_random_uuid();

    perfil1_id     UUID;
    perfil2_id     UUID;
    perfil3_id     UUID;

    sesion1_id     UUID := gen_random_uuid();
    sesion2_id     UUID := gen_random_uuid();
    sesion3_id     UUID := gen_random_uuid();
    sesion4_id     UUID := gen_random_uuid();
    sesion5_id     UUID := gen_random_uuid();

    hash_pass      TEXT;
BEGIN
    hash_pass := crypt('password123', gen_salt('bf', 10));

    -- -------------------------------------------------------------------------
    -- Usuarios
    -- -------------------------------------------------------------------------
    INSERT INTO usuarios (id, nombre, email, password_hash, rol) VALUES
        (admin_id, 'Admin ProfeLink',   'admin@profelink.pe',   hash_pass, 'ADMIN'),
        (prof1_id, 'María García',      'maria@profelink.pe',   hash_pass, 'PROFESOR'),
        (prof2_id, 'Carlos Mendoza',    'carlos@profelink.pe',  hash_pass, 'PROFESOR'),
        (prof3_id, 'Ana Torres',        'ana@profelink.pe',     hash_pass, 'PROFESOR'),
        (est1_id,  'Luis Paredes',      'luis@profelink.pe',    hash_pass, 'ESTUDIANTE'),
        (est2_id,  'Sofía Ríos',        'sofia@profelink.pe',   hash_pass, 'ESTUDIANTE');

    -- -------------------------------------------------------------------------
    -- Perfiles de profesor
    -- -------------------------------------------------------------------------
    INSERT INTO perfiles_profesor
        (id, usuario_id, foto_url, bio, nivel, precio_hora, modalidad, estado)
    VALUES
        (
            gen_random_uuid(),
            prof1_id,
            'https://i.pravatar.cc/150?u=maria',
            'Licenciada en Matemáticas con 8 años de experiencia. Especialista en cálculo y álgebra universitaria.',
            ARRAY['UNIVERSITARIA', 'SECUNDARIA']::\"NivelAcademico\"[],
            80.00,
            'VIRTUAL',
            'VERIFICADO'
        ),
        (
            gen_random_uuid(),
            prof2_id,
            'https://i.pravatar.cc/150?u=carlos',
            'Ingeniero de Sistemas con maestría. Enseño programación, bases de datos y matemática discreta.',
            ARRAY['UNIVERSITARIA', 'TECNICA']::\"NivelAcademico\"[],
            65.00,
            'VIRTUAL',
            'PENDIENTE'
        ),
        (
            gen_random_uuid(),
            prof3_id,
            'https://i.pravatar.cc/150?u=ana',
            'Profesora de historia y ciencias sociales para secundaria.',
            ARRAY['SECUNDARIA']::\"NivelAcademico\"[],
            45.00,
            'PRESENCIAL',
            'RECHAZADO'
        );

    -- Recuperar IDs de perfiles recién creados
    SELECT id INTO perfil1_id FROM perfiles_profesor WHERE usuario_id = prof1_id;
    SELECT id INTO perfil2_id FROM perfiles_profesor WHERE usuario_id = prof2_id;
    SELECT id INTO perfil3_id FROM perfiles_profesor WHERE usuario_id = prof3_id;

    -- -------------------------------------------------------------------------
    -- Especialidades
    -- -------------------------------------------------------------------------
    INSERT INTO especialidades (profesor_id, materia) VALUES
        (perfil1_id, 'Cálculo'),
        (perfil1_id, 'Álgebra Lineal'),
        (perfil1_id, 'Estadística'),
        (perfil2_id, 'Programación'),
        (perfil2_id, 'Base de Datos'),
        (perfil2_id, 'Matemática Discreta'),
        (perfil3_id, 'Historia'),
        (perfil3_id, 'Geografía');

    -- -------------------------------------------------------------------------
    -- Disponibilidad semanal (día: 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie)
    -- -------------------------------------------------------------------------
    INSERT INTO disponibilidad (profesor_id, dia_semana, hora_inicio, hora_fin) VALUES
        (perfil1_id, 1, '08:00', '12:00'),
        (perfil1_id, 3, '08:00', '12:00'),
        (perfil1_id, 5, '09:00', '13:00'),
        (perfil2_id, 2, '14:00', '18:00'),
        (perfil2_id, 4, '14:00', '18:00'),
        (perfil3_id, 1, '15:00', '19:00'),
        (perfil3_id, 2, '15:00', '19:00');

    -- -------------------------------------------------------------------------
    -- Sesiones (5, en distintos estados)
    -- Usamos fechas fijas en el pasado / futuro próximo para el seed
    -- -------------------------------------------------------------------------
    INSERT INTO sesiones
        (id, estudiante_id, profesor_id, fecha_inicio, fecha_fin, modalidad, estado, precio_acordado, notas)
    VALUES
        (
            sesion1_id, est1_id, perfil1_id,
            NOW() - INTERVAL '10 days' + TIME '09:00',
            NOW() - INTERVAL '10 days' + TIME '10:00',
            'VIRTUAL', 'COMPLETADA', 80.00,
            'Repaso de integrales definidas'
        ),
        (
            sesion2_id, est2_id, perfil1_id,
            NOW() - INTERVAL '5 days' + TIME '09:00',
            NOW() - INTERVAL '5 days' + TIME '10:00',
            'VIRTUAL', 'COMPLETADA', 80.00,
            'Álgebra lineal — transformaciones lineales'
        ),
        (
            sesion3_id, est1_id, perfil2_id,
            NOW() + INTERVAL '2 days' + TIME '15:00',
            NOW() + INTERVAL '2 days' + TIME '16:00',
            'VIRTUAL', 'CONFIRMADA', 65.00,
            'SQL avanzado y optimización de consultas'
        ),
        (
            sesion4_id, est2_id, perfil2_id,
            NOW() + INTERVAL '4 days' + TIME '16:00',
            NOW() + INTERVAL '4 days' + TIME '17:00',
            'VIRTUAL', 'PENDIENTE', 65.00,
            NULL
        ),
        (
            sesion5_id, est1_id, perfil1_id,
            NOW() - INTERVAL '20 days' + TIME '09:00',
            NOW() - INTERVAL '20 days' + TIME '10:00',
            'VIRTUAL', 'CANCELADA', 80.00,
            'Cancelada por el estudiante'
        );

    -- -------------------------------------------------------------------------
    -- Reseñas (solo para sesiones COMPLETADAS)
    -- -------------------------------------------------------------------------
    INSERT INTO resenas (sesion_id, estudiante_id, profesor_id, calificacion, comentario) VALUES
        (
            sesion1_id, est1_id, perfil1_id,
            5,
            'Excelente profesora, explica muy bien los conceptos y tiene mucha paciencia. La recomiendo totalmente.'
        ),
        (
            sesion2_id, est2_id, perfil1_id,
            4,
            'Muy buena clase, llegamos a cubrir todo el tema. Algunos ejemplos podrían ser más prácticos.'
        );

END $$;

-- =============================================================================
-- VERIFICACIÓN FINAL
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Usuarios insertados: %',     (SELECT COUNT(*) FROM usuarios);
    RAISE NOTICE 'Perfiles inserados: %',      (SELECT COUNT(*) FROM perfiles_profesor);
    RAISE NOTICE 'Especialidades: %',          (SELECT COUNT(*) FROM especialidades);
    RAISE NOTICE 'Disponibilidades: %',        (SELECT COUNT(*) FROM disponibilidad);
    RAISE NOTICE 'Sesiones: %',                (SELECT COUNT(*) FROM sesiones);
    RAISE NOTICE 'Reseñas: %',                 (SELECT COUNT(*) FROM resenas);
    RAISE NOTICE 'Rating de María García: %',
        (SELECT rating_promedio FROM perfiles_profesor pp
         JOIN usuarios u ON u.id = pp.usuario_id
         WHERE u.email = 'maria@profelink.pe');
END $$;
