"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";

const NIVELES = [
  { value: "", label: "Todos los niveles" },
  { value: "SECUNDARIA", label: "Secundaria" },
  { value: "TECNICA", label: "Técnica" },
  { value: "UNIVERSITARIA", label: "Universitaria" },
];

const MODALIDADES = [
  { value: "", label: "Cualquier modalidad" },
  { value: "VIRTUAL", label: "Virtual" },
  { value: "PRESENCIAL", label: "Presencial" },
];

export default function BuscadorFiltros() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [materia, setMateria]     = useState(searchParams.get("materia") ?? "");
  const [nivel, setNivel]         = useState(searchParams.get("nivel") ?? "");
  const [modalidad, setModalidad] = useState(searchParams.get("modalidad") ?? "");
  const [precioMax, setPrecioMax] = useState(searchParams.get("precioMax") ?? "");
  const [expanded, setExpanded]   = useState(false);

  function buildUrl(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams();
    const vals = { materia, nivel, modalidad, precioMax, ...overrides };
    if (vals.materia)  params.set("materia",  vals.materia);
    if (vals.nivel)    params.set("nivel",    vals.nivel);
    if (vals.modalidad) params.set("modalidad", vals.modalidad);
    if (vals.precioMax) params.set("precioMax", vals.precioMax);
    params.set("page", "1");
    return `/profesores?${params.toString()}`;
  }

  function aplicar() {
    router.push(buildUrl());
  }

  function limpiar() {
    setMateria(""); setNivel(""); setModalidad(""); setPrecioMax("");
    router.push("/profesores");
  }

  const hayFiltros = materia || nivel || modalidad || precioMax;

  return (
    <div className="bg-white rounded-3xl shadow-elev-2 border border-indigo-50 p-4 mb-6">
      {/* Barra principal */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={materia}
            onChange={(e) => setMateria(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") aplicar(); }}
            placeholder="Buscar materia (Cálculo, Python, Inglés...)"
            className="w-full pl-9 pr-4 py-3 border-2 border-indigo-50 bg-indigo-50/50 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder:text-gray-300 font-medium"
          />
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`p-2.5 rounded-xl border transition-colors ${
            expanded || hayFiltros
              ? "border-blue-500 bg-blue-50 text-blue-600"
              : "border-gray-200 text-gray-400 hover:border-gray-300"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={aplicar}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-elev-2 hover:-translate-y-0.5 active:translate-y-0"
        >
          Buscar
        </button>
      </div>

      {/* Filtros expandidos */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nivel académico</label>
            <select
              value={nivel}
              onChange={(e) => setNivel(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {NIVELES.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Modalidad</label>
            <select
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MODALIDADES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Precio máximo (S/)</label>
            <input
              type="number"
              value={precioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
              placeholder="Ej: 100"
              min="0"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
            {hayFiltros && (
              <button
                type="button"
                onClick={limpiar}
                className="text-sm text-gray-400 hover:text-gray-700 underline"
              >
                Limpiar filtros
              </button>
            )}
            <button
              type="button"
              onClick={aplicar}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      )}

      {/* Chips activos */}
      {hayFiltros && !expanded && (
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400">Filtros:</span>
          {[
            materia   && { label: materia,              clear: () => { setMateria("");   router.push(buildUrl({ materia: "" })); } },
            nivel     && { label: NIVELES.find(n => n.value === nivel)?.label ?? nivel, clear: () => { setNivel("");     router.push(buildUrl({ nivel: "" })); } },
            modalidad && { label: MODALIDADES.find(m => m.value === modalidad)?.label ?? modalidad, clear: () => { setModalidad(""); router.push(buildUrl({ modalidad: "" })); } },
            precioMax && { label: `Hasta S/ ${precioMax}`, clear: () => { setPrecioMax(""); router.push(buildUrl({ precioMax: "" })); } },
          ].filter(Boolean).map((chip, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full">
              {(chip as {label: string; clear: () => void}).label}
              <button
                type="button"
                onClick={(chip as {label: string; clear: () => void}).clear}
                className="ml-0.5 text-blue-500 hover:text-blue-800 font-bold leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
