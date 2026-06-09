"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, User, Mail, Calendar, Shield, CheckCircle, XCircle, Clock, AlertCircle, FileText, Wallet, BookOpen, Tag, Star, Trash2 } from "lucide-react";

interface Props { params: Promise<{ id: string }> }

interface Detalle {
  usuario: {
    id: string; nombre: string; email: string; rol: string;
    activo: boolean; emailVerificado: boolean; totpHabilitado: boolean;
    gcalSyncEnabled: boolean; bloqueadoHasta: string | null;
    intentosFallidos: number;
    createdAt: string; updatedAt: string;
  };
  perfilProfesor: null | {
    id: string; bio: string | null; precioHora: string | number;
    precio30min: string | number | null; modalidad: string; estado: string;
    fotoUrl: string | null; nivelVerificacion: string;
    aceptaPrimeraGratis: boolean; videoPresentacion: string | null;
    ciudad: string | null; institucion: string | null;
    anosExperiencia: number;
    ratingPromedio: string | number; totalResenas: number;
  };
  credenciales: Array<{ id: string; tipo: string; titulo: string; estado: string; createdAt: string }>;
  retiros: Array<{ id: string; monto: string | number; metodo: string; estado: string; createdAt: string }>;
  especialidades: Array<{ id: string; materia: string }>;
  disponibilidad: Array<{ id: string; diaSemana: number; horaInicio: string; horaFin: string; activo: boolean }>;
  sesiones: Array<{
    id: string; fechaInicio: string; estado: string; modalidad: string;
    precioAcordado: number; duracionMinutos: number;
    profesorNombre: string | null; estudianteNombre: string;
  }>;
  cupones: Array<{ id: string; codigo: string; tipo: string; estado: string; expiraEn: string | null }>;
  metricas: {
    totalSesiones: number; sesionesCompletadas: number; sesionesCanceladas: number;
    tasaCompletado: number; totalIngresos: number;
    resenasDadas: number; resenasRecibidas: number;
  };
  faltantes: string[];
}

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

function fmtSoles(n: number | string) {
  return `S/ ${Number(n).toFixed(2)}`;
}

const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE:  "bg-amber-200 text-amber-900",
  CONFIRMADA: "bg-blue-200 text-blue-900",
  COMPLETADA: "bg-emerald-200 text-emerald-900",
  CANCELADA:  "bg-rose-200 text-rose-900",
  APROBADA:   "bg-emerald-200 text-emerald-900",
  RECHAZADA:  "bg-rose-200 text-rose-900",
  ACTIVO:     "bg-emerald-200 text-emerald-900",
  USADO:      "bg-ink-200 text-ink-700",
  EXPIRADO:   "bg-ink-200 text-ink-500",
};

export default function UsuarioDetallePage({ params }: Props) {
  const { id } = use(params);
  const [data, setData]       = useState<Detalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    fetch(`/api/admin/usuarios/${id}/detalle`)
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) setError(d.error ?? "Error");
        else     setData(d);
      })
      .catch(() => setError("Error de red"))
      .finally(() => setLoading(false));
  }, [id]);

  const eliminarUsuario = async () => {
    if (!data) return;
    if (!confirm(`¿Eliminar la cuenta de ${data.usuario.nombre}?`)) return;
    const res = await fetch(`/api/admin/usuarios/${id}`, { method: "DELETE" });
    if (res.ok) window.location.href = "/admin/usuarios";
    else alert("Error al eliminar");
  };

  if (loading) return <div className="text-center p-10">Cargando...</div>;
  if (error)   return <div className="text-rose-700 p-6">{error}</div>;
  if (!data)   return null;

  const u = data.usuario;
  const p = data.perfilProfesor;

  return (
    <div className="space-y-5">
      <Link href="/admin/usuarios"
        className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900">
        <ArrowLeft className="w-4 h-4" /> Volver a usuarios
      </Link>

      {/* ── Cabecera ── */}
      <div className="bg-amber-300 border-2 border-ink-900 p-6 shadow-[6px_6px_0_0_rgba(28,25,23,1)]">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-20 h-20 rounded-2xl bg-ink-900 text-amber-300 border-2 border-ink-900 flex items-center justify-center flex-shrink-0">
            {p?.fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.fotoUrl} alt="" className="w-full h-full rounded-xl object-cover" />
            ) : (
              <User className="w-10 h-10" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs uppercase tracking-widest font-bold text-ink-900">
              {u.rol} {!u.activo && "· INACTIVO"}
            </p>
            <h1 className="font-display font-black text-3xl text-ink-900 leading-none tracking-tight">{u.nombre}</h1>
            <p className="text-ink-800 text-sm mt-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> {u.email}
            </p>
            <p className="text-xs text-ink-700 mt-1 font-mono">
              Registrado: {fmtFecha(u.createdAt)} · ID: {u.id.slice(0, 8)}...
            </p>
          </div>
          {u.activo && u.rol !== "ADMIN" && (
            <button onClick={eliminarUsuario}
              className="bg-rose-600 text-cream-50 px-4 py-2 border-2 border-ink-900 font-bold uppercase text-xs flex items-center gap-1 shadow-[3px_3px_0_#0a0a0a]">
              <Trash2 className="w-3.5 h-3.5" /> Eliminar
            </button>
          )}
        </div>
      </div>

      {/* ── Lo que le falta ── */}
      {data.faltantes.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-700 p-4">
          <h2 className="font-display font-black text-rose-900 flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5" /> Le falta completar ({data.faltantes.length})
          </h2>
          <ul className="space-y-1">
            {data.faltantes.map((f, i) => (
              <li key={i} className="text-sm text-rose-800 flex items-start gap-2">
                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricaCard label="Sesiones" valor={data.metricas.totalSesiones} sub={`${data.metricas.sesionesCompletadas} completadas`} />
        <MetricaCard label="Tasa completado" valor={`${data.metricas.tasaCompletado}%`} sub={`${data.metricas.sesionesCanceladas} canceladas`} />
        {u.rol === "PROFESOR" ? (
          <>
            <MetricaCard label="Ingresos" valor={fmtSoles(data.metricas.totalIngresos)} sub="acumulado" />
            <MetricaCard label="Reseñas" valor={data.metricas.resenasRecibidas} sub={`Rating ${Number(p?.ratingPromedio ?? 0).toFixed(2)}`} />
          </>
        ) : (
          <>
            <MetricaCard label="Reseñas dadas" valor={data.metricas.resenasDadas} sub="al sistema" />
            <MetricaCard label="Cupones" valor={data.cupones.length} sub={`${data.cupones.filter(c => c.estado === "ACTIVO").length} activos`} />
          </>
        )}
      </div>

      {/* ── Estado de cuenta ── */}
      <Section title="Estado de cuenta" icon={Shield}>
        <CheckLine ok={u.emailVerificado}     label="Email verificado" />
        <CheckLine ok={u.totpHabilitado}      label="2FA habilitado" />
        <CheckLine ok={u.gcalSyncEnabled}     label="Google Calendar sincronizado" />
        <CheckLine ok={u.activo}              label="Cuenta activa" />
        {u.bloqueadoHasta && new Date(u.bloqueadoHasta) > new Date() && (
          <p className="text-xs text-rose-700 font-semibold">
            ⛔ Bloqueada hasta {fmtFecha(u.bloqueadoHasta)} {fmtHora(u.bloqueadoHasta)}
          </p>
        )}
        {u.intentosFallidos > 0 && (
          <p className="text-xs text-amber-700">⚠️ {u.intentosFallidos} intentos fallidos de login</p>
        )}
      </Section>

      {/* ── Perfil profesor ── */}
      {p && (
        <Section title="Perfil del profesor" icon={User}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Estado del perfil" value={p.estado} highlight={p.estado === "VERIFICADO"} />
            <Field label="Nivel verificación" value={p.nivelVerificacion} />
            <Field label="Precio por hora" value={fmtSoles(p.precioHora)} />
            <Field label="Precio 30 min" value={p.precio30min ? fmtSoles(p.precio30min) : "—"} />
            <Field label="Modalidad" value={p.modalidad} />
            <Field label="Ciudad" value={p.ciudad || "—"} />
            <Field label="Institución" value={p.institucion || "—"} />
            <Field label="Años experiencia" value={String(p.anosExperiencia)} />
            <Field label="Primera gratis" value={p.aceptaPrimeraGratis ? "Sí" : "No"} />
            <Field label="Video presentación" value={p.videoPresentacion ? "Sí" : "—"} />
          </div>
          {p.bio && (
            <div className="mt-3 bg-ink-50 border border-ink-200 p-3 text-sm">
              <p className="text-xs font-bold uppercase text-ink-600 mb-1">Bio</p>
              <p className="text-ink-800 whitespace-pre-wrap">{p.bio}</p>
            </div>
          )}
        </Section>
      )}

      {/* ── Especialidades ── */}
      {p && (
        <Section title={`Especialidades (${data.especialidades.length})`} icon={BookOpen}>
          {data.especialidades.length === 0 ? (
            <p className="text-sm text-ink-500">Sin especialidades asignadas</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.especialidades.map(e => (
                <span key={e.id} className="bg-amber-200 border-2 border-ink-900 text-ink-900 text-xs font-bold px-2 py-1">
                  {e.materia}
                </span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ── Disponibilidad ── */}
      {p && (
        <Section title={`Disponibilidad (${data.disponibilidad.length})`} icon={Calendar}>
          {data.disponibilidad.length === 0 ? (
            <p className="text-sm text-ink-500">Sin horarios configurados</p>
          ) : (
            <div className="space-y-1 text-sm">
              {data.disponibilidad.map(d => (
                <div key={d.id} className="flex items-center gap-3">
                  <span className="bg-ink-900 text-cream-50 px-2 py-0.5 text-xs font-bold">{DIAS[d.diaSemana]}</span>
                  <span>{fmtHora(d.horaInicio)} – {fmtHora(d.horaFin)}</span>
                  {!d.activo && <span className="text-xs text-rose-700">(inactivo)</span>}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ── Credenciales ── */}
      {p && (
        <Section title={`Credenciales (${data.credenciales.length})`} icon={FileText}>
          {data.credenciales.length === 0 ? (
            <p className="text-sm text-ink-500">Aún no subió credenciales</p>
          ) : (
            <div className="space-y-2">
              {data.credenciales.map(c => (
                <div key={c.id} className="flex items-center gap-3 bg-cream-50 border-2 border-ink-900 p-2">
                  <span className={`text-xs font-bold px-2 py-0.5 ${ESTADO_COLOR[c.estado] ?? "bg-ink-100"}`}>
                    {c.estado}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{c.titulo}</p>
                    <p className="text-xs text-ink-500">{c.tipo} · {fmtFecha(c.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ── Sesiones ── */}
      <Section title={`Sesiones (${data.sesiones.length})`} icon={Calendar}>
        {data.sesiones.length === 0 ? (
          <p className="text-sm text-ink-500">Sin sesiones registradas</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.sesiones.map(s => (
              <div key={s.id} className="flex items-center gap-3 bg-cream-50 border border-ink-200 p-2 text-sm">
                <span className={`text-[10px] font-bold px-2 py-0.5 ${ESTADO_COLOR[s.estado] ?? "bg-ink-100"}`}>
                  {s.estado}
                </span>
                <span className="font-mono text-xs">{fmtFecha(s.fechaInicio)} {fmtHora(s.fechaInicio)}</span>
                <span className="flex-1 truncate">
                  {u.rol === "PROFESOR"
                    ? `← ${s.estudianteNombre}`
                    : `→ ${s.profesorNombre ?? "—"}`}
                </span>
                <span className="text-xs">{s.duracionMinutos}min · {fmtSoles(s.precioAcordado)}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Cupones ── */}
      {u.rol !== "PROFESOR" && (
        <Section title={`Cupones (${data.cupones.length})`} icon={Tag}>
          {data.cupones.length === 0 ? (
            <p className="text-sm text-ink-500">Sin cupones</p>
          ) : (
            <div className="space-y-1">
              {data.cupones.map(c => (
                <div key={c.id} className="flex items-center gap-3 text-sm">
                  <span className={`text-[10px] font-bold px-2 py-0.5 ${ESTADO_COLOR[c.estado] ?? "bg-ink-100"}`}>
                    {c.estado}
                  </span>
                  <code className="font-mono text-xs bg-ink-100 px-1.5">{c.codigo}</code>
                  <span className="text-xs text-ink-500">{c.tipo}</span>
                  {c.expiraEn && <span className="text-xs text-ink-500 ml-auto">exp. {fmtFecha(c.expiraEn)}</span>}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ── Retiros ── */}
      {p && (
        <Section title={`Solicitudes de retiro (${data.retiros.length})`} icon={Wallet}>
          {data.retiros.length === 0 ? (
            <p className="text-sm text-ink-500">Sin solicitudes</p>
          ) : (
            <div className="space-y-1">
              {data.retiros.map(r => (
                <div key={r.id} className="flex items-center gap-3 text-sm">
                  <span className={`text-[10px] font-bold px-2 py-0.5 ${ESTADO_COLOR[r.estado] ?? "bg-ink-100"}`}>
                    {r.estado}
                  </span>
                  <span className="font-mono">{fmtSoles(r.monto)}</span>
                  <span className="text-xs text-ink-600">{r.metodo}</span>
                  <span className="text-xs text-ink-500 ml-auto">{fmtFecha(r.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-cream-50 border-2 border-ink-900 p-4 shadow-[3px_3px_0_0_rgba(28,25,23,1)]">
      <h2 className="font-display font-black text-ink-900 flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-amber-600" /> {title}
      </h2>
      {children}
    </div>
  );
}

function CheckLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <p className="text-sm flex items-center gap-2">
      {ok ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-500" />}
      {label}
    </p>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</p>
      <p className={`font-semibold ${highlight ? "text-emerald-700" : "text-ink-900"}`}>{value}</p>
    </div>
  );
}

function MetricaCard({ label, valor, sub }: { label: string; valor: string | number; sub: string }) {
  return (
    <div className="bg-cream-50 border-2 border-ink-900 p-3 shadow-[3px_3px_0_0_rgba(28,25,23,1)]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</p>
      <p className="font-display font-black text-2xl text-ink-900 leading-none mt-1">{valor}</p>
      <p className="text-[10px] text-ink-600 mt-1">{sub}</p>
    </div>
  );
}
