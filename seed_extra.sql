-- =============================================================================
-- Seed adicional: más profesores con fotos reales, más sesiones y reseñas
-- Ejecutar: psql -U postgres -p 5433 -d profelink -f seed_extra.sql
-- =============================================================================

DO $$
DECLARE
    prof4_id   UUID := gen_random_uuid();
    prof5_id   UUID := gen_random_uuid();
    prof6_id   UUID := gen_random_uuid();
    prof7_id   UUID := gen_random_uuid();
    prof8_id   UUID := gen_random_uuid();

    est3_id    UUID := gen_random_uuid();
    est4_id    UUID := gen_random_uuid();

    perfil4_id UUID;
    perfil5_id UUID;
    perfil6_id UUID;
    perfil7_id UUID;
    perfil8_id UUID;

    -- perfiles existentes del seed original
    p1_id      UUID;
    p2_id      UUID;

    hash_pass  TEXT;

    s1 UUID := gen_random_uuid();
    s2 UUID := gen_random_uuid();
    s3 UUID := gen_random_uuid();
    s4 UUID := gen_random_uuid();
    s5 UUID := gen_random_uuid();
    s6 UUID := gen_random_uuid();
    s7 UUID := gen_random_uuid();
    s8 UUID := gen_random_uuid();
BEGIN
    hash_pass := crypt('password123', gen_salt('bf', 10));

    -- IDs de perfiles originales
    SELECT pp.id INTO p1_id FROM perfiles_profesor pp
        JOIN usuarios u ON u.id = pp.usuario_id WHERE u.email = 'maria@profelink.pe';
    SELECT pp.id INTO p2_id FROM perfiles_profesor pp
        JOIN usuarios u ON u.id = pp.usuario_id WHERE u.email = 'carlos@profelink.pe';

    -- Nuevos usuarios profesores
    INSERT INTO usuarios (id, nombre, email, password_hash, rol) VALUES
        (prof4_id, 'Diego Ramírez',    'diego@profelink.pe',    hash_pass, 'PROFESOR'),
        (prof5_id, 'Valentina Cruz',   'vale@profelink.pe',     hash_pass, 'PROFESOR'),
        (prof6_id, 'Roberto Sánchez',  'roberto@profelink.pe',  hash_pass, 'PROFESOR'),
        (prof7_id, 'Camila Vega',      'camila@profelink.pe',   hash_pass, 'PROFESOR'),
        (prof8_id, 'Andrés Herrera',   'andres@profelink.pe',   hash_pass, 'PROFESOR');

    -- Nuevos estudiantes
    INSERT INTO usuarios (id, nombre, email, password_hash, rol) VALUES
        (est3_id, 'Gabriela Quispe',  'gabi@profelink.pe',   hash_pass, 'ESTUDIANTE'),
        (est4_id, 'Marco Flores',     'marco@profelink.pe',  hash_pass, 'ESTUDIANTE');

    -- Perfiles de los nuevos profesores
    INSERT INTO perfiles_profesor (id, usuario_id, foto_url, bio, nivel, precio_hora, modalidad, estado)
    VALUES
        (
            gen_random_uuid(), prof4_id,
            'https://randomuser.me/api/portraits/men/75.jpg',
            'Físico de la PUCP con 6 años enseñando. Domino mecánica clásica, electromagnetismo y física moderna. Clases con simulaciones y problemas reales.',
            ARRAY['UNIVERSITARIA', 'SECUNDARIA']::"NivelAcademico"[],
            75.00, 'VIRTUAL', 'VERIFICADO'
        ),
        (
            gen_random_uuid(), prof5_id,
            'https://randomuser.me/api/portraits/women/90.jpg',
            'Traductora e intérprete certificada. Enseño inglés y francés desde nivel básico hasta C2. Metodología comunicativa enfocada en conversación.',
            ARRAY['UNIVERSITARIA', 'TECNICA', 'SECUNDARIA']::"NivelAcademico"[],
            90.00, 'VIRTUAL', 'VERIFICADO'
        ),
        (
            gen_random_uuid(), prof6_id,
            'https://randomuser.me/api/portraits/men/52.jpg',
            'Economista con MBA. Enseño microeconomía, macroeconomía, finanzas personales y estadística aplicada a negocios.',
            ARRAY['UNIVERSITARIA']::"NivelAcademico"[],
            85.00, 'VIRTUAL', 'VERIFICADO'
        ),
        (
            gen_random_uuid(), prof7_id,
            'https://randomuser.me/api/portraits/women/33.jpg',
            'Química farmacéutica con doctorado. Enseño química orgánica, inorgánica y bioquímica. Tengo material propio y exámenes resueltos.',
            ARRAY['UNIVERSITARIA', 'SECUNDARIA']::"NivelAcademico"[],
            95.00, 'PRESENCIAL', 'VERIFICADO'
        ),
        (
            gen_random_uuid(), prof8_id,
            'https://randomuser.me/api/portraits/men/18.jpg',
            'Desarrollador Full Stack con 8 años de experiencia. Enseño JavaScript, React, Node.js, Python y estructuras de datos. Enfoque práctico con proyectos reales.',
            ARRAY['UNIVERSITARIA', 'TECNICA']::"NivelAcademico"[],
            110.00, 'VIRTUAL', 'VERIFICADO'
        );

    -- Recuperar IDs
    SELECT id INTO perfil4_id FROM perfiles_profesor WHERE usuario_id = prof4_id;
    SELECT id INTO perfil5_id FROM perfiles_profesor WHERE usuario_id = prof5_id;
    SELECT id INTO perfil6_id FROM perfiles_profesor WHERE usuario_id = prof6_id;
    SELECT id INTO perfil7_id FROM perfiles_profesor WHERE usuario_id = prof7_id;
    SELECT id INTO perfil8_id FROM perfiles_profesor WHERE usuario_id = prof8_id;

    -- Especialidades
    INSERT INTO especialidades (profesor_id, materia) VALUES
        (perfil4_id, 'Física'),
        (perfil4_id, 'Mecánica Clásica'),
        (perfil4_id, 'Electromagnetismo'),
        (perfil5_id, 'Inglés'),
        (perfil5_id, 'Francés'),
        (perfil5_id, 'Preparación IELTS'),
        (perfil6_id, 'Economía'),
        (perfil6_id, 'Microeconomía'),
        (perfil6_id, 'Finanzas'),
        (perfil6_id, 'Estadística'),
        (perfil7_id, 'Química Orgánica'),
        (perfil7_id, 'Bioquímica'),
        (perfil7_id, 'Química General'),
        (perfil8_id, 'JavaScript'),
        (perfil8_id, 'React'),
        (perfil8_id, 'Python'),
        (perfil8_id, 'Estructuras de Datos');

    -- Disponibilidad
    INSERT INTO disponibilidad (profesor_id, dia_semana, hora_inicio, hora_fin) VALUES
        (perfil4_id, 1, '18:00', '21:00'),
        (perfil4_id, 3, '18:00', '21:00'),
        (perfil4_id, 6, '09:00', '13:00'),
        (perfil5_id, 2, '07:00', '12:00'),
        (perfil5_id, 4, '07:00', '12:00'),
        (perfil5_id, 6, '08:00', '13:00'),
        (perfil6_id, 1, '12:00', '16:00'),
        (perfil6_id, 2, '12:00', '16:00'),
        (perfil6_id, 4, '12:00', '16:00'),
        (perfil7_id, 3, '10:00', '14:00'),
        (perfil7_id, 5, '10:00', '14:00'),
        (perfil8_id, 2, '19:00', '22:00'),
        (perfil8_id, 4, '19:00', '22:00'),
        (perfil8_id, 6, '10:00', '14:00');

    -- Sesiones completadas para ratings
    INSERT INTO sesiones (id, estudiante_id, profesor_id, fecha_inicio, fecha_fin, modalidad, estado, precio_acordado)
    VALUES
        (s1, est3_id, perfil4_id, NOW()-INTERVAL '15 days'+TIME '18:00', NOW()-INTERVAL '15 days'+TIME '19:00', 'VIRTUAL', 'COMPLETADA', 75.00),
        (s2, est4_id, perfil4_id, NOW()-INTERVAL '8 days'+TIME '18:00',  NOW()-INTERVAL '8 days'+TIME '19:00',  'VIRTUAL', 'COMPLETADA', 75.00),
        (s3, est3_id, perfil5_id, NOW()-INTERVAL '12 days'+TIME '07:00', NOW()-INTERVAL '12 days'+TIME '08:00', 'VIRTUAL', 'COMPLETADA', 90.00),
        (s4, est4_id, perfil5_id, NOW()-INTERVAL '6 days'+TIME '07:00',  NOW()-INTERVAL '6 days'+TIME '08:00',  'VIRTUAL', 'COMPLETADA', 90.00),
        (s5, est3_id, perfil6_id, NOW()-INTERVAL '20 days'+TIME '12:00', NOW()-INTERVAL '20 days'+TIME '13:00', 'VIRTUAL', 'COMPLETADA', 85.00),
        (s6, est3_id, perfil8_id, NOW()-INTERVAL '3 days'+TIME '19:00',  NOW()-INTERVAL '3 days'+TIME '20:00',  'VIRTUAL', 'COMPLETADA', 110.00),
        (s7, est4_id, perfil8_id, NOW()-INTERVAL '1 days'+TIME '19:00',  NOW()-INTERVAL '1 days'+TIME '20:00',  'VIRTUAL', 'COMPLETADA', 110.00),
        (s8, est3_id, perfil7_id, NOW()+INTERVAL '3 days'+TIME '10:00',  NOW()+INTERVAL '3 days'+TIME '11:00',  'PRESENCIAL', 'CONFIRMADA', 95.00);

    -- Reseñas
    INSERT INTO resenas (sesion_id, estudiante_id, profesor_id, calificacion, comentario) VALUES
        (s1, est3_id, perfil4_id, 5, 'Diego explica la física de una manera increíblemente clara. Resolví problemas que nunca había podido entender antes. 100% recomendado.'),
        (s2, est4_id, perfil4_id, 5, 'Excelente profesor, muy paciente y con ejemplos muy prácticos. Me ayudó a prepararme para el parcial y saqué 18.'),
        (s3, est3_id, perfil5_id, 5, 'Valentina es increíble para el inglés. La clase fluye de forma muy natural y aprendes sin darte cuenta. Mi speaking mejoró mucho.'),
        (s4, est4_id, perfil5_id, 4, 'Muy buena profesora, dinámica y actualizada en metodología. El material que usa es excelente.'),
        (s5, est3_id, perfil6_id, 5, 'Roberto tiene un dominio total de la economía. Explica conceptos difíciles con ejemplos del día a día. Muy recomendable.'),
        (s6, est3_id, perfil8_id, 5, 'Andrés es un crack del desarrollo web. En una hora aprendí más que en semanas de videos. Código limpio y buenas prácticas desde el inicio.'),
        (s7, est4_id, perfil8_id, 5, 'La mejor inversión académica que he hecho. Andrés va al ritmo del estudiante y te enseña a pensar como programador.');

    -- Actualizar foto del perfil de María García (seed original)
    UPDATE perfiles_profesor SET foto_url = 'https://randomuser.me/api/portraits/women/44.jpg'
    WHERE id = p1_id;

    -- Actualizar foto de Carlos Mendoza
    UPDATE perfiles_profesor SET foto_url = 'https://randomuser.me/api/portraits/men/32.jpg'
    WHERE id = p2_id;

END $$;
