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
    },
  });

  if (!sesion) notFound();

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

      {/* Chat de la sesión */}
      <div className="bento p-5 elev-1">
        <h2 className="font-heading font-bold text-brand-text mb-3">Chat de la sesión</h2>
        <ChatSesion sesionId={sesion.id} nombreOtro={contraparte} />
      </div>
    </div>
  );
}
