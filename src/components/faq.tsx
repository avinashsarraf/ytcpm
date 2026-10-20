"use client";

import { useId, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";

export interface FaqItem { q: string; a: string; }

/**
 * Reference accordion: each question is its own white rounded row with a "+"
 * on the right; the open row keeps the same card shape and reveals the answer.
 */
export default function Faq({ items, idPrefix = "faq" }: { items: FaqItem[]; idPrefix?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  const uid = useId();
  const reduced = useReducedMotion();
  const base = `${idPrefix}-${uid}`;

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${base}-panel-${i}`;
        const buttonId = `${base}-button-${i}`;
        return (
          <div
            key={item.q}
            className={`overflow-hidden rounded-xl border bg-white transition-colors ${
              isOpen ? "border-yt-red/25 shadow-[0_8px_24px_-18px_rgba(11,22,38,0.35)]" : "border-border hover:border-[#d8e0ea]"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              id={buttonId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left sm:px-5"
            >
              <span className="text-[15px] font-bold text-heading">{item.q}</span>
              <motion.span
                animate={{ rotate: isOpen && !reduced ? 45 : 0 }}
                transition={{ duration: 0.2 }}
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors ${
                  isOpen ? "border-yt-red text-yt-red" : "border-border text-[#94a3b8]"
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={reduced ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={reduced ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 text-[14px] leading-relaxed text-[#5b6b80] sm:max-w-[60ch] sm:px-5">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
