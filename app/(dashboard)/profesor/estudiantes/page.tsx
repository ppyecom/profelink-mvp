import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users, Calendar, CheckCircle, DollarSign } from "lucide-react";
import { formatSoles } from "@/lib/utils";

export const metadata = { title: "Mis Estudiantes — ProfeLink" };

export default async function MisEstudiantesPage() {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") redirect("/login");

  const perfil = await prisma.perfilProfesor.findUnique({ where: { usuarioId: session.sub } });
  if (!perfil) redirect("/profesor");

  // Agrupar sesiones por estudiante
  const sesiones = await prisma.sesion.findMany({
    where: { profesorId: perfil.id },
    orderBy: { fechaInicio: "desc" },
    include: { estudiante: { select: { id: true, nombre: true, email: true } } },
  });

  // Map estudianteId → { datos, sesiones }
  const grupos = new Map<string, {
    nombre: string;
    email: string;
    totalSesiones: number;
    completadas: number;
    proximaSesion: Date | null;
    ingresoNeto: number;
  }>();

  for (const s of sesiones) {
    const e = s.estudiante;
    if (!grupos.has(e.id)) {
      grupos.set(e.id, {
        nombre: e.nombre,
        email: e.email,
        totalSesiones: 0,
        completadas: 0,
        proximaSesion: null,
        ingresoNeto: 0,
      });
    }
    const g = grupos.get(e.id)!;
    g.totalSesiones++;
    if (s.estado === "COMPLETADA") {
      g.completadas++;
      g.ingresoNeto += Number(s.precioAcordado) * 0.78;
    }
    if (["CONFIRMADA", "PENDIENTE"].includes(s.estado) && s.fechaInicio > new Date()) {
      if (!g.proximaSesion || s.fechaInicio < g.proximaSesion) {
        g.proximaSesion = s.fechaInicio;
      }
    }
  }

  const estudiantes = Array.from(grupos.entries())
    .map(([id, g]) => ({ id, ...g }))
    .sort((a, b) => b.totalSesiones - a.totalSesiones);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-brand-text flex items-center gap-2">
          <Users className="w-6 h-6 text-violet-600" /> Mis Estudiantes
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {estudiantes.length} estudiante{estudiantes.length !== 1 ? "s" : ""} han tomado clases contigo
        </p>
      </div>

      {estudiantes.length === 0 ? (
        <div className="bento p-10 text-center elev-1">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-heading font-semibold text-gray-500">Aún no tienes estudiantes</p>
          <p className="text-sm text-gray-400 mt-1">Cuando reciban tu primera reserva aparecerá acá</p>
        </div>
      ) : (
        <div className="space-y-3">
          {estudiantes.map(e => (
            <div key={e.id} className="bento p-5 elev-1 flex flex-wrap items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-heading font-bold text-lg flex-shrink-0">
                {e.nombre.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-[200px]">
                <p className="font-heading font-bold text-brand-text">{e.nombre}</p>
                <p className="text-xs text-gray-400">{e.email}</p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="text-center">
                  <p className="font-heading font-bold text-brand-text">{e.totalSesiones}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Total</p>
                </div>
                <div className="text-center">
                  <p className="font-heading font-bold text-emerald-600">{e.completadas}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Completadas</p>
                </div>
                <div className="text-center">
                  <p className="font-heading font-bold text-amber-600">{formatSoles(e.ingresoNeto)}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Ingreso neto</p>
                </div>
              </div>

              {e.proximaSesion && (
                <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  Próxima: {e.proximaSesion.toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
