import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Tip {
  id: string;
  prioridad: "alta" | "media" | "baja";
  titulo: string;
  descripcion: string;
  accion?: { label: string; href: string };
}

export async function GET() {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const perfil = await prisma.perfilProfesor.findUnique({
    where: { usuarioId: session.sub },
    include: {
      especialidades: true,
      disponibilidad: { where: { activo: true } },
      credenciales: { where: { estado: "APROBADA" } },
    },
  });

  if (!perfil) return NextResponse.json({ tips: [] });

  const tips: Tip[] = [];

  if (!perfil.fotoUrl) {
    tips.push({
      id: "foto",
      prioridad: "alta",
      titulo: "Sube una foto de perfil",
      descripcion: "Los tutores con foto reciben 3× más reservas. Toma menos de 1 minuto.",
      accion: { label: "Subir foto", href: "/profesor/perfil" },
    });
  }

  if (!perfil.bio || perfil.bio.length < 50) {
    tips.push({
      id: "bio",
      prioridad: "alta",
      titulo: "Completa tu biografía",
      descripcion: "Escribe al menos 50 caracteres sobre tu experiencia y metodología.",
      accion: { label: "Editar bio", href: "/profesor/perfil" },
    });
  }

  if (perfil.especialidades.length === 0) {
    tips.push({
      id: "materias",
      prioridad: "alta",
      titulo: "Agrega tus materias",
      descripcion: "Sin materias no apareces en el buscador.",
      accion: { label: "Agregar materias", href: "/profesor/perfil" },
    });
  }

  if (perfil.disponibilidad.length === 0) {
    tips.push({
      id: "disponibilidad",
      prioridad: "alta",
      titulo: "Configura tu disponibilidad semanal",
      descripcion: "Los estudiantes solo pueden reservar en horarios que marques disponibles.",
      accion: { label: "Configurar horarios", href: "/profesor/disponibilidad" },
    });
  }

  if (perfil.credenciales.length === 0) {
    tips.push({
      id: "credenciales",
      prioridad: "media",
      titulo: "Sube tu primera credencial",
      descripcion: "Un título o certificado te eleva de Básico a Experto o Docente.",
      accion: { label: "Agregar credencial", href: "/profesor/perfil" },
    });
  }

  if (!perfil.videoPresentacion) {
    tips.push({
      id: "video",
      prioridad: "media",
      titulo: "Agrega un video de presentación",
      descripcion: "Tutores con video reciben 40% más reservas en su primera semana.",
      accion: { label: "Agregar video", href: "/profesor/perfil" },
    });
  }

  if (!perfil.aceptaPrimeraGratis) {
    tips.push({
      id: "primera-gratis",
      prioridad: "baja",
      titulo: "Acepta sesiones gratis de bienvenida",
      descripcion: "Ganas visibilidad y ProfeLink te paga S/15 de subsidio por cada una.",
      accion: { label: "Activar", href: "/profesor/perfil" },
    });
  }

  if (perfil.totalResenas === 0) {
    tips.push({
      id: "primer-resena",
      prioridad: "baja",
      titulo: "Consigue tu primera reseña",
      descripcion: "Al terminar tu primera sesión, pídele al estudiante que deje una reseña.",
    });
  }

  return NextResponse.json({ tips });
}
