import { COUNTRIES, NICHES, DATA_YEAR } from "@/lib/data";
import { CREATOR_TOOLS } from "@/lib/creator-tools";

/**
 * Image sitemap.
 *
 * The URL sitemap lists pages; this one lists the SEO images that belong to
 * them, with a title and a caption so image crawlers can index the asset
 * instead of only the page that links it. Only images that are actually
 * published and reachable are listed.
 */
const BASE = "https://ytcpm.online";

type ImageEntry = { loc: string; title: string; caption: string };

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function buildImages(): ImageEntry[] {
  const images: ImageEntry[] = [
    {
      loc: `${BASE}/opengraph-image`,
      title: `YouTube Earnings Calculator — CPM & RPM estimates (${DATA_YEAR})`,
      caption: "Social card for the ytcpm.online YouTube earnings calculator homepage.",
    },
    {
      loc: `${BASE}/channel-auditor/opengraph-image`,
      title: "YouTube Channel Auditor — free public channel audit",
      caption: "Social card for the free YouTube Channel Auditor, showing catalogue, keyword and modelled earnings coverage.",
    },
  ];

  for (const c of COUNTRIES) {
    images.push({
      loc: `${BASE}/cpm-by-country/${c.slug}/opengraph-image`,
      title: `YouTube CPM in ${c.name} — ${DATA_YEAR} model`,
      caption: `Model YouTube CPM and RPM scenarios for ${c.name} audiences, with local-currency conversions.`,
    });
  }

  for (const n of NICHES) {
    images.push({
      loc: `${BASE}/cpm-by-niche/${n.slug}/opengraph-image`,
      title: `${n.name} YouTube CPM model — ${DATA_YEAR}`,
      caption: `Model YouTube CPM and RPM for ${n.name.toLowerCase()} channels, with creator-share assumptions and limitations.`,
    });
  }

  for (const t of CREATOR_TOOLS) {
    images.push({
      loc: `${BASE}/images/tools/${t.slug}.png`,
      title: `${t.title} — free YouTube tool`,
      caption: t.shortTitle
        ? `Screenshot of the ${t.title.toLowerCase()} showing its editable inputs and result.`
        : `Screenshot of the ${t.title.toLowerCase()}.`,
    });
  }

  return images;
}

export const dynamic = "force-static";

export function GET() {
  const images = buildImages();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${images
  .map(
    (img) => `  <url>
    <loc>${escapeXml(img.loc)}</loc>
    <image:image>
      <image:loc>${escapeXml(img.loc)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
      <image:caption>${escapeXml(img.caption)}</image:caption>
    </image:image>
  </url>`,
  )
  .join("\n")}
</urlset>`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
