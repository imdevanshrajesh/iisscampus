"use client";

import { useEffect, useRef } from "react";

export function AmbientField({ live }: { live: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    const particles = Array.from({ length: live ? 42 : 22 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + Math.random() * 1.8,
      s: 0.08 + Math.random() * 0.22,
      a: 0.12 + Math.random() * 0.28,
    }));

    function resize() {
      if (!canvas) return;
      const ratio = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function draw() {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      for (const particle of particles) {
        particle.y -= particle.s * 0.0018;
        if (particle.y < -0.05) {
          particle.y = 1.05;
          particle.x = Math.random();
        }
        context.beginPath();
        context.fillStyle = live
          ? `rgba(244, 130, 32, ${particle.a})`
          : `rgba(20, 27, 56, ${particle.a * 0.55})`;
        context.arc(particle.x * width, particle.y * height, particle.r, 0, Math.PI * 2);
        context.fill();
      }
      frame = window.requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [live]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full opacity-70" aria-hidden="true" />;
}
