import Link from "next/link";
import { ArrowRight, Compass, Globe2, Layers } from "lucide-react";

export default function NotFound() {
  return (
    <section className="relative overflow-hidden pt-32 sm:pt-40">
      <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 blob-pink" aria-hidden />
      <div className="relative mx-auto max-w-2xl px-4 pb-16 text-center sm:px-6">
        <p className="num-mono text-sm font-bold text-yt-red">404</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-heading sm:text-5xl">
          That page isn&apos;t here
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-fog">
          The link may be outdated, or the country/niche slug might be wrong. Try one of these instead.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Link href="/" className="panel panel-lift p-5 text-left">
            <Compass className="h-4 w-4 text-yt-red" />
            <p className="mt-2 text-sm font-bold text-heading">Calculator</p>
            <p className="text-xs text-fog">Estimate your earnings</p>
          </Link>
          <Link href="/cpm-by-country" className="panel panel-lift p-5 text-left">
            <Globe2 className="h-4 w-4 text-yt-red" />
            <p className="mt-2 text-sm font-bold text-heading">CPM by country</p>
            <p className="text-xs text-fog">23 markets compared</p>
          </Link>
          <Link href="/cpm-by-niche" className="panel panel-lift p-5 text-left">
            <Layers className="h-4 w-4 text-yt-red" />
            <p className="mt-2 text-sm font-bold text-heading">CPM by niche</p>
            <p className="text-xs text-fog">18 niches ranked</p>
          </Link>
        </div>

        <Link href="/#calculator" className="group mt-8 inline-flex items-center gap-2 rounded-full bg-yt-red px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-yt-red-hover">
          Back to the calculator <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
