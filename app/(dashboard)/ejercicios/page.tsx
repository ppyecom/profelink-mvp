"use client";

import { useEffect, useState } from "react";
import { BookOpen, Search, Flame, FileText } from "lucide-react";

interface Ejercicio {
  id: string;
  materia: string;
  nivel: string;
  titulo: string;
  enunciado: string;
  solucion: string | null;
  dificultad: number;
  createdAt: string;
}

const NIVELES = [
  { value: "", label: "Todos" },
  { value: "SECUNDARIA", label: "Secundaria" },
  { value: "TECNICA", label: "Técnica" },
  { value: "UNIVERSITARIA", label: "Universitaria" },
];

const DIFICULTADES = ["", "Muy fácil", "Fácil", "Medio", "Difícil", "Muy difícil"];

export default function EjerciciosPage() {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ materia: "", nivel: "", dificultad: "" });
  const [expandido, setExpandido] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtros.materia) params.set("materia", filtros.materia);
    if (filtros.nivel) params.set("nivel", filtros.nivel);
    if (filtros.dificultad) params.set("dificultad", filtros.dificultad);
    const res = await fetch(`/api/ejercicios?${params}`);
    const data = await res.json();
    setEjercicios(data.ejercicios ?? []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-brand-text flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-violet-600" /> Banco de ejercicios
        </h1>
        <p className="text-gray-500 text-sm mt-1">Practica con ejercicios subidos por la comunidad de tutores</p>
      </div>

      <div className="bento p-4 elev-1 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text"
            placeholder="Buscar materia (cálculo, álgebra, inglés...)"
            value={filtros.materia}
            onChange={e => setFiltros(f => ({ ...f, materia: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && cargar()}
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <select value={filtros.nivel} onChange={e => { setFiltros(f => ({ ...f, nivel: e.target.value })); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
          {NIVELES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
        </select>
        <select value={filtros.dificultad} onChange={e => { setFiltros(f => ({ ...f, dificultad: e.target.value })); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
          <option value="">Cualquier dificultad</option>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{DIFICULTADES[n]}</option>)}
        </select>
        <button onClick={cargar}
          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-4 rounded-xl">
          Filtrar
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}</div>
      ) : ejercicios.length === 0 ? (
        <div className="bento p-10 text-center elev-1">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No hay ejercicios con esos filtros</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ejercicios.map(e => (
            <div key={e.id} className="bento p-5 elev-1">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{e.materia}</span>
                    <span className="text-[10px] text-gray-400">{e.nivel}</span>
                    <span className="flex items-center gap-0.5">
                      {[...Array(e.dificultad)].map((_, i) => <Flame key={i} className="w-3 h-3 text-amber-500" />)}
                    </span>
                  </div>
                  <p className="font-heading font-bold text-brand-text">{e.titulo}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{e.enunciado}</p>
              {e.solucion && (
                <div className="mt-3">
                  <button onClick={() => setExpandido(expandido === e.id ? null : e.id)}
                    className="text-xs font-semibold text-violet-600 hover:underline">
                    {expandido === e.id ? "Ocultar solución" : "Ver solución"}
                  </button>
                  {expandido === e.id && (
                    <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800 whitespace-pre-wrap">
                      {e.solucion}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
