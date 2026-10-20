/** Country code → flag image URL via flagcdn.com (real flags, no emoji font issues). */
const CODE_MAP: Record<string, string> = {
  US: "us", AU: "au", NO: "no", CH: "ch", UK: "gb", NZ: "nz", SE: "se",
  DK: "dk", CA: "ca", NL: "nl", DE: "de", IE: "ie", FI: "fi", BE: "be",
  SG: "sg", FR: "fr", JP: "jp", KR: "kr", BR: "br", IN: "in", ID: "id",
  PK: "pk", BD: "bd",
};

export function flagUrl(code: string, size: "w40" | "w80" | "w160" = "w80"): string {
  const iso = CODE_MAP[code] ?? code.toLowerCase();
  return `https://flagcdn.com/${size}/${iso}.png`;
}
