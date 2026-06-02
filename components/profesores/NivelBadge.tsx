import { Shield, BadgeCheck, Trophy } from "lucide-react";

interface Props {
  nivel: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const CONFIG: Record<string, { label: string; icon: typeof Shield; bg: string; text: string; border: string }> = {
  BASICO:  { label: "Verificado",       icon: Shield,     bg: "bg-gray-100",   text: "text-gray-700",    border: "border-gray-200" },
  EXPERTO: { label: "Experto",          icon: BadgeCheck, bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  DOCENTE: { label: "Docente Verificado", icon: Trophy,   bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
};

export default function NivelBadge({ nivel, size = "md", showLabel = true }: Props) {
  const config = CONFIG[nivel] ?? CONFIG.BASICO;
  const Icon = config.icon;

  const sizes = {
    sm: { wrap: "px-2 py-0.5 text-[10px] gap-1",       icon: "w-2.5 h-2.5" },
    md: { wrap: "px-2.5 py-1 text-xs gap-1.5",         icon: "w-3 h-3" },
    lg: { wrap: "px-3 py-1.5 text-sm gap-2",           icon: "w-4 h-4" },
  };
  const s = sizes[size];

  return (
    <span className={`inline-flex items-center font-bold rounded-full border ${config.bg} ${config.text} ${config.border} ${s.wrap}`}>
      <Icon className={s.icon} />
      {showLabel && config.label}
    </span>
  );
}
