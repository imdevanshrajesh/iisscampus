"use client";

import { useRef, type CSSProperties, type MouseEvent, type ReactNode } from "react";

export function TiltSurface({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(event: MouseEvent<HTMLDivElement>) {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = node.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    const rotateY = (x - 0.5) * 10;
    const rotateX = (0.5 - y) * 8;
    node.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
    node.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
    node.style.setProperty("--shine-x", `${(x * 100).toFixed(1)}%`);
    node.style.setProperty("--shine-y", `${(y * 100).toFixed(1)}%`);
  }

  function onLeave() {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--tilt-x", "0deg");
    node.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <div
      ref={ref}
      className={`tilt-surface ${className}`}
      style={style}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}
