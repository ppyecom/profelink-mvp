# ProfeLink MVP

Plataforma edtech peruana que conecta estudiantes con profesores independientes para asesorías académicas.

## Stack técnico

- **Framework**: Next.js con App Router
- **Base de datos**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT en cookies httpOnly
- **Estilos**: Tailwind CSS + Lucide icons
- **Validaciones**: Zod
- **Fechas**: date-fns

---

## Requisitos previos

- Node.js
- PostgreSQL 

---

## Módulos implementados

### Autenticación
- Registro con rol ESTUDIANTE / PROFESOR
- Login con JWT en cookie httpOnly (7 días)
- Login/registro con Google OAuth
- Middleware protege rutas por rol
- Logout limpia la cookie

### Perfil del Profesor
- Auto-creado al registrarse como PROFESOR

### Buscador de Profesores
- Filtros: materia, nivel académico, precio máximo, modalidad
- Paginado, ordenado por rating
- Solo muestra profesores VERIFICADOS

### Disponibilidad y Agendamiento
- Profesor configura slots semanales (día + hora inicio + hora fin)
- Estudiante reserva desde el perfil del profesor
- Estados: PENDIENTE → CONFIRMADA → COMPLETADA / CANCELADA

### Reseñas
- Solo el estudiante que tomó la sesión puede reseñar
- Solo si la sesión está COMPLETADA
- Trigger PostgreSQL recalcula el rating automáticamente

### Panel Admin
- Verificar / Rechazar perfiles de profesores
- Métricas: usuarios, sesiones, ingresos proyectados (22% comisión)

### Dashboards
- **Estudiante**: próximas sesiones, historial, acceso al buscador
- **Profesor**: sesiones del día, disponibilidad, ingresos netos (78%)
- **Admin**: métricas + gestión de profesores

---

## Reglas

1. Solo estudiantes pueden reservar sesiones
2. Solo el admin cambia el estado de verificación del profesor
3. Solo el estudiante que tomó la sesión puede dejar reseña
4. La reseña requiere que la sesión esté en COMPLETADA
5. No puede haber dos sesiones del mismo profesor en el mismo horario
6. No puede haber dos sesiones del mismo estudiante en el mismo horario
7. Las reseñas no se editan ni eliminan
8. Todos los precios en soles peruanos (S/)
9. Comisión ProfeLink: 22% | Ingreso del profesor: 78%

---

