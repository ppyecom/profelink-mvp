import { z } from "zod";

export const crearSesionSchema = z.object({
  profesorId: z.string().uuid("ID de profesor inválido"),
  fechaInicio: z.string().datetime("Fecha de inicio inválida"),
  fechaFin: z.string().datetime("Fecha de fin inválida"),
  modalidad: z.enum(["VIRTUAL", "PRESENCIAL"]),
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
  bio: z.string().max(1000).optional(),
  fotoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  nivel: z.array(z.enum(["SECUNDARIA", "TECNICA", "UNIVERSITARIA"])).min(1, "Selecciona al menos un nivel"),
  precioHora: z.number().positive("El precio debe ser mayor a 0"),
  modalidad: z.enum(["VIRTUAL", "PRESENCIAL"]),
  especialidades: z.array(z.string().min(2).max(100)).min(1, "Agrega al menos una especialidad"),
});

export type CrearSesionInput = z.infer<typeof crearSesionSchema>;
export type ActualizarEstadoInput = z.infer<typeof actualizarEstadoSchema>;
export type CrearResenaInput = z.infer<typeof crearResenaSchema>;
export type DisponibilidadInput = z.infer<typeof disponibilidadSchema>;
export type PerfilProfesorInput = z.infer<typeof perfilProfesorSchema>;
