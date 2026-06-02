"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lightbulb, ArrowRight, X } from "lucide-react";

interface Tip {
  id: string;
  prioridad: "alta" | "media" | "baja";
  titulo: string;
  descripcion: string;
  accion?: { label: string; href: string };
}

const COLOR: Record<string, string> = {
  alta:  "bg-red-50    border-red-200    text-red-700",
  media: "bg-amber-50  border-amber-200  text-amber-700",
  baja:  "bg-blue-50   border-blue-200   text-blue-700",
};

export default function TipsCard() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/profesores/me/tips")
      .then(r => r.json())
      .then(d => { setTips(d.tips ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const visibles = tips.filter(t => !dismissed.has(t.id));

  if (loading || visibles.length === 0) return null;

  return (
    <div className="bento p-5 elev-1">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <h2 className="font-heading font-bold text-brand-text">Sugerencias para crecer</h2>
        <span className="ml-auto text-xs text-gray-400">{visibles.length}</span>
      </div>
      <div className="space-y-2">
        {visibles.slice(0, 3).map(tip => (
          <div key={tip.id} className={`border rounded-2xl p-3 ${COLOR[tip.prioridad]}`}>
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <p className="font-bold text-sm">{tip.titulo}</p>
                <p className="text-xs opacity-80 mt-0.5">{tip.descripcion}</p>
                {tip.accion && (
                  <Link href={tip.accion.href}
                    className="inline-flex items-center gap-1 text-xs font-semibold mt-1.5 hover:underline">
                    {tip.accion.label} <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
              <button onClick={() => setDismissed(d => new Set([...d, tip.id]))}
                className="opacity-50 hover:opacity-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
