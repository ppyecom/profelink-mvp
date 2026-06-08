"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Upload, Trash2, Download, Loader2, FileImage, FileArchive, File as FileIcon, X } from "lucide-react";

interface Archivo {
  id: string;
  nombre: string;
  url: string;
  mimeType: string;
  tamanoBytes: number;
  descripcion: string | null;
  createdAt: string;
  subidoPor: { id: string; nombre: string; rol: string };
  esPropio: boolean;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function IconoArchivo({ mime }: { mime: string }) {
  if (mime.startsWith("image/")) return <FileImage className="w-5 h-5 text-emerald-600" />;
  if (mime === "application/pdf") return <FileText className="w-5 h-5 text-rose-600" />;
  if (mime.includes("zip")) return <FileArchive className="w-5 h-5 text-violet-600" />;
  return <FileIcon className="w-5 h-5 text-ink-600" />;
}

interface ArchivosSesionProps {
  sesionId: string;
  /** Si es false, oculta el upload (lectura/descarga solamente) */
  puedeSubir: boolean;
}

export default function ArchivosSesion({ sesionId, puedeSubir }: ArchivosSesionProps) {
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError]       = useState("");
  const [descripcion, setDescripcion] = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sesiones/${sesionId}/archivos`, { cache: "no-store" });
      const data = await res.json();
      setArchivos(data.archivos ?? []);
    } catch { /* noop */ }
    setLoading(false);
  }, [sesionId]);

  useEffect(() => { cargar(); }, [cargar]);

  const subir = async (file: File) => {
    setError("");
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (descripcion) fd.append("descripcion", descripcion);
      const res = await fetch(`/api/sesiones/${sesionId}/archivos`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Error al subir");
      else { setDescripcion(""); cargar(); }
    } catch { setError("Error de red"); }
    setSubiendo(false);
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este archivo?")) return;
    const res = await fetch(`/api/sesiones/${sesionId}/archivos/${id}`, { method: "DELETE" });
    if (res.ok) cargar();
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Error al eliminar");
    }
  };

  return (
    <div className="bg-white border-2 border-ink-900 p-5 shadow-[3px_3px_0_0_rgba(28,25,23,1)] space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display font-black text-lg text-ink-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-600" />
          Materiales de la sesión
          {archivos.length > 0 && (
            <span className="bg-amber-200 border-2 border-ink-900 text-ink-900 text-xs font-bold px-2 py-0.5">
              {archivos.length}
            </span>
          )}
        </h2>
      </div>

      {/* Subir (solo si el profesor o admin) */}
      {puedeSubir ? (
      <div className="space-y-2">
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción opcional del archivo..."
          maxLength={500}
          disabled={subiendo}
          className="w-full border-2 border-ink-900 px-3 py-2 bg-cream-50 text-sm"
        />
        <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-ink-300 hover:border-amber-500 hover:bg-amber-50 px-3 py-3 text-sm text-ink-700 cursor-pointer transition-colors">
          {subiendo ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</>
          ) : (
            <><Upload className="w-4 h-4" /> Subir archivo (PDF, imagen, ZIP, Office · máx 20 MB)</>
          )}
          <input
            type="file"
            className="hidden"
            disabled={subiendo}
            accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) subir(f);
              e.target.value = "";
            }}
          />
        </label>

        {error && (
          <div className="bg-rose-100 border-2 border-rose-700 text-rose-900 px-3 py-2 text-sm font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
          </div>
        )}
      </div>
      ) : (
        <p className="text-xs text-ink-500 italic bg-ink-50 border border-ink-200 px-3 py-2">
          📥 Solo el profesor sube materiales. Tú puedes descargar lo que comparta.
        </p>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[1,2].map(i => <div key={i} className="h-14 bg-ink-50 animate-pulse rounded" />)}
        </div>
      ) : archivos.length === 0 ? (
        <p className="text-sm text-ink-500 text-center py-4">Aún no hay archivos compartidos</p>
      ) : (
        <div className="space-y-2">
          {archivos.map(a => (
            <div key={a.id} className="flex items-center gap-3 bg-cream-50 border-2 border-ink-900 p-3">
              <IconoArchivo mime={a.mimeType} />
              <div className="flex-1 min-w-0">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={a.nombre}
                  className="font-bold text-sm text-ink-900 truncate hover:underline block"
                >
                  {a.nombre}
                </a>
                <p className="text-xs text-ink-600">
                  {formatBytes(a.tamanoBytes)} ·{" "}
                  <span className={a.subidoPor.rol === "PROFESOR" ? "text-amber-700 font-semibold" : "text-emerald-700 font-semibold"}>
                    {a.subidoPor.nombre}
                  </span>
                  {" · "}
                  {new Date(a.createdAt).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                </p>
                {a.descripcion && <p className="text-xs text-ink-700 italic mt-0.5">"{a.descripcion}"</p>}
              </div>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                download={a.nombre}
                className="text-amber-600 hover:text-amber-800 p-1 flex-shrink-0"
                title="Descargar"
              >
                <Download className="w-4 h-4" />
              </a>
              {a.esPropio && (
                <button
                  onClick={() => eliminar(a.id)}
                  className="text-rose-500 hover:text-rose-700 p-1 flex-shrink-0"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
