import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { COUNTRIES, getCountry } from "@/lib/data";
import BenchmarkSocialImage from "@/components/benchmark-social-image";
export const alt = "YouTube country CPM planning scenarios with indicative currency conversion";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export function generateStaticParams() { return COUNTRIES.map(c => ({ slug: c.slug })); }
export default async function CountryImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const country = getCountry(slug); if (!country) notFound();
  return new ImageResponse(<BenchmarkSocialImage name={country.name} kind="Country" range={`$${country.cpmLow}–$${country.cpmHigh} USD`} localRange={country.currency === "USD" ? "Per 1,000 ad impressions · Audience country, not creator residence" : `Approx. ${country.currency} ${(country.cpmLow * country.fx).toLocaleString("en-US", { maximumFractionDigits: 2 })}–${(country.cpmHigh * country.fx).toLocaleString("en-US", { maximumFractionDigits: 2 })} · FX is not live`} />, size);
}
