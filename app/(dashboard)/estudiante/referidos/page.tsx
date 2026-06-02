"use client";

import { useEffect, useState } from "react";
import { Users, Copy, Gift, Share2, CheckCircle, Loader2 } from "lucide-react";

export default function ReferidosPage() {
  const [data, setData] = useState<{ codigoReferido: string; cuponesRecibidos: number } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [codigoInput, setCodigoInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; mensaje: string } | null>(null);

  useEffect(() => {
    fetch("/api/referidos").then(r => r.json()).then(setData);
  }, []);

  const copiar = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.codigoReferido);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const compartir = () => {
    if (!data) return;
    const texto = `¡Hola! Te invito a ProfeLink, una plataforma de asesorías académicas. Usa mi código ${data.codigoReferido} al registrarte y ambos recibimos S/ 20 de cupón. ${window.location.origin}/register`;
    if (navigator.share) {
      navigator.share({ title: "ProfeLink", text: texto });
    } else {
      navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const aplicar = async (e: React.FormEvent) => {
    e.preventDefault(); setEnviando(true); setResultado(null);
    const res = await fetch("/api/referidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigoAmigo: codigoInput }),
    });
    const json = await res.json();
    setEnviando(false);
    setResultado({ ok: res.ok, mensaje: json.mensaje ?? json.error ?? "Error" });
    if (res.ok) setCodigoInput("");
  };

  if (!data) return <div className="h-40 bg-white rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-brand-text flex items-center gap-2">
          <Users className="w-6 h-6 text-violet-600" /> Invita amigos
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Tu amigo recibe S/ 20 al registrarse · Tú también recibes S/ 20
        </p>
      </div>

      {/* Tarjeta principal */}
      <div className="bento elev-3 overflow-hidden">
        <div className="bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-500 p-6 text-white">
          <Gift className="w-10 h-10 mb-2" />
          <p className="font-heading font-extrabold text-2xl">Tu código personal</p>
          <p className="text-white/80 text-sm">Compártelo con quien quieras</p>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3 bg-violet-50 border-2 border-dashed border-violet-200 rounded-2xl p-4">
            <code className="flex-1 font-mono font-extrabold text-2xl text-violet-700 text-center tracking-wider">
              {data.codigoReferido}
            </code>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={copiar}
              className="bg-violet-100 hover:bg-violet-200 text-violet-700 font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
              {copiado ? <><CheckCircle className="w-4 h-4" /> ¡Copiado!</> : <><Copy className="w-4 h-4" /> Copiar</>}
            </button>
            <button onClick={compartir}
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Share2 className="w-4 h-4" /> Compartir
            </button>
          </div>
        </div>
      </div>

      {/* Aplicar código de amigo */}
      <div className="bento p-5 elev-1">
        <h2 className="font-heading font-bold text-brand-text mb-2">¿Te invitó alguien?</h2>
        <p className="text-xs text-gray-500 mb-3">Ingresa el código de tu amigo y ambos reciben S/ 20</p>

        <form onSubmit={aplicar} className="flex gap-2">
          <input type="text"
            value={codigoInput}
            onChange={e => setCodigoInput(e.target.value.toUpperCase())}
            placeholder="REF-XXXXXXXX"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <button type="submit" disabled={enviando || !codigoInput}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold px-4 rounded-xl flex items-center gap-2">
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Canjear"}
          </button>
        </form>

        {resultado && (
          <p className={`mt-3 text-sm px-3 py-2 rounded-xl ${resultado.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {resultado.mensaje}
          </p>
        )}
      </div>

      {/* Estadísticas */}
      <div className="bento p-5 elev-1">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-2">Tus referidos</p>
        <p className="font-heading font-extrabold text-4xl text-brand-text">{data.cuponesRecibidos}</p>
        <p className="text-sm text-gray-500">amigos invitados a ProfeLink</p>
      </div>
    </div>
  );
}
