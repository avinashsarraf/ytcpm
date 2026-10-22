"use client";

import Image from "next/image";
import { useMemo } from "react";
import { Globe } from "lucide-react";
import { currencySymbol, type Country } from "@/lib/data";
import { flagUrl } from "@/lib/flags";
import SearchablePicker from "./searchable-picker";

export default function CountrySelector({ countries, value, onChange }: { countries: Country[]; value: Country; onChange: (slug: string) => void }) {
  const options = useMemo(() => countries.map(country => ({
    value: country.slug, label: country.name, keywords: `${country.code} ${country.currency} ${currencySymbol(country)}`,
    group: country.code === "WW" ? "worldwide" : String(country.tier),
    groupLabel: country.code === "WW" ? "Worldwide" : ["", "Tier 1 — Premium rates", "Tier 2 — Strong", "Tier 3 — Emerging", "Tier 4 — Volume"][country.tier],
    secondary: `${country.currency} · ${currencySymbol(country)}`,
    icon: country.code === "WW" ? <Globe className="h-5 w-5 text-fog" /> : <Image src={flagUrl(country.code)} alt={`${country.name} flag`} width={24} height={18} className="h-[18px] w-6 rounded-sm object-cover" />,
  })), [countries]);
  return <SearchablePicker label="Audience country" icon={<Globe className="h-4 w-4" />} options={options} value={value.slug} onChange={onChange} labelBadge={value.currency} searchLabel="Search countries" listLabel="Countries" dialogLabel="Choose audience country" closeLabel="Close country search" placeholder="Search country, code or currency…" emptyMessage="No countries found." hint="Results use the selected currency" />;
}
