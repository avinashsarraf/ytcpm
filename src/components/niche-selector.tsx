"use client";

import { Layers } from "lucide-react";
import { NICHES } from "@/lib/data";
import { NICHE_ICONS } from "@/lib/niche-icons";
import SearchablePicker from "./searchable-picker";

const options = ["S", "A", "B", "C"].flatMap(tier => NICHES.filter(n => n.tier === tier).map(niche => {
  const Icon = NICHE_ICONS[niche.icon] ?? Layers;
  const higher = niche.tier === "S" || niche.tier === "A";
  return { value: niche.slug, label: niche.name, keywords: `${niche.slug.replaceAll("-", " ")} ${niche.tier} tier`, icon: <Icon className="h-4 w-4 text-yt-red" />, group: higher ? "higher" : "lower", groupLabel: higher ? "S & A tier — higher model CPM" : "B & C tier — lower model CPM", badge: niche.tier };
}));
export default function NicheSelector({ value, onChange }: { value: string; onChange: (slug: string) => void }) {
  return <SearchablePicker label="Channel niche" icon={<Layers className="h-4 w-4" />} options={options} value={value} onChange={onChange} searchLabel="Search niches" listLabel="Niches" dialogLabel="Choose channel niche" closeLabel="Close niche search" placeholder="Search gaming, finance, technology…" emptyMessage="No niches found." hint="Model groups, not guaranteed rates" labelBadge="18 niches" />;
}
