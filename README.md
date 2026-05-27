# ProfeLink MVP

Plataforma edtech peruana que conecta estudiantes con profesores independientes para asesorías académicas.

## Stack técnico

- **Framework**: Next.js 15 con App Router (TypeScript)
- **Base de datos**: PostgreSQL (local)
- **ORM**: Prisma
- **Auth**: JWT en cookies httpOnly
- **Estilos**: Tailwind CSS + Lucide icons
- **Validaciones**: Zod
- **Fechas**: date-fns

---

## Requisitos previos

- Node.js >= 18
- PostgreSQL >= 14 corriendo localmente
- `psql` en el PATH (cliente PostgreSQL)

---

## Instalación paso a paso

### 1. Clonar / posicionarse en el proyecto

```bash
cd profelink-mvp
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Editar `.env.local` con tus credenciales de PostgreSQL:

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/profelink"
JWT_SECRET="genera_un_secreto_de_al_menos_32_caracteres_aqui"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="tu_google_client_id"
GOOGLE_CLIENT_SECRET="tu_google_client_secret"
```

Si usarás login con Google, crea un OAuth Client en Google Cloud y registra:

- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`

### 4. Crear la base de datos y ejecutar el schema

```bash
# Opción A — ejecutar el SQL completo (crea la BD, tablas y seed)
psql -U postgres -f schema.sql

# Opción B — si la BD ya existe y solo quieres las tablas + seed
psql -U postgres -d profelink -f schema.sql
```

> El archivo `schema.sql` incluye: ENUMs, tablas, triggers, índices y datos de prueba.

### 5. Generar el cliente Prisma

```bash
npx prisma generate
```

> No uses `prisma migrate` — el schema ya fue creado por `schema.sql`. Solo genera el cliente.

### 6. Levantar el servidor de desarrollo

```bash
npm run dev
```

La app estará disponible en **http://localhost:3000**

---

## Usuarios seed (contraseña: `password123`)

| Rol        | Email                   | Descripción                        |
|------------|-------------------------|------------------------------------|
| ADMIN      | admin@profelink.pe      | Panel de administración completo   |
| PROFESOR   | maria@profelink.pe      | Perfil **VERIFICADO**, rating 4.5  |
| PROFESOR   | carlos@profelink.pe     | Perfil **PENDIENTE**               |
| PROFESOR   | ana@profelink.pe        | Perfil **RECHAZADO**               |
| ESTUDIANTE | luis@profelink.pe       | 2 sesiones completadas, 1 activa   |
| ESTUDIANTE | sofia@profelink.pe      | 1 sesión completada, 1 pendiente   |

---

## Estructura del proyecto

```
profelink-mvp/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx               ← sidebar + protección de sesión
│   │   ├── estudiante/
│   │   │   ├── page.tsx             ← dashboard estudiante
│   │   │   └── sesiones/page.tsx    ← mis sesiones
│   │   ├── profesor/
│   │   │   ├── page.tsx             ← dashboard profesor
│   │   │   ├── disponibilidad/page.tsx
│   │   │   └── ingresos/page.tsx
│   │   └── admin/
│   │       ├── page.tsx             ← métricas globales
│   │       └── profesores/page.tsx  ← verificar/rechazar
│   ├── profesores/
│   │   ├── page.tsx                 ← buscador público
│   │   └── [id]/page.tsx            ← perfil del profesor
│   └── api/
│       ├── auth/{login,register,logout}/route.ts
│       ├── profesores/route.ts
│       ├── profesores/[id]/route.ts
│       ├── profesores/[id]/resenas/route.ts
│       ├── sesiones/route.ts
│       ├── sesiones/[id]/estado/route.ts
│       ├── disponibilidad/route.ts
│       ├── admin/profesores/route.ts
│       └── admin/metricas/route.ts
├── components/
│   ├── auth/{LoginForm,RegisterForm}.tsx
│   ├── layout/Sidebar.tsx
│   ├── profesores/{ProfesorCard,BuscadorFiltros,ResenaCard}.tsx
│   └── sesiones/{SesionCard,ReservarSesionForm}.tsx
├── lib/
│   ├── prisma.ts                    ← singleton Prisma
│   ├── auth.ts                      ← JWT helpers
│   ├── utils.ts                     ← formateo, constantes
│   └── validations/{auth,sesion}.ts ← esquemas Zod
├── middleware.ts                    ← protección de rutas por rol
├── prisma/schema.prisma
├── schema.sql                       ← DDL completo + seed
├── types/index.ts
└── .env.local.example
```

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
- Editable desde la API (`PUT /api/profesores`)
- Badge "Docente Verificado" en estado VERIFICADO

### Buscador de Profesores
- Filtros: materia, nivel académico, precio máximo, modalidad
- Paginado, ordenado por rating
- Solo muestra profesores VERIFICADOS

### Disponibilidad y Agendamiento
- Profesor configura slots semanales (día + hora inicio + hora fin)
- Estudiante reserva desde el perfil del profesor
- Trigger PostgreSQL previene solapamientos
- Estados: PENDIENTE → CONFIRMADA → COMPLETADA / CANCELADA

### Reseñas
- Solo el estudiante que tomó la sesión puede reseñar
- Solo si la sesión está COMPLETADA
- Inmutables (sin UPDATE ni DELETE)
- Trigger PostgreSQL recalcula el rating automáticamente

### Panel Admin
- Verificar / Rechazar perfiles de profesores
- Métricas: usuarios, sesiones, ingresos proyectados (22% comisión)

### Dashboards
- **Estudiante**: próximas sesiones, historial, acceso al buscador
- **Profesor**: sesiones del día, disponibilidad, ingresos netos (78%)
- **Admin**: métricas + gestión de profesores

---

## Reglas de negocio clave

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

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo (http://localhost:3000)
npm run build        # Build de producción
npm run start        # Servidor de producción
npx prisma studio    # GUI para explorar la base de datos
npx prisma generate  # Regenerar cliente Prisma tras cambios en schema.prisma
```

---

## Despliegue con Google OAuth

En producción debes configurar estas variables en el servidor:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="secreto_real_largo"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"
GOOGLE_CLIENT_ID="tu_google_client_id"
GOOGLE_CLIENT_SECRET="tu_google_client_secret"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="ProfeLink <tu-correo-verificado@tu-dominio.com>"
```

En Google Cloud, el mismo OAuth Client debe incluir:

- Authorized JavaScript origins: `https://tu-dominio.com`
- Authorized redirect URIs: `https://tu-dominio.com/api/auth/google/callback`

Si el dominio final cambia, actualiza `NEXT_PUBLIC_APP_URL` y también el redirect URI en Google.

---

## Notas de desarrollo

- Las contraseñas se hashean con bcrypt (10 rounds)
- El trigger `trg_check_solapamiento` en PostgreSQL garantiza consistencia de horarios
- El trigger `trg_actualizar_rating` recalcula el rating promedio tras cada reseña
- El `middleware.ts` de Next.js protege todas las rutas de dashboard sin DB calls (solo verifica el JWT)
- Los Server Components leen la sesión del cookie directamente con `getSession()`
