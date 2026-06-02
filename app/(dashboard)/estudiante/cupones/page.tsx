import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Tag, Gift, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatSoles } from "@/lib/utils";

export const metadata = { title: "Mis Cupones — ProfeLink" };

const TIPO_INFO: Record<string, { label: string; desc: string; icon: typeof Gift; color: string }> = {
  PRIMERA_GRATIS:  { label: "Primera sesión gratis",  desc: "Aplica el 100% de descuento en tu primera sesión", icon: Gift, color: "from-emerald-500 to-teal-500" },
  REFERIDO:        { label: "Programa de referidos",  desc: "Por invitar a un amigo a ProfeLink",                icon: Gift, color: "from-violet-500 to-purple-500" },
  DESCUENTO_FIJO:  { label: "Descuento fijo",          desc: "Aplica un descuento en soles",                     icon: Tag,  color: "from-amber-500 to-orange-500" },
  PORCENTAJE:      { label: "Descuento porcentual",    desc: "% de descuento sobre el precio",                    icon: Tag,  color: "from-blue-500 to-indigo-500" },
};

export default async function CuponesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cupones = await prisma.cupon.findMany({
    where: { usuarioId: session.sub },
    orderBy: { createdAt: "desc" },
  });

  const activos  = cupones.filter(c => c.estado === "ACTIVO");
  const usados   = cupones.filter(c => c.estado === "USADO");
  const expirados = cupones.filter(c => c.estado === "EXPIRADO");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-brand-text flex items-center gap-2">
          <Tag className="w-6 h-6 text-amber-600" /> Mis Cupones
        </h1>
        <p className="text-gray-500 text-sm mt-1">Usa tus cupones al reservar una sesión</p>
      </div>

      {activos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-3">Activos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activos.map(c => {
              const info = TIPO_INFO[c.tipo] ?? TIPO_INFO.DESCUENTO_FIJO;
              const Icon = info.icon;
              return (
                <div key={c.id} className="bento elev-1 overflow-hidden">
                  <div className={`bg-gradient-to-br ${info.color} p-5 text-white`}>
                    <div className="flex items-start gap-3">
                      <Icon className="w-8 h-8" />
                      <div>
                        <p className="font-heading font-extrabold text-lg leading-tight">{info.label}</p>
                        <p className="text-white/80 text-xs mt-0.5">{info.desc}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <code className="bg-gray-100 px-2 py-1 rounded-lg text-sm font-mono font-bold text-brand-text">
                        {c.codigo}
                      </code>
                      {c.expiraEn && (
                        <p className="text-xs text-gray-400 mt-1">
                          Expira: {new Date(c.expiraEn).toLocaleDateString("es-PE")}
                        </p>
                      )}
                    </div>
                    <Link href="/profesores"
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2 rounded-xl">
                      Usar →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {usados.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-3 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" /> Ya usados
          </h2>
          <div className="space-y-2">
            {usados.map(c => (
              <div key={c.id} className="bento p-3 elev-1 flex items-center gap-3 opacity-60">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <code className="text-xs font-mono font-bold flex-1">{c.codigo}</code>
                <span className="text-xs text-gray-400">
                  Usado: {c.usadoEn ? new Date(c.usadoEn).toLocaleDateString("es-PE") : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {expirados.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-3 flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-gray-400" /> Expirados
          </h2>
          <div className="space-y-2">
            {expirados.map(c => (
              <div key={c.id} className="bento p-3 elev-1 flex items-center gap-3 opacity-50">
                <Clock className="w-4 h-4 text-gray-400" />
                <code className="text-xs font-mono flex-1">{c.codigo}</code>
                <span className="text-xs text-gray-400">Expiró</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cupones.length === 0 && (
        <div className="bento p-10 text-center elev-1">
          <Tag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-heading font-semibold text-gray-500">No tienes cupones</p>
          <p className="text-sm text-gray-400 mt-1">Al registrarte recibes un cupón de primera sesión gratis</p>
        </div>
      )}
    </div>
  );
}
