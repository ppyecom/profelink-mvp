"use client";

import { Check, X } from "lucide-react";

interface Rule { label: string; test: (p: string) => boolean }

const RULES: Rule[] = [
  { label: "8 caracteres o más",            test: p => p.length >= 8 },
  { label: "Una minúscula (a-z)",           test: p => /[a-z]/.test(p) },
  { label: "Una mayúscula (A-Z)",           test: p => /[A-Z]/.test(p) },
  { label: "Un número (0-9)",               test: p => /[0-9]/.test(p) },
  { label: "Un símbolo (!@#$%...)",         test: p => /[^A-Za-z0-9]/.test(p) },
];

export function calcularFortaleza(p: string): { score: number; label: string; color: string } {
  if (!p) return { score: 0, label: "", color: "" };
  const passed = RULES.filter(r => r.test(p)).length;
  const bonus  = p.length >= 12 ? 1 : 0;
  const total  = passed + bonus;

  if (total <= 2) return { score: 1, label: "Débil",     color: "bg-red-500" };
  if (total <= 4) return { score: 2, label: "Aceptable", color: "bg-amber-500" };
  if (total <= 5) return { score: 3, label: "Fuerte",    color: "bg-emerald-500" };
  return                  { score: 4, label: "Muy fuerte", color: "bg-emerald-600" };
}

export default function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, color } = calcularFortaleza(password);

  return (
    <div className="space-y-2 mt-2">
      {/* Barra */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(n => (
          <div key={n}
            className={`h-1 flex-1 rounded-full transition-colors ${
              n <= score ? color : "bg-gray-200"
            }`} />
        ))}
      </div>
      <p className={`text-xs font-semibold ${
        score === 1 ? "text-red-600" :
        score === 2 ? "text-amber-600" :
        "text-emerald-600"
      }`}>
        Seguridad: {label}
      </p>

      {/* Lista de requisitos */}
      <ul className="space-y-0.5 text-xs">
        {RULES.map(rule => {
          const ok = rule.test(password);
          return (
            <li key={rule.label} className={`flex items-center gap-1.5 ${ok ? "text-emerald-600" : "text-gray-400"}`}>
              {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
