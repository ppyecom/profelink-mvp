"use client";

export default function Marquee({ items, speed = 30 }: { items: string[]; speed?: number }) {
  // Duplicamos los items para loop infinito sin saltos
  const loop = [...items, ...items];

  return (
    <div className="overflow-hidden whitespace-nowrap select-none">
      <div
        className="inline-flex gap-8 animate-marquee"
        style={{ animationDuration: `${speed}s` }}
      >
        {loop.map((item, i) => (
          <span key={i} className="font-display font-black text-6xl md:text-8xl text-ink-900 tracking-tighter inline-flex items-center gap-8">
            {item}
            <span className="text-amber-500">★</span>
          </span>
        ))}
      </div>
    </div>
  );
}
