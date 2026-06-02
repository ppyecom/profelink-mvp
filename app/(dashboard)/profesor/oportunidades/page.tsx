import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Lightbulb, BookOpen, Clock } from "lucide-react";

export const metadata = { title: "Oportunidades — ProfeLink" };

export default async function OportunidadesPage() {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") redirect("/login");

  const perfil = await prisma.perfilProfesor.findUnique({
    where: { usuarioId: session.sub },
    include: { especialidades: { select: { materia: true } } },
  });
  if (!perfil) redirect("/profesor");

  const materiasProfesor = perfil.especialidades.map(e => e.materia.toLowerCase());

  // Obtener wishes activos
  const wishes = await prisma.wishlist.findMany({
    where: { resuelto: false },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Marcar cuáles coinciden con sus materias
  const enriquecidos = wishes.map(w => ({
    ...w,
    coincide: materiasProfesor.some(m => w.materia.toLowerCase().includes(m) || m.includes(w.materia.toLowerCase())),
  }));

  const coincidentes = enriquecidos.filter(w => w.coincide);
  const otros = enriquecidos.filter(w => !w.coincide);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-brand-text flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-amber-500" /> Oportunidades
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Estudiantes que están buscando un tutor. Las que coinciden con tus materias aparecen primero.
        </p>
      </div>

      {coincidentes.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-amber-700 uppercase mb-3">🎯 Coinciden con tus materias</h2>
          <div className="space-y-2">
            {coincidentes.map(w => (
              <div key={w.id} className="bento p-4 elev-2 border-l-4 border-amber-400">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-heading font-bold text-brand-text">{w.materia}</p>
                    {w.descripcion && <p className="text-sm text-gray-600 mt-1">{w.descripcion}</p>}
                    <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Hace {Math.floor((Date.now() - new Date(w.createdAt).getTime()) / 86400000)} días
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {otros.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-3">Otras búsquedas</h2>
          <div className="space-y-2">
            {otros.slice(0, 20).map(w => (
              <div key={w.id} className="bento p-3 elev-1 opacity-70">
                <p className="font-semibold text-sm text-brand-text">{w.materia}</p>
                {w.descripcion && <p className="text-xs text-gray-500 mt-0.5">{w.descripcion}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {wishes.length === 0 && (
        <div className="bento p-10 text-center elev-1">
          <Lightbulb className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Aún no hay búsquedas activas de estudiantes.</p>
        </div>
      )}
    </div>
  );
}
