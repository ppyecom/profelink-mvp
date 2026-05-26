import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import IngresosClient from "@/components/profesores/IngresosClient";

export const metadata = { title: "Ingresos — ProfeLink" };

export default async function IngresosPage() {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") redirect("/login");

  const perfil = await prisma.perfilProfesor.findUnique({ where: { usuarioId: session.sub } });
  if (!perfil) redirect("/login");

  const sesiones = await prisma.sesion.findMany({
    where: { profesorId: perfil.id, estado: "COMPLETADA" },
    orderBy: { fechaInicio: "desc" },
    include: { estudiante: { select: { nombre: true } } },
  });

  return (
    <IngresosClient
      sesiones={sesiones.map(s => ({
        id: s.id,
        estudiante: s.estudiante.nombre,
        fecha: s.fechaInicio.toISOString(),
        precio: Number(s.precioAcordado),
      }))}
    />
  );
}
