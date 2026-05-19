import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSoles(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export const DIA_SEMANA_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

export const NIVEL_LABELS: Record<string, string> = {
  SECUNDARIA: "Secundaria",
  TECNICA: "Técnica",
  UNIVERSITARIA: "Universitaria",
};

export const MODALIDAD_LABELS: Record<string, string> = {
  VIRTUAL: "Virtual",
  PRESENCIAL: "Presencial",
};

export const ESTADO_SESION_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

export const ESTADO_SESION_COLORS: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  CONFIRMADA: "bg-blue-100 text-blue-800",
  COMPLETADA: "bg-green-100 text-green-800",
  CANCELADA: "bg-red-100 text-red-800",
};

// Convierte un Date de Prisma @db.Time() (1970-01-01T18:00:00Z) a "18:00"
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(11, 16);
}

export function calcularIngresoNeto(precioHora: number | string): number {
  const precio = typeof precioHora === "string" ? parseFloat(precioHora) : precioHora;
  return precio * 0.78;
}

export function calcularComision(precioHora: number | string): number {
  const precio = typeof precioHora === "string" ? parseFloat(precioHora) : precioHora;
  return precio * 0.22;
}
