import { z } from "zod";

export const crearSesionSchema = z.object({
  profesorId: z.string().uuid("ID de profesor inválido"),
  fechaInicio: z.string().datetime("Fecha de inicio inválida"),
  fechaFin: z.string().datetime("Fecha de fin inválida"),
  modalidad: z.enum(["VIRTUAL", "PRESENCIAL"]),
  duracionMinutos: z.number().int().refine(d => d === 30 || d === 60, "Duración inválida").default(60),
  cuponCodigo: z.string().max(40).optional(),
  notas: z.string().max(500).optional(),
}).refine(
  (data) => new Date(data.fechaFin) > new Date(data.fechaInicio),
  { message: "La fecha de fin debe ser posterior a la de inicio", path: ["fechaFin"] }
);

export const actualizarEstadoSchema = z.object({
  estado: z.enum(["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA"]),
});

export const crearResenaSchema = z.object({
  sesionId: z.string().uuid("ID de sesión inválido"),
  calificacion: z.number().int().min(1).max(5),
  comentario: z.string().max(1000).optional().or(z.literal("").transform(() => undefined)),
});

export const disponibilidadSchema = z.object({
  diaSemana: z.number().int().min(0).max(6),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
}).refine(
  (data) => data.horaFin > data.horaInicio,
  { message: "La hora de fin debe ser posterior a la de inicio", path: ["horaFin"] }
);

export const perfilProfesorSchema = z.object({
  bio: z.string().max(1000).optional().or(z.literal("")),
  fotoUrl: z.union([
    z.string().url("URL inválida"),
    z.string().regex(/^\/(api\/)?uploads\//, "Ruta inválida"),
    z.literal(""),
  ]).optional(),
  videoPresentacion: z.union([
    z.string().url("URL inválida"),
    z.literal(""),
  ]).optional(),
  nivel: z.array(z.enum(["SECUNDARIA", "TECNICA", "UNIVERSITARIA"])).default([]),
  precioHora: z.number().min(0, "El precio no puede ser negativo").default(50),
  precio30min: z.number().min(0).max(500).optional().nullable(),
  aceptaPrimeraGratis: z.boolean().default(false),
  modalidad: z.enum(["VIRTUAL", "PRESENCIAL"]).default("VIRTUAL"),
  especialidades: z.array(z.string().min(1).max(100)).default([]),
  // Nuevos campos del perfil profesional
  ciudad: z.string().max(80).optional().or(z.literal("")),
  institucion: z.string().max(120).optional().or(z.literal("")),
  anosExperiencia: z.number().int().min(0).max(80).default(0),
  // Pago manual Yape / Plin
  yapeNumero: z.string().regex(/^\d{9}$/, "Debe ser un número de 9 dígitos").optional().or(z.literal("")),
  yapeQrUrl: z.union([
    z.string().regex(/^\/(api\/)?uploads\//, "Ruta inválida"),
    z.string().url(),
    z.literal(""),
  ]).optional(),
  plinNumero: z.string().regex(/^\d{9}$/, "Debe ser un número de 9 dígitos").optional().or(z.literal("")),
  plinQrUrl: z.union([
    z.string().regex(/^\/(api\/)?uploads\//, "Ruta inválida"),
    z.string().url(),
    z.literal(""),
  ]).optional(),
});

export type CrearSesionInput = z.infer<typeof crearSesionSchema>;
export type ActualizarEstadoInput = z.infer<typeof actualizarEstadoSchema>;
export type CrearResenaInput = z.infer<typeof crearResenaSchema>;
export type DisponibilidadInput = z.infer<typeof disponibilidadSchema>;
export type PerfilProfesorInput = z.infer<typeof perfilProfesorSchema>;
