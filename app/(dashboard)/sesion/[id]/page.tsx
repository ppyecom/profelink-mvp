import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Calendar, Clock, User, Video } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import VideoLlamada from "@/components/sesiones/VideoLlamada";
import PizarraColaborativa from "@/components/sesiones/PizarraColaborativa";
import AgregarCalendar from "@/components/sesiones/AgregarCalendar";
import ChatSesion from "@/components/chat/ChatSesion";
import ArchivosSesion from "@/components/sesiones/ArchivosSesion";
import TareasSesion from "@/components/sesiones/TareasSesion";
import VerificarPagoBanner from "@/components/sesiones/VerificarPagoBanner";
import { MessageSquare } from "lucide-react";

interface PageProps { params: Promise<{ id: string }> }

export const metadata = { title: "Sesión — ProfeLink" };

export default async function SesionPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const sesion = await prisma.sesion.findUnique({
    where: { id },
    include: {
      estudiante: { select: { id: true, nombre: true } },
      profesor: { include: { usuario: { select: { id: true, nombre: true } } } },
      plan: {
        select: {
          id: true,
          meta: true,
          temas: true,
          numSesionesRecomendadas: true,
          sesiones: {
            select: { id: true, ordenEnPlan: true, estado: true, temaAsignado: true },
            orderBy: { ordenEnPlan: "asc" },
          },
        },
      },
    },
  });

  if (!sesion) notFound();

  // Cargar pago para mostrar verificación si está pendiente
  const pagos = await prisma.$queryRaw<{ id: string; estado: string; monto: number; metodo: string; referencia: string | null }[]>`
    SELECT id, estado, monto::float, metodo, referencia FROM pagos WHERE sesion_id = ${id}::uuid LIMIT 1
  `;
  const pago = pagos[0] ?? null;

  const esEstudiante = sesion.estudianteId === session.sub;
  const esProfesor = sesion.profesor.usuarioId === session.sub;
  if (!esEstudiante && !esProfesor && session.rol !== "ADMIN") notFound();

  const ahora = new Date();
  const minutosAntes = (sesion.fechaInicio.getTime() - ahora.getTime()) / 60000;
  const yaPaso = sesion.fechaFin < ahora;
  const enVivo = sesion.fechaInicio <= ahora && !yaPaso;
  const puedeEntrar = minutosAntes <= 15 && !yaPaso && sesion.estado === "CONFIRMADA";

  const contraparte = esEstudiante ? sesion.profesor.usuario.nombre : sesion.estudiante.nombre;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <Link href={esEstudiante ? "/estudiante/sesiones" : "/profesor/sesiones"}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-700">
        <ArrowLeft className="w-4 h-4" /> Volver a mis sesiones
      </Link>

      <div className="bg-white border-2 border-ink-900 p-5 md:p-6 shadow-[5px_5px_0_0_rgba(28,25,23,1)]">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-amber-700 mb-1 font-bold">Sesión activa</p>
            <h1 className="font-display font-black text-3xl text-ink-900 tracking-tight">
              {contraparte}<span className="text-ink-900/30">.</span>
            </h1>
          </div>
          <AgregarCalendar
            sesionId={sesion.id}
            fechaInicio={sesion.fechaInicio.toISOString()}
            fechaFin={sesion.fechaFin.toISOString()}
            titulo={`ProfeLink — ${esEstudiante ? sesion.profesor.usuario.nombre : sesion.estudiante.nombre}`}
            descripcion={`Sesión de tutoría. Únete: https://profelink.pyecommerce.com/sesion/${sesion.id}`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm pt-4 border-t-2 border-dashed border-ink-200">
          <div className="flex items-center gap-2 text-ink-700">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span className="font-mono">{formatDateTime(sesion.fechaInicio)}</span>
          </div>
          <div className="flex items-center gap-2 text-ink-700">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="font-mono">{sesion.duracionMinutos ?? 60} min · {sesion.modalidad}</span>
          </div>
        </div>
      </div>

      {/* Banner de plan de estudios (si esta sesión es parte de un plan) */}
      {sesion.plan && (
        <div className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white border-2 border-ink-900 rounded-2xl p-5 shadow-[4px_4px_0_0_rgba(28,25,23,1)]">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="w-12 h-12 bg-white text-violet-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="font-display font-black text-xl">
                {sesion.ordenEnPlan ?? "?"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">
                ✨ Sesión {sesion.ordenEnPlan ?? "?"} de {sesion.plan.numSesionesRecomendadas} — Plan de estudios IA
              </p>
              <h2 className="font-display font-black text-xl mt-0.5">{sesion.plan.meta}</h2>
              {sesion.temaAsignado && (
                <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/80 mb-1">
                    🎯 Tema sugerido para hoy
                  </p>
                  <p className="font-bold text-white">{sesion.temaAsignado}</p>
                </div>
              )}
              {/* Progreso del plan */}
              <div className="mt-3 flex gap-1">
                {sesion.plan.sesiones.map((s) => {
                  const isActual = s.id === sesion.id;
                  const completada = s.estado === "COMPLETADA";
                  return (
                    <div
                      key={s.id}
                      title={s.temaAsignado ?? `Sesión ${s.ordenEnPlan}`}
                      className={`h-2 flex-1 rounded-full ${
                        isActual ? "bg-white" :
                        completada ? "bg-emerald-300" : "bg-white/30"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner de verificación de pago (si hay pago pendiente) */}
      {pago && (
        <VerificarPagoBanner
          sesionId={sesion.id}
          pago={pago}
          esProfesor={esProfesor || session.rol === "ADMIN"}
          nombreAlumno={sesion.estudiante.nombre}
        />
      )}

      {/* Notas del alumno (mensaje al profesor al reservar) */}
      {sesion.notas && (
        <div className="bg-indigo-50 border-2 border-indigo-300 rounded-2xl p-4 shadow-[3px_3px_0_0_#4338ca]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 mb-0.5">
                💬 {esEstudiante ? "Tu mensaje al tutor" : `Mensaje de ${sesion.estudiante.nombre}`}
              </p>
              <p className="text-sm text-indigo-900 italic whitespace-pre-wrap">&ldquo;{sesion.notas}&rdquo;</p>
            </div>
          </div>
        </div>
      )}

      {sesion.modalidad === "VIRTUAL" && (
        <>
          {puedeEntrar || enVivo ? (
            <VideoLlamada
              sesionId={sesion.id}
              nombreUsuario={session.nombre}
              abrirAutomaticamente={enVivo}
            />
          ) : (
            <div className="bento p-5 elev-1 text-center">
              <Video className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="font-heading font-bold text-brand-text">Videollamada</p>
              <p className="text-sm text-gray-500 mt-1">
                {yaPaso
                  ? "Esta sesión ya finalizó"
                  : sesion.estado !== "CONFIRMADA"
                    ? "La sesión debe estar confirmada para entrar a la videollamada"
                    : `Disponible 15 min antes (faltan ${Math.ceil(minutosAntes - 15)} min)`}
              </p>
            </div>
          )}
        </>
      )}

      {/* Pizarra colaborativa */}
      {(enVivo || puedeEntrar) && <PizarraColaborativa sesionId={sesion.id} />}

      {/* Archivos compartidos — solo el profesor de la sesión (o admin) puede subir */}
      <ArchivosSesion sesionId={sesion.id} puedeSubir={esProfesor || session.rol === "ADMIN"} />

      {/* Tareas asignadas — el profesor crea, el alumno completa */}
      <TareasSesion sesionId={sesion.id} esProfesor={esProfesor || session.rol === "ADMIN"} />

      {/* Chat de la sesión */}
      <div className="bento p-5 elev-1">
        <h2 className="font-heading font-bold text-brand-text mb-3">Chat de la sesión</h2>
        <ChatSesion sesionId={sesion.id} nombreOtro={contraparte} />
      </div>
    </div>
  );
}
