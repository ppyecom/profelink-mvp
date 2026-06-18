import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sparkles, Target, CheckCircle2, Calendar, Clock, ArrowRight, Plus, BookOpen, Circle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const metadata = { title: "Mis planes de estudio — ProfeLink" };
export const dynamic = "force-dynamic";

interface TemaPlan {
  orden: number;
  titulo: string;
  descripcion: string;
  duracionMin: number;
}

export default async function MisPlanesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.rol !== "ESTUDIANTE") redirect("/");

  const planes = await prisma.planEstudio.findMany({
    where: { estudianteId: session.sub },
    orderBy: { createdAt: "desc" },
    include: {
      sesiones: {
        select: {
          id: true,
          fechaInicio: true,
          estado: true,
          ordenEnPlan: true,
          temaAsignado: true,
          profesor: { include: { usuario: { select: { nombre: true } } } },
        },
        orderBy: { ordenEnPlan: "asc" },
      },
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white border-2 border-ink-900 rounded-3xl p-6 shadow-[6px_6px_0_0_rgba(28,25,23,1)]">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white text-violet-600 rounded-2xl flex items-center justify-center">
              <Target className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl">Mis planes de estudio</h1>
              <p className="text-sm text-white/90">
                {planes.length === 0
                  ? "Aún no tienes planes — genera uno con IA"
                  : `${planes.length} ${planes.length === 1 ? "plan generado" : "planes generados"}`}
              </p>
            </div>
          </div>
          <Link
            href="/estudiante/plan"
            className="inline-flex items-center gap-2 bg-white text-violet-700 font-bold px-4 py-2.5 rounded-xl hover:bg-violet-50 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Nuevo plan
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {planes.length === 0 ? (
        <div className="bg-white border-2 border-ink-900 rounded-3xl p-12 text-center shadow-[4px_4px_0_0_rgba(28,25,23,1)]">
          <div className="w-20 h-20 bg-violet-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-violet-600" />
          </div>
          <h2 className="font-display font-black text-2xl mb-2">Tu primer plan IA te espera</h2>
          <p className="text-ink-600 mb-6 max-w-md mx-auto">
            Dile a la IA tu meta (ej: <em>"preparar mi parcial de Cálculo II"</em>) y
            te arma un plan completo de N sesiones con los temas que necesitas.
          </p>
          <Link
            href="/estudiante/plan"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90"
          >
            <Sparkles className="w-4 h-4" /> Crear mi primer plan
          </Link>
        </div>
      ) : (
        /* Lista de planes */
        <div className="space-y-5">
          {planes.map((plan) => {
            const temas = (Array.isArray(plan.temas) ? plan.temas : []) as unknown as TemaPlan[];
            const total = plan.numSesionesRecomendadas || temas.length;

            // Mapeamos cada tema con su estado según las sesiones existentes
            const temasConEstado = temas
              .sort((a, b) => a.orden - b.orden)
              .map((t) => {
                const sesion = plan.sesiones.find((s) => s.ordenEnPlan === t.orden);
                let estado: "COMPLETADA" | "RESERVADA" | "PENDIENTE" = "PENDIENTE";
                if (sesion) {
                  estado = sesion.estado === "COMPLETADA" ? "COMPLETADA" : "RESERVADA";
                }
                return { ...t, sesion, estado };
              });

            const completadas = temasConEstado.filter((t) => t.estado === "COMPLETADA").length;
            const reservadas  = temasConEstado.filter((t) => t.estado === "RESERVADA").length;
            const pendientes  = temasConEstado.filter((t) => t.estado === "PENDIENTE").length;
            const progresoPct = total > 0 ? Math.round(((completadas + reservadas * 0.5) / total) * 100) : 0;

            return (
              <div key={plan.id} className="bg-white border-2 border-ink-900 rounded-3xl overflow-hidden shadow-[4px_4px_0_0_rgba(28,25,23,1)]">
                {/* Header del plan */}
                <div className="bg-gradient-to-r from-violet-100 to-fuchsia-100 p-5 border-b-2 border-ink-200">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">
                        Plan generado {format(new Date(plan.createdAt), "d MMM yyyy", { locale: es })}
                      </p>
                      <h2 className="font-display font-black text-xl text-ink-900 mt-1 leading-tight">
                        {plan.meta}
                      </h2>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {plan.materiaPrincipal && (
                          <span className="text-xs bg-white text-violet-700 border border-violet-300 px-2 py-0.5 rounded-full font-bold">
                            📚 {plan.materiaPrincipal}
                          </span>
                        )}
                        <span className="text-xs bg-white text-violet-700 border border-violet-300 px-2 py-0.5 rounded-full font-bold">
                          🎯 {total} sesiones
                        </span>
                        {plan.fechaObjetivo && (
                          <span className="text-xs bg-white text-violet-700 border border-violet-300 px-2 py-0.5 rounded-full font-bold">
                            📅 {format(new Date(plan.fechaObjetivo), "d MMM", { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-ink-700 mb-1">
                      <span className="font-bold">Progreso</span>
                      <span className="font-mono">{progresoPct}%</span>
                    </div>
                    <div className="h-3 bg-white rounded-full overflow-hidden border border-violet-200">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
                        style={{ width: `${progresoPct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] flex-wrap">
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {completadas} completadas
                      </span>
                      <span className="text-amber-700 font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {reservadas} reservadas
                      </span>
                      <span className="text-ink-500 font-bold flex items-center gap-1">
                        <Circle className="w-3 h-3" /> {pendientes} pendientes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lista de temas */}
                <div className="p-5 space-y-2">
                  {temasConEstado.map((t) => (
                    <div
                      key={t.orden}
                      className={
                        "border-2 rounded-xl p-3 transition-colors " +
                        (t.estado === "COMPLETADA"
                          ? "border-emerald-300 bg-emerald-50"
                          : t.estado === "RESERVADA"
                          ? "border-amber-300 bg-amber-50"
                          : "border-ink-200 bg-white hover:border-violet-300")
                      }
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={
                            "w-9 h-9 rounded-full flex items-center justify-center font-display font-black flex-shrink-0 text-sm " +
                            (t.estado === "COMPLETADA"
                              ? "bg-emerald-600 text-white"
                              : t.estado === "RESERVADA"
                              ? "bg-amber-500 text-white"
                              : "bg-ink-100 text-ink-500")
                          }
                        >
                          {t.estado === "COMPLETADA" ? "✓" : t.orden}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-ink-900">{t.titulo}</h3>
                            <span
                              className={
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full " +
                                (t.estado === "COMPLETADA"
                                  ? "bg-emerald-600 text-white"
                                  : t.estado === "RESERVADA"
                                  ? "bg-amber-500 text-white"
                                  : "bg-ink-200 text-ink-600")
                              }
                            >
                              {t.estado === "COMPLETADA"
                                ? "Completada"
                                : t.estado === "RESERVADA"
                                ? "Reservada"
                                : "Pendiente"}
                            </span>
                          </div>
                          <p className="text-xs text-ink-600 mt-0.5 line-clamp-2">{t.descripcion}</p>
                          {t.sesion && (
                            <div className="mt-1.5 flex items-center gap-3 text-[11px] text-ink-500">
                              {t.sesion.profesor?.usuario.nombre && (
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  {t.sesion.profesor.usuario.nombre}
                                </span>
                              )}
                              {t.sesion.fechaInicio && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(t.sesion.fechaInicio), "d MMM · HH:mm", { locale: es })}
                                </span>
                              )}
                              {t.sesion.id && (
                                <Link
                                  href={`/sesion/${t.sesion.id}`}
                                  className="text-violet-600 hover:underline font-semibold"
                                >
                                  Ver sesión →
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA si hay temas pendientes */}
                {pendientes > 0 && (
                  <div className="p-4 bg-ink-50 border-t-2 border-ink-100 flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm text-ink-700">
                      <strong>{pendientes}</strong> {pendientes === 1 ? "sesión" : "sesiones"} por reservar
                    </p>
                    <Link
                      href={`/profesores?planId=${plan.id}`}
                      className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2 rounded-xl text-sm"
                    >
                      Reservar siguiente <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}

                {pendientes === 0 && completadas === total && (
                  <div className="p-4 bg-emerald-50 border-t-2 border-emerald-200 text-center">
                    <p className="text-emerald-800 font-bold flex items-center justify-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4" /> ¡Plan completado al 100%! 🎉
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
