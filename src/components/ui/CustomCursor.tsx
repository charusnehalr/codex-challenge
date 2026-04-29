"use client";

import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [touchDevice, setTouchDevice] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTouchDevice(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    if (!mounted || touchDevice) {
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) {
      return;
    }

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let hoverScale = "";
    let rafId = 0;

    const onMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const loop = () => {
      dot.style.transform = `translate(${mouseX - 3}px, ${mouseY - 3}px)${hoverScale}`;

      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.transform = `translate(${ringX - 16}px, ${ringY - 16}px)`;

      rafId = requestAnimationFrame(loop);
    };

    const onMouseOver = (event: MouseEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const isClickable = target?.closest(
        'button, a, [role="button"], input, select, textarea, label, [data-cursor-hover]',
      );

      if (isClickable) {
        hoverScale = " scale(2.5)";
        dot.style.opacity = "0.6";
        ring.style.width = "48px";
        ring.style.height = "48px";
        ring.style.marginLeft = "-8px";
        ring.style.marginTop = "-8px";
        ring.style.opacity = "0.4";
      } else {
        hoverScale = "";
        dot.style.opacity = "1";
        ring.style.width = "32px";
        ring.style.height = "32px";
        ring.style.marginLeft = "0";
        ring.style.marginTop = "0";
        ring.style.opacity = "1";
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", onMouseOver);
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      cancelAnimationFrame(rafId);
    };
  }, [mounted, touchDevice]);

  if (!mounted || touchDevice) {
    return null;
  }

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: "#B8704F",
          pointerEvents: "none",
          zIndex: 99999,
          willChange: "transform",
          transition: "opacity 0.15s",
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "1.5px solid rgba(184,112,79,0.5)",
          pointerEvents: "none",
          zIndex: 99998,
          willChange: "transform",
          transition: "width 0.2s, height 0.2s, opacity 0.15s",
        }}
      />
    </>
  );
}
