"use client";

import React, { useEffect, useRef } from "react";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#3b82f6", "#facc15"];
// tempo máximo da animação (ms)
const DURATION = 6000;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  size: number;
  color: string;
  round: boolean;
  wobble: number;
};

// confetes estourando em canvas, sem dependências externas
export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = [];
    // angle em graus: 0 = para a direita, -90 = para cima
    const burst = (x: number, y: number, count: number, angle: number, spread: number, power: number) => {
      for (let i = 0; i < count; i++) {
        const a = ((angle + (Math.random() - 0.5) * spread) * Math.PI) / 180;
        const speed = power * (0.5 + Math.random() * 0.7);
        particles.push({
          x,
          y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          rotation: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.3,
          size: 6 + Math.random() * 6,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
          round: Math.random() < 0.3,
          wobble: Math.random() * Math.PI * 2,
        });
      }
    };

    const w = window.innerWidth;
    const h = window.innerHeight;
    burst(w / 2, h * 0.45, 140, -90, 360, 14);
    burst(0, h, 90, -60, 30, 22);
    burst(w, h, 90, -120, 30, 22);
    const second = setTimeout(() => {
      burst(w * 0.25, h * 0.35, 70, -90, 360, 11);
      burst(w * 0.75, h * 0.35, 70, -90, 360, 11);
    }, 700);

    const start = performance.now();
    let last = start;
    let frame = 0;

    const draw = (t: number) => {
      // normaliza a física para 60fps mesmo em telas com outra taxa
      const dt = Math.min(3, (t - last) / 16.67);
      last = t;
      const elapsed = t - start;
      const fade = elapsed > DURATION - 1000 ? Math.max(0, (DURATION - elapsed) / 1000) : 1;

      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.vy += 0.35 * dt;
        p.vx *= Math.pow(0.985, dt);
        p.vy *= Math.pow(0.985, dt);
        p.wobble += 0.1 * dt;
        p.x += (p.vx + Math.sin(p.wobble) * 0.6) * dt;
        p.y += p.vy * dt;
        p.rotation += p.spin * dt;

        if (p.y > h + 20) continue;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // o cosseno achata o papel como se ele estivesse girando no ar
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, (p.size / 2) * Math.cos(p.wobble));
        }
        ctx.restore();
      }

      if (elapsed < DURATION) frame = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, w, h);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(second);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[120] h-full w-full"
      aria-hidden="true"
    />
  );
}
