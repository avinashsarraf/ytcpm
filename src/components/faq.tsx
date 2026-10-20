"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

export interface FaqItem { q: string; a: string; }

export default function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={`transition-colors duration-200 ${isOpen ? "bg-yt-red-light" : "hover:bg-surface"}`}>
            <button type="button" onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6" aria-expanded={isOpen}>
              <span className="text-[14px] font-semibold text-heading">{item.q}</span>
              <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-all duration-200 ${isOpen ? "bg-yt-red text-white shadow-[0_2px_8px_rgba(255,0,0,0.3)]" : "border border-border text-fog hover:border-yt-red/30 hover:text-yt-red"}`}>
                <Plus className="h-3.5 w-3.5" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-relaxed text-fog sm:px-6 sm:max-w-3xl">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
