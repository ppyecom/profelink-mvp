"use client";

import { useRef, useState, ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  href?: string;
  strength?: number;
  onClick?: () => void;
}

/**
 * Botón "magnético": se acerca al cursor cuando está cerca.
 */
export default function MagneticButton({ children, className = "", href, strength = 0.3, onClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * strength;
    const dy = (e.clientY - cy) * strength;
    setPos({ x: dx, y: dy });
  };
  const handleLeave = () => setPos({ x: 0, y: 0 });

  const inner = (
    <span className="inline-block transition-transform duration-300 ease-out"
      style={{ transform: `translate3d(${pos.x * 0.5}px, ${pos.y * 0.5}px, 0)` }}>
      {children}
    </span>
  );

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      data-cursor="hover"
      className="inline-block transition-transform duration-300 ease-out"
      style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
    >
      {href ? (
        <a href={href} className={className}>
          {inner}
        </a>
      ) : (
        <button onClick={onClick} className={className}>
          {inner}
        </button>
      )}
    </div>
  );
}
