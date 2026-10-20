"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, animate } from "framer-motion";

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

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function CountUp({
  value,
  prefix = "",
  suffix = "",
  digits = 0,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  digits?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const shown = reduced ? value : display;

  useEffect(() => {
    if (reduced || !inView) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, reduced]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })}
      {suffix}
    </span>
  );
}

/** Smoothly transitions whenever `value` changes (used by the calculator). */
export function AnimatedMoney({
  value,
  digits,
  className,
  format,
}: {
  value: number;
  digits?: number;
  className?: string;
  /** Custom formatter — e.g. converts USD to the visitor's local currency. */
  format?: (v: number) => string;
}) {
  const d = digits ?? (value < 10 ? 2 : 0);
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const shown = reduced ? value : display;

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (Math.abs(from - value) < 0.005) return;
    const controls = animate(from, value, {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, reduced]);

  const text = format
    ? format(shown)
    : shown.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: value < 10 ? 2 : d,
        maximumFractionDigits: value < 10 ? 2 : d,
      });

  return <span className={className}>{text}</span>;
}
