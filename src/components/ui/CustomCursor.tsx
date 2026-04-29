"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const clickControls = useAnimationControls();

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    setEnabled(true);
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let frame = 0;

    function move(event: MouseEvent) {
      targetX = event.clientX;
      targetY = event.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetX - 3}px, ${targetY - 3}px, 0)`;
      }

      const target = event.target instanceof Element ? event.target : null;
      const hoverable = target?.closest("button,a,[role='button'],input,textarea,select,summary,label");
      document.body.classList.toggle("cursor-hover", Boolean(hoverable));
    }

    function click() {
      void clickControls.start({
        scale: [1, 0.7, 1],
        transition: { type: "spring", stiffness: 520, damping: 22 },
      });
    }

    function animate() {
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${currentX - 16}px, ${currentY - 16}px, 0)`;
      }
      frame = requestAnimationFrame(animate);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", click);
    frame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", click);
      cancelAnimationFrame(frame);
      document.body.classList.remove("cursor-hover");
    };
  }, [clickControls]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <motion.div
        ref={dotRef}
        animate={clickControls}
        className="custom-cursor-dot fixed left-0 top-0 z-[9999] size-[6px] pointer-events-none rounded-full bg-clay"
      />
      <motion.div
        ref={ringRef}
        animate={clickControls}
        className="custom-cursor-ring fixed left-0 top-0 z-[9999] size-8 pointer-events-none rounded-full border-2 border-clay/50"
      />
    </>
  );
}
