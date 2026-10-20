"use client";

import { type ReactNode, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

export function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.05, margin: "0px 0px -8% 0px" });
  const show = reduced || inView;

  return (
    <motion.div
      ref={ref}
      className={className}
      data-reveal=""
      initial={false}
      animate={{ y: show ? 0 : y }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: 0.45, delay: Math.min(delay, 0.24), ease: [0.22, 1, 0.36, 1] }
      }
    >
      {children}
    </motion.div>
  );
}
