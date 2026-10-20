"use client";

import { useLayoutEffect, useRef } from "react";
import { localMoney, type Country } from "@/lib/data";

/** Animate display only; calculations and assistive-technology output update immediately. */
export default function AnimatedMoney({ value, country, digits }: { value: number; country: Country; digits?: number }) {
  const node = useRef<HTMLSpanElement>(null);
  const displayed = useRef(value);
  const unit = `${country.currency}:${country.fx}:${country.locale}`;
  const previousUnit = useRef(unit);
  const target = localMoney(value, country, digits);
  useLayoutEffect(() => {
    const element = node.current;
    if (!element) return;
    const from = displayed.current;
    const format = (n: number) => localMoney(n, country, digits);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const snap = () => { displayed.current = value; element.textContent = format(value); element.dataset.animating = "false"; };
    if (previousUnit.current !== unit || reduced.matches || from === value) {
      previousUnit.current = unit;
      snap();
      return;
    }
    let frame = 0;
    let started: number | undefined;
    element.textContent = format(from);
    element.dataset.animating = "true";
    const tick = (time: number) => {
      started ??= time;
      const progress = Math.min((time - started) / 450, 1);
      displayed.current = from + (value - from) * (1 - (1 - progress) ** 3);
      element.textContent = format(displayed.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else snap();
    };
    const preferenceChanged = () => { if (reduced.matches) { cancelAnimationFrame(frame); snap(); } };
    reduced.addEventListener("change", preferenceChanged);
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); reduced.removeEventListener("change", preferenceChanged); };
  }, [value, unit, country, digits]);
  return <><span ref={node} aria-hidden="true" data-animated-money data-animating="false">{target}</span><span className="sr-only">{target}</span></>;
}
