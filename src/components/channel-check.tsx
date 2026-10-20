"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Search, Link2 } from "lucide-react";
import { motion } from "framer-motion";
import { CREATOR_SHARE, SEASONS, money } from "@/lib/data";

/**
 * Pink CTA band from the reference — but wired to real arithmetic instead of a
 * fake YouTube lookup: the visitor supplies a channel's monthly views and we
 * apply the benchmark CPM. No API key, no scraping, no dead button.
 */
const num = (n: number) => n.toLocaleString("en-US");

export default function ChannelCheck({ cpm }: { cpm: number }) {
  const [raw, setRaw] = useState("1200000");
  const views = Math.max(0, Number(raw.replace(/[^\d]/g, "")) || 0);

  const monthly = useMemo(() => (views / 1000) * cpm * CREATOR_SHARE, [views, cpm]);
  const best = useMemo(() => Math.max(...SEASONS.map((s) => s.mult)), []);

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(100deg,#fdeef3_0%,#fde7ee_45%,#fcd8df_100%)]">
      <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-white/40 blur-3xl" aria-hidden />
      <div className="section-full relative mx-auto max-w-[1180px] py-10 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-yt-red px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white">
                New
              </span>
              <h2 className="text-[19px] font-extrabold tracking-tight text-heading sm:text-[21px]">
                Check Any YouTube Channel&apos;s <span className="text-yt-red">Estimated Earnings</span>
              </h2>
            </div>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[#5b6b80]">
              Enter a channel&apos;s monthly views to get estimated earnings, a yearly projection and the
              RPM benchmark it should be hitting.
            </p>

            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                document.getElementById("channel-result")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }}
            >
              <span className="relative flex-1">
                <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  inputMode="numeric"
                  value={raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  onChange={(e) => setRaw(e.target.value.replace(/[^\d]/g, "").slice(0, 12))}
                  placeholder="e.g. 1,200,000 monthly views"
                  aria-label="Channel monthly views"
                  className="field h-[46px] !rounded-lg pl-10"
                />
              </span>
              <button
                type="submit"
                className="hot-gradient inline-flex h-[46px] items-center justify-center gap-2 rounded-lg px-6 text-[13.5px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(238,18,73,0.7)] transition-transform hover:scale-[1.02]"
              >
                <Search className="h-4 w-4" /> Check Channel <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-2 text-[11.5px] text-[#7c8a9c]">
              We never query YouTube&apos;s API — the estimate comes from the view count you enter.
            </p>
          </div>

          {/* Result card */}
          <div id="channel-result" className="rounded-2xl border border-white/70 bg-white p-4 shadow-[0_18px_44px_-24px_rgba(11,22,38,0.35)] sm:p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#94a3b8]" fill="currentColor" aria-hidden>
                  <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-extrabold text-heading">Your channel estimate</p>
                <p className="truncate text-[11.5px] text-[#7c8a9c]">based on {num(views)} monthly views</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { k: "Monthly", v: money(monthly) },
                { k: "Yearly", v: money(monthly * 12) },
                { k: "Best Q4", v: money(monthly * best) },
              ].map((s, i) => (
                <motion.div
                  key={s.k}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}
                  className="rounded-lg bg-surface px-2.5 py-2"
                >
                  <p className="num-mono truncate text-[15px] font-extrabold leading-tight text-heading">{s.v}</p>
                  <p className="mt-0.5 text-[10.5px] font-semibold text-[#7c8a9c]">{s.k}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-3 flex items-end gap-1.5">
              {SEASONS.map((s) => (
                <div key={s.q} className="flex-1">
                  <div
                    className={`w-full rounded-t-[3px] ${s.q === "Q4" ? "bg-[#22c55e]" : "bg-[#86efac]"}`}
                    style={{ height: `${28 + s.mult * 34}px` }}
                    aria-hidden
                  />
                  <p className="mt-1 text-center text-[10px] font-semibold text-[#7c8a9c]">{s.q}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
