import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { NICHES, getNiche } from "@/lib/data";
import BenchmarkSocialImage from "@/components/benchmark-social-image";
export const alt = "YouTube niche CPM model range for US-audience advertising scenarios";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export function generateStaticParams() { return NICHES.map(n => ({ slug: n.slug })); }
export default async function NicheImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const niche = getNiche(slug); if (!niche) notFound();
  return new ImageResponse(<BenchmarkSocialImage name={niche.name} kind="Niche" range={`$${niche.cpmLow}–$${niche.cpmHigh} USD`} localRange="US audience · Per 1,000 ad impressions · Not a sponsorship quote" />, size);
}
