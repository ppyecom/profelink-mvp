"use client";

import { ReactNode, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ScrollReveal({
  children,
  delay = 0,
  y = 40,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const anim = gsap.fromTo(el,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }
    );
    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, [delay, y]);

  return <div ref={ref} className={className}>{children}</div>;
}

export function SplitText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chars = ref.current.querySelectorAll(".char");
    gsap.fromTo(chars,
      { opacity: 0, y: 80, rotateX: -90 },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 1,
        ease: "back.out(1.4)",
        stagger: 0.03,
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
        },
      }
    );
  }, [text]);

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {text.split("").map((c, i) => (
        <span key={i} className="char inline-block" style={{ display: c === " " ? "inline" : "inline-block" }}>
          {c === " " ? " " : c}
        </span>
      ))}
    </span>
  );
}
