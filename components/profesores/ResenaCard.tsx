import { Star } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ResenaPublica } from "@/types";

export default function ResenaCard({ resena }: { resena: ResenaPublica }) {
  const inicial = resena.estudiante.nombre.charAt(0).toUpperCase();
  const gradients = ["from-indigo-400 to-violet-500","from-emerald-400 to-teal-500","from-amber-400 to-orange-500","from-rose-400 to-pink-500","from-sky-400 to-blue-500"];
  const grad = gradients[inicial.charCodeAt(0) % gradients.length];

  return (
    <div className="bg-gradient-to-r from-brand-bg to-indigo-50/50 rounded-2xl p-4 border border-indigo-50 hover:border-indigo-100 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} text-white font-heading font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-elev-1`}>
            {inicial}
          </div>
          <div>
            <p className="font-heading font-semibold text-sm text-brand-text">{resena.estudiante.nombre}</p>
            <div className="flex items-center gap-0.5 mt-0.5">
              {[1,2,3,4,5].map(n => (
                <Star key={n} className={`w-3 h-3 ${n <= resena.calificacion ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-200"}`} />
              ))}
            </div>
          </div>
        </div>
        <span className="text-[10px] text-gray-400 whitespace-nowrap mt-1">{formatDate(resena.createdAt)}</span>
      </div>
      {resena.comentario && (
        <p className="text-sm text-gray-600 leading-relaxed pl-11">&ldquo;{resena.comentario}&rdquo;</p>
      )}
    </div>
  );
}
