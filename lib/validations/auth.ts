import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

// Lista corta de contraseñas comunes (rechazar las más obvias)
const PASSWORDS_COMUNES = [
  "password", "12345678", "123456789", "qwerty", "abc123", "password1",
  "password123", "111111", "admin123", "letmein", "welcome", "monkey",
  "dragon", "iloveyou", "1234567890",
];

export const passwordFuerteSchema = z
  .string()
  .min(8,  "Mínimo 8 caracteres")
  .max(100, "Máximo 100 caracteres")
  .regex(/[a-z]/, "Debe incluir al menos una minúscula")
  .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
  .regex(/[0-9]/, "Debe incluir al menos un número")
  .regex(/[^A-Za-z0-9]/, "Debe incluir al menos un símbolo (!@#$%...)")
  .refine(p => !PASSWORDS_COMUNES.includes(p.toLowerCase()),
    "Esta contraseña es muy común, elige una más segura");

export const registerSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(120),
  email: z.string().email("Email inválido"),
  password: passwordFuerteSchema,
  rol: z.enum(["ESTUDIANTE", "PROFESOR"], {
    errorMap: () => ({ message: "Rol inválido" }),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
