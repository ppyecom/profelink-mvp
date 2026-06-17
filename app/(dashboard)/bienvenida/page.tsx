import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BienvenidaProfesor from "@/components/onboarding/BienvenidaProfesor";
import BienvenidaEstudiante from "@/components/onboarding/BienvenidaEstudiante";

export const metadata = { title: "Bienvenido — ProfeLink" };

/**
 * Página de bienvenida post-registro. Solo se muestra a usuarios cuyo
 * perfil aún está vacío. Si ya está completo, redirige al dashboard.
 */
export default async function BienvenidaPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Admin no necesita onboarding
  if (session.rol === "ADMIN") redirect("/admin");

  if (session.rol === "PROFESOR") {
    const perfil = await prisma.perfilProfesor.findUnique({
      where: { usuarioId: session.sub },
      include: { especialidades: true, disponibilidad: true },
    });

    const yaCompleto =
      !!perfil?.bio &&
      perfil.especialidades.length > 0 &&
      perfil.disponibilidad.length > 0;

    if (yaCompleto) redirect("/profesor");

    return <BienvenidaProfesor nombre={session.nombre} />;
  }

  // ESTUDIANTE — bienvenida simple
  return <BienvenidaEstudiante nombre={session.nombre} />;
}
