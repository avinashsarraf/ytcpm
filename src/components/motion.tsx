"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";

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
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString("en-US", {
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
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (Math.abs(from - value) < 0.005) {
      setDisplay(value);
      return;
    }
    const controls = animate(from, value, {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value]);

  const text = format
    ? format(display)
    : display.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: value < 10 ? 2 : d,
        maximumFractionDigits: value < 10 ? 2 : d,
      });

  return <span className={className}>{text}</span>;
}
