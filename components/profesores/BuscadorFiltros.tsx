"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const NIVELES = [
  { value: "", label: "Todos los niveles" },
  { value: "SECUNDARIA", label: "Secundaria" },
  { value: "TECNICA", label: "Técnica" },
  { value: "UNIVERSITARIA", label: "Universitaria" },
];

const MODALIDADES = [
  { value: "", label: "Cualquier modalidad" },
  { value: "VIRTUAL", label: "🖥 Virtual" },
  { value: "PRESENCIAL", label: "📍 Presencial" },
];

const PRECIOS = [
  { value: "", label: "Cualquier precio" },
  { value: "50",  label: "Hasta S/ 50" },
  { value: "80",  label: "Hasta S/ 80" },
  { value: "100", label: "Hasta S/ 100" },
  { value: "150", label: "Hasta S/ 150" },
];

export default function BuscadorFiltros() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [materia,   setMateria]   = useState(searchParams.get("materia")   ?? "");
  const [nivel,     setNivel]     = useState(searchParams.get("nivel")     ?? "");
  const [modalidad, setModalidad] = useState(searchParams.get("modalidad") ?? "");
  const [precioMax, setPrecioMax] = useState(searchParams.get("precioMax") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  function buildUrl(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams();
    const vals = { materia, nivel, modalidad, precioMax, ...overrides };
    if (vals.materia)   params.set("materia",   vals.materia);
    if (vals.nivel)     params.set("nivel",     vals.nivel);
    if (vals.modalidad) params.set("modalidad", vals.modalidad);
    if (vals.precioMax) params.set("precioMax", vals.precioMax);
    params.set("page", "1");
    return `/profesores?${params.toString()}`;
  }

  function aplicar() { router.push(buildUrl()); }

  function limpiar() {
    setMateria(""); setNivel(""); setModalidad(""); setPrecioMax("");
    router.push("/profesores");
  }

  const filtrosActivos = [
    materia   && { label: materia,                                       clear: () => { setMateria("");   router.push(buildUrl({ materia: "" })); } },
    nivel     && { label: NIVELES.find(n => n.value===nivel)?.label,    clear: () => { setNivel("");     router.push(buildUrl({ nivel: "" })); } },
    modalidad && { label: MODALIDADES.find(m => m.value===modalidad)?.label, clear: () => { setModalidad(""); router.push(buildUrl({ modalidad: "" })); } },
    precioMax && { label: `Hasta S/ ${precioMax}`,                       clear: () => { setPrecioMax(""); router.push(buildUrl({ precioMax: "" })); } },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <div className="bg-white rounded-3xl shadow-elev-2 border border-indigo-50 p-4 mb-6">

      {/* Barra de búsqueda */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" value={materia}
            onChange={e => setMateria(e.target.value)}
            onKeyDown={e => e.key === "Enter" && aplicar()}
            placeholder="Buscar materia (Cálculo, Python, Inglés...)"
            className="w-full pl-10 pr-4 py-3 border-2 border-indigo-50 bg-indigo-50/50 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder:text-gray-300 font-medium"
          />
        </div>
        <button type="button" onClick={() => setFiltersOpen(!filtersOpen)}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-3 rounded-2xl border-2 text-sm font-semibold transition-all",
            filtersOpen || filtrosActivos.length > 0
              ? "border-indigo-400 bg-indigo-50 text-indigo-600"
              : "border-indigo-50 text-gray-500 hover:border-indigo-200 hover:text-indigo-500"
          )}>
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filtros</span>
          {filtrosActivos.length > 0 && (
            <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {filtrosActivos.length}
            </span>
          )}
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", filtersOpen && "rotate-180")} />
        </button>
        <button type="button" onClick={aplicar}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-elev-2 hover:-translate-y-0.5 whitespace-nowrap">
          Buscar
        </button>
      </div>

      {/* Filtros expandibles */}
      {filtersOpen && (
        <div className="mt-4 pt-4 border-t border-indigo-50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            {/* Nivel */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Nivel académico</label>
              <div className="flex flex-wrap gap-1.5">
                {NIVELES.map(n => (
                  <button key={n.value} type="button" onClick={() => { setNivel(n.value); router.push(buildUrl({ nivel: n.value })); }}
                    className={cn(
                      "text-xs font-semibold px-3 py-1.5 rounded-xl border-2 transition-all",
                      nivel === n.value
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "border-indigo-100 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 bg-white"
                    )}>
                    {n.label || "Todos"}
                  </button>
                ))}
              </div>
            </div>

            {/* Modalidad */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Modalidad</label>
              <div className="flex flex-wrap gap-1.5">
                {MODALIDADES.map(m => (
                  <button key={m.value} type="button" onClick={() => { setModalidad(m.value); router.push(buildUrl({ modalidad: m.value })); }}
                    className={cn(
                      "text-xs font-semibold px-3 py-1.5 rounded-xl border-2 transition-all",
                      modalidad === m.value
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "border-indigo-100 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 bg-white"
                    )}>
                    {m.label || "Cualquiera"}
                  </button>
                ))}
              </div>
            </div>

            {/* Precio */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Precio máximo</label>
              <div className="flex flex-wrap gap-1.5">
                {PRECIOS.map(p => (
                  <button key={p.value} type="button" onClick={() => { setPrecioMax(p.value); router.push(buildUrl({ precioMax: p.value })); }}
                    className={cn(
                      "text-xs font-semibold px-3 py-1.5 rounded-xl border-2 transition-all",
                      precioMax === p.value
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "border-indigo-100 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 bg-white"
                    )}>
                    {p.label || "Cualquier precio"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chips de filtros activos */}
      {filtrosActivos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400 font-medium">Filtros activos:</span>
          {filtrosActivos.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
              {f.label}
              <button type="button" onClick={f.clear} className="hover:text-indigo-900 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button type="button" onClick={limpiar} className="text-xs text-gray-400 hover:text-gray-600 underline ml-1 font-medium">
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  );
}
