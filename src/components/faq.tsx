"use client";

import { useId, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";

export interface FaqItem { q: string; a: string; }

export default function Faq({ items, idPrefix = "faq" }: { items: FaqItem[]; idPrefix?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  const uid = useId();
  const reduced = useReducedMotion();
  const base = `${idPrefix}-${uid}`;

  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${base}-panel-${i}`;
        const buttonId = `${base}-button-${i}`;
        return (
          <div key={item.q} className={`transition-colors duration-200 ${isOpen ? "bg-yt-red-light" : "hover:bg-surface"}`}>
            <button type="button" onClick={() => setOpen(isOpen ? null : i)}
              id={buttonId} aria-expanded={isOpen} aria-controls={panelId}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-[1.15rem]"
            >
              <span className="pr-2 text-[15px] font-semibold leading-snug text-heading">{item.q}</span>
              <motion.span animate={{ rotate: isOpen && !reduced ? 45 : 0 }} transition={{ duration: 0.2 }}
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-all duration-200 ${isOpen ? "bg-yt-red text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]" : "border border-border text-fog hover:border-yt-red/30 hover:text-yt-red"}`}>
                <Plus className="h-3.5 w-3.5" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId} role="region" aria-labelledby={buttonId}
                  initial={reduced ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={reduced ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-[13.5px] leading-relaxed text-fog sm:max-w-[62ch] sm:px-6">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
