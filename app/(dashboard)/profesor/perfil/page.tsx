"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { CheckCircle, Save, Plus, X, Upload, Camera, Loader2 } from "lucide-react";
import CredencialesSection from "@/components/profesores/CredencialesSection";
import VideoPresentacion from "@/components/profesores/VideoPresentacion";
import AutoCompletarPerfil from "@/components/profesores/AutoCompletarPerfil";
import EstadoPerfilCard from "@/components/profesores/EstadoPerfilCard";
import DisponibilidadEditor from "@/components/disponibilidad/DisponibilidadEditor";
import GoogleCalendarSection from "@/components/auth/GoogleCalendarSection";

const NIVELES = ["SECUNDARIA", "TECNICA", "UNIVERSITARIA"] as const;
const NIVEL_LABELS: Record<string, string> = { SECUNDARIA: "Secundaria", TECNICA: "Técnica", UNIVERSITARIA: "Universitaria" };

export default function ProfesorPerfilPage() {
  const searchParams = useSearchParams();
  const vieneDeIA    = searchParams.get("bienvenida") === "1";
  const [disponibilidadCount, setDispCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    bio: "",
    fotoUrl: "",
    nivel: [] as string[],
    precioHora: 0,
    precio30min: null as number | null,
    aceptaPrimeraGratis: false,
    modalidad: "VIRTUAL" as "VIRTUAL" | "PRESENCIAL",
    especialidades: [] as string[],
    // Información profesional
    ciudad: "",
    institucion: "",
    anosExperiencia: 0,
    videoPresentacion: "",
    // Pagos manuales
    yapeNumero: "",
    yapeQrUrl: "",
    plinNumero: "",
    plinQrUrl: "",
  });
  const [subiendoQr, setSubiendoQr] = useState<"yape" | "plin" | null>(null);
  const [nivelVerificacion, setNivelVerificacion] = useState<string>("BASICO");
  const [nuevaEsp, setNuevaEsp] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [errorFoto, setErrorFoto] = useState("");
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const handleSubirQr = async (file: File, tipo: "yape" | "plin") => {
    if (file.size > 3 * 1024 * 1024) { alert("Imagen muy grande (máx 3 MB)"); return; }
    setSubiendoQr(tipo);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/upload/qr-pago?tipo=${tipo}`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Error al subir"); return; }
      setForm(f => tipo === "yape"
        ? { ...f, yapeQrUrl: data.url }
        : { ...f, plinQrUrl: data.url });
    } finally {
      setSubiendoQr(null);
    }
  };

  const handleSubirFoto = async (file: File) => {
    setErrorFoto("");
    if (file.size > 5 * 1024 * 1024) {
      setErrorFoto("La imagen debe ser menor a 5 MB");
      return;
    }
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/foto-perfil", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setErrorFoto(data.error ?? "Error al subir"); return; }
      setForm(f => ({ ...f, fotoUrl: data.url }));
    } finally {
      setSubiendo(false);
    }
  };

  useEffect(() => {
    fetch("/api/profesores/me")
      .then(r => r.json())
      .then(data => {
        setForm({
          bio: data.bio ?? "",
          fotoUrl: data.fotoUrl ?? "",
          nivel: data.nivel ?? [],
          precioHora: data.precioHora ?? 0,
          precio30min: data.precio30min ?? null,
          aceptaPrimeraGratis: data.aceptaPrimeraGratis ?? false,
          modalidad: data.modalidad ?? "VIRTUAL",
          especialidades: data.especialidades ?? [],
          ciudad: data.ciudad ?? "",
          institucion: data.institucion ?? "",
          anosExperiencia: data.anosExperiencia ?? 0,
          videoPresentacion: data.videoPresentacion ?? "",
          yapeNumero: data.yapeNumero ?? "",
          yapeQrUrl: data.yapeQrUrl ?? "",
          plinNumero: data.plinNumero ?? "",
          plinQrUrl: data.plinQrUrl ?? "",
        });
        setDispCount(data.disponibilidadCount ?? 0);
        setNivelVerificacion(data.nivelVerificacion ?? "BASICO");
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleNivel = (n: string) => {
    setForm(f => ({
      ...f,
      nivel: f.nivel.includes(n) ? f.nivel.filter(x => x !== n) : [...f.nivel, n],
    }));
  };

  const agregarEsp = () => {
    const esp = nuevaEsp.trim();
    if (!esp || form.especialidades.includes(esp)) return;
    setForm(f => ({ ...f, especialidades: [...f.especialidades, esp] }));
    setNuevaEsp("");
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setOk(false);
    const res = await fetch("/api/profesores", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, precioHora: Number(form.precioHora) || 50 }),
    });
    if (res.ok) { setOk(true); setTimeout(() => setOk(false), 3000); }
    else {
      const d = await res.json();
      const detail = d.details?.fieldErrors
        ? Object.entries(d.details.fieldErrors).map(([k,v]) => `${k}: ${(v as string[]).join(", ")}`).join(" | ")
        : null;
      setError(detail ?? d.error ?? "Error al guardar");
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-gray-100" />)}</div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Esta información es visible para los estudiantes</p>
      </div>

      {/* Estado del perfil + Banner IA (si viene de /bienvenida) */}
      <div className="max-w-2xl mb-5">
        <EstadoPerfilCard
          perfil={{
            bio: form.bio || null,
            fotoUrl: form.fotoUrl || null,
            videoPresentacion: form.videoPresentacion || null,
            ciudad: form.ciudad || null,
            institucion: form.institucion || null,
            anosExperiencia: form.anosExperiencia ?? 0,
            precio30min: form.precio30min,
            nivel: form.nivel,
            especialidades: form.especialidades,
            yapeNumero: form.yapeNumero || null,
            plinNumero: form.plinNumero || null,
            yapeQrUrl: form.yapeQrUrl || null,
            plinQrUrl: form.plinQrUrl || null,
          }}
          vieneDeIA={vieneDeIA}
          llenadosPorIA={vieneDeIA ? [
            ...(form.bio          ? ["Bio profesional"] : []),
            ...(form.ciudad       ? ["Ciudad"] : []),
            ...(form.institucion  ? ["Institución"] : []),
            ...(form.anosExperiencia > 0 ? ["Años de experiencia"] : []),
            ...(form.especialidades.length > 0 ? [`${form.especialidades.length} materias`] : []),
          ] : []}
          disponibilidad={disponibilidadCount}
        />
      </div>

      <div className="max-w-2xl mb-5">
        <CredencialesSection nivelVerificacion={nivelVerificacion} />
      </div>

      <form onSubmit={guardar} className="space-y-5 max-w-2xl">

        {/* Foto */}
        <div className="bento p-5 elev-1">
          <h2 className="font-heading font-bold text-brand-text mb-4">Foto de perfil</h2>
          <div className="flex items-center gap-5">
            <div className="relative group flex-shrink-0">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-amber-100 bg-amber-50">
                {form.fotoUrl ? (
                  <Image
                    src={form.fotoUrl} alt="Foto" width={96} height={96}
                    className="w-full h-full object-cover"
                    unoptimized={form.fotoUrl.startsWith("/uploads/") || form.fotoUrl.startsWith("/api/uploads/")}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                    <Camera className="w-8 h-8 text-amber-600" />
                  </div>
                )}
              </div>
              {subiendo && (
                <div className="absolute inset-0 bg-black/60 rounded-3xl flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <input
                ref={inputFotoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleSubirFoto(f); }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => inputFotoRef.current?.click()}
                disabled={subiendo}
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4" />
                {subiendo ? "Subiendo..." : form.fotoUrl ? "Cambiar foto" : "Subir foto"}
              </button>
              {form.fotoUrl && !subiendo && (
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, fotoUrl: "" }))}
                  className="ml-2 text-xs text-gray-400 hover:text-red-500 underline"
                >
                  Quitar
                </button>
              )}
              <p className="text-xs text-gray-400 mt-2">JPG, PNG o WebP · Máximo 5 MB</p>
              {errorFoto && <p className="text-red-500 text-xs mt-1">{errorFoto}</p>}
            </div>
          </div>
        </div>

        {/* Autocompletar con IA */}
        <AutoCompletarPerfil
          onSugerir={(sug) => {
            setForm(f => ({
              ...f,
              // Solo aplica si el campo está vacío (no sobreescribimos lo que ya escribiste)
              institucion:     f.institucion     || sug.institucion     || "",
              ciudad:          f.ciudad          || sug.ciudad          || "",
              anosExperiencia: f.anosExperiencia || sug.anosExperiencia || 0,
              bio:             f.bio             || sug.bio             || "",
              especialidades:  f.especialidades.length > 0
                ? f.especialidades
                : (sug.especialidades ?? []),
            }));
          }}
        />

        {/* Información profesional */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Información profesional</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Ciudad</label>
              <input
                type="text"
                value={form.ciudad}
                onChange={(e) => setForm(f => ({ ...f, ciudad: e.target.value }))}
                placeholder="Ej: Lima, Arequipa"
                maxLength={80}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Años de experiencia</label>
              <input
                type="number"
                min={0}
                max={80}
                value={form.anosExperiencia}
                onChange={(e) => setForm(f => ({ ...f, anosExperiencia: Number(e.target.value) || 0 }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Institución</label>
              <input
                type="text"
                value={form.institucion}
                onChange={(e) => setForm(f => ({ ...f, institucion: e.target.value }))}
                placeholder="Ej: PUCP, UNI, UNMSM, autodidacta..."
                maxLength={120}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-gray-400 mt-1">Universidad, instituto o lugar donde te formaste</p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Video de presentación (URL — opcional)</label>
              <input
                type="url"
                value={form.videoPresentacion}
                onChange={(e) => setForm(f => ({ ...f, videoPresentacion: e.target.value }))}
                placeholder="https://youtube.com/... o https://vimeo.com/..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-gray-400 mt-1">Un video corto (1-2 min) presentándote ayuda a los alumnos a elegirte. Soporta YouTube, Vimeo, Loom y MP4.</p>

              {/* Preview en vivo del video */}
              {form.videoPresentacion && (
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase text-gray-500 mb-1.5">Así lo verán los alumnos:</p>
                  <VideoPresentacion url={form.videoPresentacion} nombre="ti" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Sobre mí</h2>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={4}
            placeholder="Cuéntales a los estudiantes sobre tu experiencia, metodología y por qué eres el mejor profe..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            maxLength={1000}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{form.bio.length}/1000</p>
        </div>

        {/* Precio y modalidad */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Tarifa y modalidad</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Precio por hora (S/)</label>
              <input
                type="number"
                min={10}
                max={500}
                value={form.precioHora}
                onChange={e => setForm(f => ({ ...f, precioHora: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Modalidad</label>
              <div className="grid grid-cols-2 gap-2">
                {(["VIRTUAL","PRESENCIAL"] as const).map(m => (
                  <button key={m} type="button" onClick={() => setForm(f => ({ ...f, modalidad: m }))}
                    className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                      form.modalidad === m ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}>
                    {m === "VIRTUAL" ? "🖥 Virtual" : "📍 Presencial"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
            Con S/ {form.precioHora}/hr recibirás <strong>S/ {(form.precioHora * 0.78).toFixed(2)}</strong> por sesión (después de la comisión del 22%).
          </div>

          {/* Precio 30 min */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <label className="block text-xs text-gray-500 mb-1.5">Precio sesión 30 min (opcional)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={5}
                max={250}
                step="0.5"
                value={form.precio30min ?? ""}
                onChange={e => setForm(f => ({ ...f, precio30min: e.target.value ? Number(e.target.value) : null }))}
                placeholder={`Auto: S/ ${(form.precioHora / 2).toFixed(2)}`}
                className="w-40 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-xs text-gray-400">Si lo dejas vacío usamos la mitad de tu tarifa por hora</p>
            </div>
          </div>

          {/* Primera sesión gratis */}
          <label className="mt-4 flex items-start gap-2.5 cursor-pointer p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <input
              type="checkbox"
              checked={form.aceptaPrimeraGratis}
              onChange={e => setForm(f => ({ ...f, aceptaPrimeraGratis: e.target.checked }))}
              className="mt-0.5 w-4 h-4 rounded border-2 border-emerald-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div className="text-xs text-emerald-800">
              <p className="font-semibold">Aceptar sesiones gratis de bienvenida</p>
              <p className="text-emerald-600 mt-0.5">
                Estudiantes nuevos podrán reservarte su primera sesión sin pagar. ProfeLink te paga S/ 15 por esa hora.
                <strong> Mayor visibilidad en el buscador.</strong>
              </p>
            </div>
          </label>
        </div>

        {/* Niveles */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Niveles que enseñas</h2>
          <div className="flex gap-3">
            {NIVELES.map(n => (
              <button key={n} type="button" onClick={() => toggleNivel(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                  form.nivel.includes(n) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}>
                {form.nivel.includes(n) && "✓ "}{NIVEL_LABELS[n]}
              </button>
            ))}
          </div>
        </div>

        {/* Pagos manuales — Yape / Plin */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Métodos de pago</h2>
          <p className="text-xs text-gray-500 mb-4">
            Configura tu Yape o Plin. El estudiante verá tu QR y número al pagar la sesión.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* YAPE */}
            <div className="border-2 border-violet-200 rounded-2xl p-4 bg-violet-50/50">
              <p className="font-bold text-violet-700 mb-3">💜 Yape</p>
              <label className="block text-xs text-gray-600 mb-1">Número (9 dígitos)</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={9}
                value={form.yapeNumero}
                onChange={(e) => setForm(f => ({ ...f, yapeNumero: e.target.value.replace(/\D/g, "").slice(0, 9) }))}
                placeholder="987654321"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />

              <p className="block text-xs text-gray-600 mt-3 mb-1">QR de Yape (opcional)</p>
              {form.yapeQrUrl ? (
                <div className="relative inline-block">
                  <Image src={form.yapeQrUrl} alt="QR Yape" width={140} height={140}
                    className="w-32 h-32 object-contain border-2 border-violet-300 rounded-xl bg-white"
                    unoptimized />
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, yapeQrUrl: "" }))}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs"
                  >×</button>
                </div>
              ) : (
                <label className="block w-full border-2 border-dashed border-violet-300 rounded-xl py-4 text-center text-xs text-violet-700 cursor-pointer hover:bg-violet-100">
                  {subiendoQr === "yape" ? "Subiendo..." : "📤 Subir captura del QR (JPG/PNG · máx 3MB)"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSubirQr(f, "yape"); }}
                  />
                </label>
              )}
            </div>

            {/* PLIN */}
            <div className="border-2 border-cyan-200 rounded-2xl p-4 bg-cyan-50/50">
              <p className="font-bold text-cyan-700 mb-3">🔵 Plin</p>
              <label className="block text-xs text-gray-600 mb-1">Número (9 dígitos)</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={9}
                value={form.plinNumero}
                onChange={(e) => setForm(f => ({ ...f, plinNumero: e.target.value.replace(/\D/g, "").slice(0, 9) }))}
                placeholder="987654321"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />

              <p className="block text-xs text-gray-600 mt-3 mb-1">QR de Plin (opcional)</p>
              {form.plinQrUrl ? (
                <div className="relative inline-block">
                  <Image src={form.plinQrUrl} alt="QR Plin" width={140} height={140}
                    className="w-32 h-32 object-contain border-2 border-cyan-300 rounded-xl bg-white"
                    unoptimized />
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, plinQrUrl: "" }))}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs"
                  >×</button>
                </div>
              ) : (
                <label className="block w-full border-2 border-dashed border-cyan-300 rounded-xl py-4 text-center text-xs text-cyan-700 cursor-pointer hover:bg-cyan-100">
                  {subiendoQr === "plin" ? "Subiendo..." : "📤 Subir captura del QR (JPG/PNG · máx 3MB)"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSubirQr(f, "plin"); }}
                  />
                </label>
              )}
            </div>
          </div>

          <p className="text-[10px] text-gray-400 mt-3">
            💡 Tip: en la app de Yape/Plin, toca "Cobrar" → captura el código QR que aparece y súbelo aquí.
          </p>
        </div>

        {/* Especialidades */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Materias que enseñas</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.especialidades.map(esp => (
              <span key={esp} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm px-3 py-1.5 rounded-xl border border-blue-100">
                {esp}
                <button type="button" onClick={() => setForm(f => ({ ...f, especialidades: f.especialidades.filter(e => e !== esp) }))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {form.especialidades.length === 0 && <p className="text-sm text-gray-400">Agrega al menos una materia</p>}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={nuevaEsp}
              onChange={e => setNuevaEsp(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); agregarEsp(); }}}
              placeholder="Ej: Cálculo Diferencial"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="button" onClick={agregarEsp}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Disponibilidad — integrada en el perfil */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <DisponibilidadEditor compact />
        </div>

        {/* Google Calendar — fuertemente recomendado */}
        <div>
          <div className="mb-2 px-1 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
              💡 Recomendado: vincula tu Google Calendar
            </p>
            <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
              OPCIONAL · MUY ÚTIL
            </span>
          </div>
          <GoogleCalendarSection />
          <p className="text-[10px] text-gray-500 mt-2 px-1">
            Si lo conectas: cada reserva aparecerá en tu calendario, y los alumnos
            no podrán reservar cuando estés ocupado en otra cosa (lo detectamos automático).
          </p>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-200">
          {ok ? <><CheckCircle className="w-5 h-5" /> Guardado</> : saving ? "Guardando..." : <><Save className="w-5 h-5" /> Guardar cambios</>}
        </button>
      </form>
    </div>
  );
}
