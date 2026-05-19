export type RolUsuario = "ESTUDIANTE" | "PROFESOR" | "ADMIN";
export type EstadoProfesor = "PENDIENTE" | "VERIFICADO" | "RECHAZADO";
export type EstadoSesion = "PENDIENTE" | "CONFIRMADA" | "COMPLETADA" | "CANCELADA";
export type ModalidadSesion = "VIRTUAL" | "PRESENCIAL";
export type NivelAcademico = "SECUNDARIA" | "TECNICA" | "UNIVERSITARIA";

export interface UsuarioPublico {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  createdAt: string;
}

export interface ProfesorResumen {
  id: string;
  usuarioId: string;
  nombre: string;
  fotoUrl: string | null;
  bio: string | null;
  nivel: NivelAcademico[];
  precioHora: number;
  modalidad: ModalidadSesion;
  estado: EstadoProfesor;
  ratingPromedio: number;
  totalResenas: number;
  especialidades: string[];
}

export interface ProfesorDetalle extends ProfesorResumen {
  disponibilidad: DisponibilidadSlot[];
  resenas: ResenaPublica[];
}

export interface DisponibilidadSlot {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

export interface SesionResumen {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  modalidad: ModalidadSesion;
  estado: EstadoSesion;
  precioAcordado: number;
  notas: string | null;
  createdAt: string;
  profesor?: {
    id: string;
    nombre: string;
    fotoUrl: string | null;
  };
  estudiante?: {
    id: string;
    nombre: string;
  };
  resena?: ResenaPublica | null;
}

export interface ResenaPublica {
  id: string;
  calificacion: number;
  comentario: string | null;
  createdAt: string;
  estudiante: {
    nombre: string;
  };
}

export interface MetricasAdmin {
  totalUsuarios: number;
  totalEstudiantes: number;
  totalProfesores: number;
  totalSesiones: number;
  sesionesCompletadas: number;
  ingresosProyectados: number;
  profesoresPendientes: number;
}

export interface FiltrosProfesores {
  materia?: string;
  nivel?: NivelAcademico;
  precioMax?: number;
  modalidad?: ModalidadSesion;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
