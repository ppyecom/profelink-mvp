"use client";

import { useEffect, useState } from "react";
import { Award, Plus, X, Clock, CheckCircle, XCircle, FileText, Link2, Loader2, Trophy, Shield, BadgeCheck, Upload, Paperclip, Sparkles, AlertTriangle } from "lucide-react";

interface Credencial {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  archivoUrl: string | null;
  enlaceExterno: string | null;
  estado: "PENDIENTE" | "APROBADA" | "RECHAZADA";
  notaAdmin: string | null;
  createdAt: string;
}

const TIPOS = [
  { value: "IDENTIDAD",       label: "Identidad (DNI)",            desc: "Foto del DNI + selfie" },
  { value: "TITULO",          label: "Título universitario",        desc: "PDF del bachiller/licenciatura → 🥇 Docente" },
  { value: "CERTIFICADO",     label: "Certificado de curso",        desc: "Coursera, edX, Platzi, etc. → 🥈 Experto" },
  { value: "RECORD",          label: "Record académico",            desc: "Captura de tu intranet con notas → 🥈 Experto" },
  { value: "PROYECTO",        label: "Proyecto/Portfolio",          desc: "GitHub, Behance, tu sitio web → 🥈 Experto" },
  { value: "EXPERIENCIA",     label: "Experiencia laboral",         desc: "LinkedIn público o carta laboral → 🥈 Experto" },
  { value: "EXAMEN_INTERNO",  label: "Examen interno ProfeLink",    desc: "Test de 30 min en tu materia → 🥈 Experto" },
] as const;

const ESTADO_STYLE: Record<string, { bg: string; text: string; icon: typeof Clock; label: string }> = {
  PENDIENTE:  { bg: "bg-amber-50",   text: "text-amber-700",   icon: Clock,       label: "En revisión" },
  APROBADA:   { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle, label: "Aprobada" },
  RECHAZADA:  { bg: "bg-red-50",     text: "text-red-700",     icon: XCircle,     label: "Rechazada" },
};

const NIVEL_INFO: Record<string, { label: string; icon: typeof Shield; color: string; desc: string }> = {
  BASICO:  { label: "Tutor Verificado",   icon: Shield,     color: "from-gray-400 to-gray-500",     desc: "Identidad verificada" },
  EXPERTO: { label: "Experto Verificado", icon: BadgeCheck, color: "from-blue-500 to-indigo-600",   desc: "Conocimiento certificado" },
  DOCENTE: { label: "Docente Verificado", icon: Trophy,     color: "from-amber-500 to-orange-600",  desc: "Título universitario + experiencia" },
};

export default function CredencialesSection({ nivelVerificacion }: { nivelVerificacion: string }) {
  const [creds, setCreds] = useState<Credencial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ tipo: "CERTIFICADO", titulo: "", descripcion: "", enlaceExterno: "", archivoUrl: "", archivoNombre: "" });
  const [enviando, setEnviando] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [error, setError] = useState("");
  const [analisisIA, setAnalisisIA] = useState<{ visible: boolean; estado: "analizando" | "aprobada" | "rechazada" | "pendiente" | "error"; mensaje: string } | null>(null);

  const cargar = async () => {
    setLoading(true);
    const res = await fetch("/api/credenciales");
    const data = await res.json();
    setCreds(data.credenciales ?? []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setEnviando(true);

    // Al menos un enlace o archivo
    if (!form.enlaceExterno && !form.archivoUrl) {
      setError("Adjunta un archivo o pega un enlace verificable");
      setEnviando(false);
      return;
    }

    const res = await fetch("/api/credenciales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: form.tipo,
        titulo: form.titulo,
        descripcion: form.descripcion,
        enlaceExterno: form.enlaceExterno,
        archivoUrl: form.archivoUrl || undefined,
      }),
    });
    const data = await res.json();
    setEnviando(false);
    if (!res.ok) { setError(data.error ?? "Error"); return; }

    const credencialId = data.credencial?.id;
    const esImagen = form.archivoUrl && /\.(jpe?g|png|webp)$/i.test(form.archivoUrl);

    setModalOpen(false);
    setForm({ tipo: "CERTIFICADO", titulo: "", descripcion: "", enlaceExterno: "", archivoUrl: "", archivoNombre: "" });

    // 🤖 Si subió imagen, lanzamos el análisis IA automático
    if (credencialId && esImagen) {
      setAnalisisIA({ visible: true, estado: "analizando", mensaje: "Verificando con IA..." });
      try {
        const r = await fetch(`/api/credenciales/${credencialId}/analizar`, { method: "POST" });
        const d = await r.json();
        if (!r.ok) {
          setAnalisisIA({ visible: true, estado: "error", mensaje: d.error ?? "No se pudo analizar" });
        } else if (d.autoAprobada) {
          setAnalisisIA({ visible: true, estado: "aprobada", mensaje: d.analisis?.resumen ?? "Credencial aprobada automáticamente" });
        } else if (d.autoRechazada) {
          setAnalisisIA({ visible: true, estado: "rechazada", mensaje: d.analisis?.resumen ?? "Rechazada — el archivo no parece un documento válido" });
        } else {
          setAnalisisIA({ visible: true, estado: "pendiente", mensaje: d.analisis?.resumen ?? "Análisis hecho — pendiente de revisión manual" });
        }
      } catch {
        setAnalisisIA({ visible: true, estado: "error", mensaje: "Error de red durante el análisis" });
      }
    }

    cargar();
  };

  const subirArchivo = async (file: File) => {
    setError("");
    setSubiendoArchivo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/credencial", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al subir");
      } else {
        setForm(f => ({ ...f, archivoUrl: data.url, archivoNombre: data.nombre ?? file.name }));
      }
    } catch {
      setError("Error de red al subir el archivo");
    } finally {
      setSubiendoArchivo(false);
    }
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta credencial?")) return;
    await fetch(`/api/credenciales/${id}`, { method: "DELETE" });
    cargar();
  };

  const tipoLabel = (t: string) => TIPOS.find(x => x.value === t)?.label ?? t;
  const info = NIVEL_INFO[nivelVerificacion] ?? NIVEL_INFO.BASICO;
  const Icon = info.icon;

  return (
    <div className="bento p-5 elev-1 space-y-4">
      {/* Toast de análisis IA */}
      {analisisIA?.visible && (
        <div className={
          "p-4 rounded-2xl border-2 flex items-start gap-3 " +
          (analisisIA.estado === "analizando" ? "bg-violet-50 border-violet-200" :
           analisisIA.estado === "aprobada"   ? "bg-emerald-50 border-emerald-300" :
           analisisIA.estado === "rechazada"  ? "bg-rose-50 border-rose-300" :
           analisisIA.estado === "error"      ? "bg-amber-50 border-amber-300" :
                                                  "bg-blue-50 border-blue-200")
        }>
          {analisisIA.estado === "analizando" ? <Loader2 className="w-5 h-5 animate-spin text-violet-600 mt-0.5" /> :
           analisisIA.estado === "aprobada"   ? <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" /> :
           analisisIA.estado === "rechazada"  ? <XCircle className="w-5 h-5 text-rose-600 mt-0.5" /> :
           analisisIA.estado === "error"      ? <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" /> :
                                                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-ink-900 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              Verificación con IA
              {analisisIA.estado === "aprobada"  && <span className="text-emerald-700">— ¡Aprobada!</span>}
              {analisisIA.estado === "rechazada" && <span className="text-rose-700">— Rechazada</span>}
              {analisisIA.estado === "pendiente" && <span className="text-blue-700">— Revisión manual</span>}
            </p>
            <p className="text-xs text-ink-700 mt-1">{analisisIA.mensaje}</p>
          </div>
          <button onClick={() => setAnalisisIA(null)} className="text-ink-400 hover:text-ink-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header con nivel actual */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center text-white shadow-elev-2`}>
          <Icon className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <p className="font-heading font-bold text-brand-text">{info.label}</p>
          <p className="text-xs text-gray-500">{info.desc}</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-3 py-2 rounded-xl">
          <Plus className="w-3.5 h-3.5" /> Agregar
        </button>
      </div>

      {/* Lista de credenciales */}
      {loading ? (
        <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}</div>
      ) : creds.length === 0 ? (
        <div className="text-center py-6">
          <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Aún no tienes credenciales.</p>
          <p className="text-xs text-gray-400 mt-1">Agrega tu título, certificados o proyectos para subir tu nivel.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {creds.map(c => {
            const style = ESTADO_STYLE[c.estado];
            const StatusIcon = style.icon;
            return (
              <div key={c.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-brand-text">{c.titulo}</p>
                  <p className="text-xs text-gray-500">{tipoLabel(c.tipo)}</p>
                  <div className="flex flex-wrap gap-3 mt-0.5">
                    {c.enlaceExterno && (
                      <a href={c.enlaceExterno} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                        <Link2 className="w-3 h-3" /> Ver enlace
                      </a>
                    )}
                    {c.archivoUrl && (
                      <a href={c.archivoUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline">
                        <Paperclip className="w-3 h-3" /> Ver archivo
                      </a>
                    )}
                  </div>
                  {c.notaAdmin && (
                    <p className={`text-xs italic mt-1 flex items-start gap-1 ${
                      c.estado === "RECHAZADA" ? "text-rose-600" :
                      c.estado === "APROBADA"  ? "text-emerald-700" :
                                                  "text-ink-600"
                    }`}>
                      {c.notaAdmin.startsWith("🤖") && <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                      <span>{c.notaAdmin}</span>
                    </p>
                  )}
                </div>
                <span className={`inline-flex items-center gap-1 ${style.bg} ${style.text} text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap`}>
                  <StatusIcon className="w-3 h-3" /> {style.label}
                </span>
                {c.estado !== "APROBADA" && (
                  <button onClick={() => eliminar(c.id)}
                    className="text-gray-300 hover:text-red-500 flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de crear */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => !enviando && setModalOpen(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={submit}
            className="bg-white rounded-3xl shadow-elev-4 w-full max-w-md p-6 space-y-4">
            <div>
              <h2 className="font-heading font-bold text-xl text-brand-text">Agregar credencial</h2>
              <p className="text-xs text-gray-500 mt-1">El admin la revisará antes de mostrarla públicamente</p>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {TIPOS.find(t => t.value === form.tipo)?.desc}
              </p>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Título</label>
              <input type="text" required minLength={3} maxLength={200}
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder='Ej: "Bachiller en Ingeniería Civil – PUCP"'
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Adjuntar archivo (PDF, JPG, PNG · máx 10 MB)</label>
              {form.archivoUrl ? (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 text-sm">
                  <Paperclip className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="flex-1 truncate text-emerald-800">{form.archivoNombre}</span>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, archivoUrl: "", archivoNombre: "" }))}
                    className="text-emerald-600 hover:text-emerald-900">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 hover:border-amber-500 hover:bg-amber-50 rounded-xl px-3 py-4 text-sm text-gray-500 cursor-pointer transition-colors">
                  {subiendoArchivo ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Seleccionar archivo</>
                  )}
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={subiendoArchivo}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) subirArchivo(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Enlace verificable (opcional si subes archivo)</label>
              <input type="url"
                value={form.enlaceExterno}
                onChange={e => setForm(f => ({ ...f, enlaceExterno: e.target.value }))}
                placeholder="https://linkedin.com/in/... o https://github.com/..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <p className="text-[10px] text-gray-400 mt-1">
                💡 Puedes adjuntar archivo, enlace o ambos. El admin necesita al menos uno para verificar.
              </p>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Descripción (opcional)</label>
              <textarea rows={3} maxLength={2000}
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Detalles adicionales que ayuden al admin a verificar..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}

            <div className="flex gap-2">
              <button type="button" onClick={() => setModalOpen(false)} disabled={enviando}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl">
                Cancelar
              </button>
              <button type="submit" disabled={enviando || !form.titulo}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2">
                {enviando ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Enviar a revisión"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
