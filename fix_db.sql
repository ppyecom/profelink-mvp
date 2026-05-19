-- =============================================================================
-- fix_db.sql — Arregla ENUMs + agrega campos + recarga seed completo
-- Ejecutar: psql -U postgres -p 5433 -d profelink -f D:\profelink-mvp\fix_db.sql
-- =============================================================================

-- 1. Renombrar ENUMs si aún tienen nombres snake_case
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_profesor') THEN
    ALTER TYPE estado_profesor  RENAME TO "EstadoProfesor";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_usuario') THEN
    ALTER TYPE rol_usuario      RENAME TO "RolUsuario";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_sesion') THEN
    ALTER TYPE estado_sesion    RENAME TO "EstadoSesion";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'modalidad_sesion') THEN
    ALTER TYPE modalidad_sesion RENAME TO "ModalidadSesion";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nivel_academico') THEN
    ALTER TYPE nivel_academico  RENAME TO "NivelAcademico";
  END IF;
END $$;

-- 2. Agregar columnas nuevas al perfil (si no existen)
ALTER TABLE perfiles_profesor
  ADD COLUMN IF NOT EXISTS ciudad         VARCHAR(80),
  ADD COLUMN IF NOT EXISTS anos_experiencia INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS institucion    VARCHAR(120);

-- 3. Limpiar datos anteriores para re-insertar limpios
DELETE FROM resenas;
DELETE FROM sesiones;
DELETE FROM disponibilidad;
DELETE FROM especialidades;
DELETE FROM perfiles_profesor;
DELETE FROM usuarios;

-- 4. Insertar seed completo y mejorado
DO $$
DECLARE
  admin_id  UUID := gen_random_uuid();
  prof1_id  UUID := gen_random_uuid();
  prof2_id  UUID := gen_random_uuid();
  prof3_id  UUID := gen_random_uuid();
  prof4_id  UUID := gen_random_uuid();
  prof5_id  UUID := gen_random_uuid();
  prof6_id  UUID := gen_random_uuid();
  prof7_id  UUID := gen_random_uuid();
  prof8_id  UUID := gen_random_uuid();
  est1_id   UUID := gen_random_uuid();
  est2_id   UUID := gen_random_uuid();
  est3_id   UUID := gen_random_uuid();
  est4_id   UUID := gen_random_uuid();

  p1 UUID; p2 UUID; p3 UUID; p4 UUID;
  p5 UUID; p6 UUID; p7 UUID; p8 UUID;

  s1 UUID := gen_random_uuid();
  s2 UUID := gen_random_uuid();
  s3 UUID := gen_random_uuid();
  s4 UUID := gen_random_uuid();
  s5 UUID := gen_random_uuid();
  s6 UUID := gen_random_uuid();
  s7 UUID := gen_random_uuid();
  s8 UUID := gen_random_uuid();
  s9 UUID := gen_random_uuid();
  s10 UUID := gen_random_uuid();

  hp TEXT;
BEGIN
  hp := crypt('password123', gen_salt('bf', 10));

  -- Usuarios
  INSERT INTO usuarios (id, nombre, email, password_hash, rol) VALUES
    (admin_id, 'Admin ProfeLink',    'admin@profelink.pe',   hp, 'ADMIN'),
    (prof1_id, 'María García',       'maria@profelink.pe',   hp, 'PROFESOR'),
    (prof2_id, 'Carlos Mendoza',     'carlos@profelink.pe',  hp, 'PROFESOR'),
    (prof3_id, 'Ana Torres',         'ana@profelink.pe',     hp, 'PROFESOR'),
    (prof4_id, 'Diego Ramírez',      'diego@profelink.pe',   hp, 'PROFESOR'),
    (prof5_id, 'Valentina Cruz',     'vale@profelink.pe',    hp, 'PROFESOR'),
    (prof6_id, 'Roberto Sánchez',    'roberto@profelink.pe', hp, 'PROFESOR'),
    (prof7_id, 'Camila Vega',        'camila@profelink.pe',  hp, 'PROFESOR'),
    (prof8_id, 'Andrés Herrera',     'andres@profelink.pe',  hp, 'PROFESOR'),
    (est1_id,  'Luis Paredes',       'luis@profelink.pe',    hp, 'ESTUDIANTE'),
    (est2_id,  'Sofía Ríos',         'sofia@profelink.pe',   hp, 'ESTUDIANTE'),
    (est3_id,  'Gabriela Quispe',    'gabi@profelink.pe',    hp, 'ESTUDIANTE'),
    (est4_id,  'Marco Flores',       'marco@profelink.pe',   hp, 'ESTUDIANTE');

  -- Perfiles de profesores
  INSERT INTO perfiles_profesor (id, usuario_id, foto_url, bio, nivel, precio_hora, modalidad, estado, ciudad, anos_experiencia, institucion)
  VALUES
    (gen_random_uuid(), prof1_id,
     'https://randomuser.me/api/portraits/women/44.jpg',
     'Licenciada en Matemáticas por la PUCP con 8 años de experiencia docente. Me especializo en hacer que el cálculo y el álgebra sean comprensibles para todos. Tengo metodología propia con más de 200 alumnos acompañados.',
     ARRAY['UNIVERSITARIA','SECUNDARIA']::"NivelAcademico"[],
     80.00, 'VIRTUAL', 'VERIFICADO', 'Lima', 8, 'PUCP'),

    (gen_random_uuid(), prof2_id,
     'https://randomuser.me/api/portraits/men/32.jpg',
     'Ingeniero de Sistemas egresado de la UNI. Enseño programación y bases de datos con enfoque práctico. Cada clase incluye ejercicios reales de la industria.',
     ARRAY['UNIVERSITARIA','TECNICA']::"NivelAcademico"[],
     65.00, 'VIRTUAL', 'PENDIENTE', 'Lima', 4, 'UNI'),

    (gen_random_uuid(), prof3_id,
     'https://randomuser.me/api/portraits/women/68.jpg',
     'Profesora de historia y geografía para nivel secundaria. Clases dinámicas con mapas, líneas de tiempo y material visual propio.',
     ARRAY['SECUNDARIA']::"NivelAcademico"[],
     45.00, 'PRESENCIAL', 'RECHAZADO', 'Arequipa', 5, 'UNSA'),

    (gen_random_uuid(), prof4_id,
     'https://randomuser.me/api/portraits/men/75.jpg',
     'Físico de la PUCP con maestría en Física Teórica. 6 años enseñando física universitaria y preuniversitaria. Mis alumnos mejoran su nota promedio en 3 puntos.',
     ARRAY['UNIVERSITARIA','SECUNDARIA']::"NivelAcademico"[],
     75.00, 'VIRTUAL', 'VERIFICADO', 'Lima', 6, 'PUCP'),

    (gen_random_uuid(), prof5_id,
     'https://randomuser.me/api/portraits/women/90.jpg',
     'Traductora e intérprete certificada con nivel C2 en inglés y B2 en francés. Metodología comunicativa enfocada en conversación real y preparación para exámenes IELTS y TOEFL.',
     ARRAY['UNIVERSITARIA','TECNICA','SECUNDARIA']::"NivelAcademico"[],
     90.00, 'VIRTUAL', 'VERIFICADO', 'Lima', 7, 'UNMSM'),

    (gen_random_uuid(), prof6_id,
     'https://randomuser.me/api/portraits/men/52.jpg',
     'Economista con MBA en ESAN. Enseño micro y macroeconomía, finanzas corporativas y estadística para negocios. Enfoque aplicado con casos reales del mercado peruano.',
     ARRAY['UNIVERSITARIA']::"NivelAcademico"[],
     85.00, 'VIRTUAL', 'VERIFICADO', 'Lima', 9, 'ESAN'),

    (gen_random_uuid(), prof7_id,
     'https://randomuser.me/api/portraits/women/33.jpg',
     'Química farmacéutica con doctorado en la UPCH. Enseño química orgánica, inorgánica, bioquímica y farmacología. Tengo banco de más de 500 ejercicios resueltos.',
     ARRAY['UNIVERSITARIA','SECUNDARIA']::"NivelAcademico"[],
     95.00, 'PRESENCIAL', 'VERIFICADO', 'Lima', 11, 'UPCH'),

    (gen_random_uuid(), prof8_id,
     'https://randomuser.me/api/portraits/men/18.jpg',
     'Desarrollador Full Stack Senior con 8 años en la industria tech. He trabajado en startups y empresas Fortune 500. Enseño desde cero hasta nivel avanzado con proyectos reales que puedes poner en tu portafolio.',
     ARRAY['UNIVERSITARIA','TECNICA']::"NivelAcademico"[],
     110.00, 'VIRTUAL', 'VERIFICADO', 'Lima', 8, 'Autodidacta / Industria');

  -- Recuperar IDs de perfiles
  SELECT id INTO p1 FROM perfiles_profesor WHERE usuario_id = prof1_id;
  SELECT id INTO p2 FROM perfiles_profesor WHERE usuario_id = prof2_id;
  SELECT id INTO p3 FROM perfiles_profesor WHERE usuario_id = prof3_id;
  SELECT id INTO p4 FROM perfiles_profesor WHERE usuario_id = prof4_id;
  SELECT id INTO p5 FROM perfiles_profesor WHERE usuario_id = prof5_id;
  SELECT id INTO p6 FROM perfiles_profesor WHERE usuario_id = prof6_id;
  SELECT id INTO p7 FROM perfiles_profesor WHERE usuario_id = prof7_id;
  SELECT id INTO p8 FROM perfiles_profesor WHERE usuario_id = prof8_id;

  -- Especialidades
  INSERT INTO especialidades (profesor_id, materia) VALUES
    (p1,'Cálculo'),(p1,'Álgebra Lineal'),(p1,'Estadística'),(p1,'Trigonometría'),
    (p2,'Programación'),(p2,'Base de Datos'),(p2,'Matemática Discreta'),(p2,'Python'),
    (p3,'Historia'),(p3,'Geografía'),(p3,'Cívica'),
    (p4,'Física'),(p4,'Mecánica Clásica'),(p4,'Electromagnetismo'),(p4,'Termodinámica'),
    (p5,'Inglés'),(p5,'Francés'),(p5,'Preparación IELTS'),(p5,'Preparación TOEFL'),
    (p6,'Economía'),(p6,'Microeconomía'),(p6,'Finanzas'),(p6,'Estadística para Negocios'),
    (p7,'Química Orgánica'),(p7,'Bioquímica'),(p7,'Química General'),(p7,'Farmacología'),
    (p8,'JavaScript'),(p8,'React'),(p8,'Python'),(p8,'Node.js'),(p8,'Estructuras de Datos');

  -- Disponibilidad
  INSERT INTO disponibilidad (profesor_id, dia_semana, hora_inicio, hora_fin) VALUES
    (p1,1,'08:00','12:00'),(p1,3,'08:00','12:00'),(p1,5,'09:00','13:00'),
    (p4,1,'18:00','21:00'),(p4,3,'18:00','21:00'),(p4,6,'09:00','13:00'),
    (p5,2,'07:00','12:00'),(p5,4,'07:00','12:00'),(p5,6,'08:00','13:00'),
    (p6,1,'12:00','16:00'),(p6,2,'12:00','16:00'),(p6,4,'12:00','16:00'),
    (p7,3,'10:00','14:00'),(p7,5,'10:00','14:00'),
    (p8,2,'19:00','22:00'),(p8,4,'19:00','22:00'),(p8,6,'10:00','14:00');

  -- Sesiones
  INSERT INTO sesiones (id,estudiante_id,profesor_id,fecha_inicio,fecha_fin,modalidad,estado,precio_acordado,notas) VALUES
    (s1,  est1_id, p1, NOW()-INTERVAL '20d'+TIME '09:00', NOW()-INTERVAL '20d'+TIME '10:00', 'VIRTUAL',    'COMPLETADA', 80.00,  'Integrales definidas'),
    (s2,  est2_id, p1, NOW()-INTERVAL '10d'+TIME '09:00', NOW()-INTERVAL '10d'+TIME '10:00', 'VIRTUAL',    'COMPLETADA', 80.00,  'Álgebra lineal'),
    (s3,  est3_id, p4, NOW()-INTERVAL '15d'+TIME '18:00', NOW()-INTERVAL '15d'+TIME '19:00', 'VIRTUAL',    'COMPLETADA', 75.00,  NULL),
    (s4,  est4_id, p4, NOW()-INTERVAL '8d' +TIME '18:00', NOW()-INTERVAL '8d' +TIME '19:00', 'VIRTUAL',    'COMPLETADA', 75.00,  NULL),
    (s5,  est3_id, p5, NOW()-INTERVAL '12d'+TIME '07:00', NOW()-INTERVAL '12d'+TIME '08:00', 'VIRTUAL',    'COMPLETADA', 90.00,  'Práctica speaking'),
    (s6,  est4_id, p5, NOW()-INTERVAL '6d' +TIME '07:00', NOW()-INTERVAL '6d' +TIME '08:00', 'VIRTUAL',    'COMPLETADA', 90.00,  NULL),
    (s7,  est3_id, p6, NOW()-INTERVAL '18d'+TIME '12:00', NOW()-INTERVAL '18d'+TIME '13:00', 'VIRTUAL',    'COMPLETADA', 85.00,  'Microeconomía'),
    (s8,  est3_id, p8, NOW()-INTERVAL '3d' +TIME '19:00', NOW()-INTERVAL '3d' +TIME '20:00', 'VIRTUAL',    'COMPLETADA', 110.00, 'Intro a React'),
    (s9,  est4_id, p8, NOW()-INTERVAL '1d' +TIME '19:00', NOW()-INTERVAL '1d' +TIME '20:00', 'VIRTUAL',    'COMPLETADA', 110.00, 'Hooks y estado'),
    -- s10 eliminado: no crear sesiones futuras en seed para evitar conflictos de horario
    (s10, est1_id, p1, NOW()-INTERVAL '2d' +TIME '09:00', NOW()-INTERVAL '2d' +TIME '10:00', 'VIRTUAL',    'COMPLETADA', 80.00,  'Derivadas parciales');

  -- Reseñas
  INSERT INTO resenas (sesion_id,estudiante_id,profesor_id,calificacion,comentario) VALUES
    (s1, est1_id, p1, 5, 'María explica con una claridad impresionante. Pasé de tener miedo al cálculo a disfrutarlo. Totalmente recomendada.'),
    (s2, est2_id, p1, 4, 'Muy buena profesora, cubre el tema completo y tiene mucha paciencia. El material que usa es excelente.'),
    (s3, est3_id, p4, 5, 'Diego me ayudó a entender física de una manera que ningún profesor del instituto había logrado. Es un crack.'),
    (s4, est4_id, p4, 5, 'Excelente profesor, muy paciente y con ejemplos muy prácticos. Me preparé bien para el parcial y saqué 18.'),
    (s5, est3_id, p5, 5, 'Valentina es increíble. La clase fluye de forma muy natural, aprendes sin darte cuenta. Mi speaking mejoró muchísimo.'),
    (s6, est4_id, p5, 4, 'Muy buena profesora, dinámica y actualizada en metodología. El material que usa es excelente y muy práctico.'),
    (s7, est3_id, p6, 5, 'Roberto domina la economía por completo. Explica conceptos difíciles con ejemplos del día a día peruano. Recomendadísimo.'),
    (s8, est3_id, p8, 5, 'Andrés es un crack del desarrollo web. En una hora aprendí más que en semanas de tutoriales de YouTube. 100% recomendado.'),
    (s9, est4_id, p8, 5, 'La mejor inversión académica que he hecho. Aprende a pensar como programador desde la primera clase.');

END $$;

-- Verificación
SELECT u.nombre, pp.estado, pp.ciudad, pp.anos_experiencia, pp.rating_promedio, pp.total_resenas
FROM perfiles_profesor pp JOIN usuarios u ON u.id = pp.usuario_id
ORDER BY pp.rating_promedio DESC;
