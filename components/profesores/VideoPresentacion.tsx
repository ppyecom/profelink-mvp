"use client";

import { useState } from "react";
import { Play, ExternalLink } from "lucide-react";

/**
 * Reproductor para el video de presentación del profesor.
 * Soporta: YouTube, Vimeo, Loom y archivos .mp4 directos.
 * Si no reconoce la plataforma, muestra un botón "Ver video".
 */
function getEmbedUrl(rawUrl: string): { embedUrl: string | null; platform: string } {
  try {
    const url = new URL(rawUrl);

    // YouTube
    if (url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be")) {
      let videoId = "";
      if (url.hostname.includes("youtu.be")) {
        videoId = url.pathname.slice(1).split("/")[0];
      } else if (url.searchParams.has("v")) {
        videoId = url.searchParams.get("v")!;
      } else if (url.pathname.startsWith("/embed/")) {
        videoId = url.pathname.split("/embed/")[1];
      } else if (url.pathname.startsWith("/shorts/")) {
        videoId = url.pathname.split("/shorts/")[1];
      }
      if (videoId) {
        // youtube-nocookie no setea cookies hasta que el user le da play
        return { embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`, platform: "YouTube" };
      }
    }

    // Vimeo
    if (url.hostname.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) {
        return { embedUrl: `https://player.vimeo.com/video/${id}`, platform: "Vimeo" };
      }
    }

    // Loom
    if (url.hostname.includes("loom.com")) {
      const id = url.pathname.split("/share/")[1] ?? url.pathname.split("/").filter(Boolean).pop();
      if (id) {
        return { embedUrl: `https://www.loom.com/embed/${id}`, platform: "Loom" };
      }
    }

    // mp4 directo
    if (url.pathname.endsWith(".mp4")) {
      return { embedUrl: rawUrl, platform: "MP4" };
    }
  } catch { /* URL inválida */ }

  return { embedUrl: null, platform: "Externo" };
}

export default function VideoPresentacion({ url, nombre }: { url: string; nombre: string }) {
  const [playing, setPlaying] = useState(false);
  const { embedUrl, platform } = getEmbedUrl(url);

  // Si no pudimos embeber, mostramos botón externo
  if (!embedUrl) {
    return (
      <div className="bg-violet-50 border-2 border-violet-300 p-4 rounded-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-600 text-white rounded-xl flex items-center justify-center">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div>
            <p className="font-semibold text-violet-900 text-sm">Video de presentación</p>
            <p className="text-xs text-violet-700">Mira a {nombre} en su intro</p>
          </div>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-3 py-2 rounded-xl">
          <ExternalLink className="w-3.5 h-3.5" /> Ver
        </a>
      </div>
    );
  }

  // Reproductor embebido
  return (
    <div className="bg-white border-2 border-ink-900 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-ink-200 flex items-center justify-between bg-gradient-to-r from-violet-50 to-fuchsia-50">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-violet-600 fill-current" />
          <p className="font-semibold text-sm text-ink-900">Video de presentación</p>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-violet-600 bg-violet-100 px-2 py-0.5 rounded">
          {platform}
        </span>
      </div>

      <div className="relative aspect-video bg-ink-900">
        {!playing && platform !== "MP4" ? (
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 flex items-center justify-center group bg-ink-900"
            aria-label="Reproducir video"
          >
            <div className="w-20 h-20 rounded-full bg-white/95 shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-9 h-9 text-violet-600 fill-current ml-1" />
            </div>
            <p className="absolute bottom-4 left-4 text-white text-sm font-semibold bg-black/60 px-3 py-1 rounded-lg">
              ▶ Conoce a {nombre}
            </p>
          </button>
        ) : platform === "MP4" ? (
          <video
            src={embedUrl}
            controls
            className="w-full h-full object-contain bg-ink-900"
          />
        ) : (
          <iframe
            src={`${embedUrl}?autoplay=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
            title={`Video de presentación de ${nombre}`}
          />
        )}
      </div>
    </div>
  );
}
