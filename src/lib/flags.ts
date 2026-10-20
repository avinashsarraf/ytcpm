/** Self-hosted flag-icons SVGs (MIT). See public/flags/LICENSE.txt. */
const CODE_MAP: Record<string, string> = {
  US: "us", AU: "au", NO: "no", CH: "ch", UK: "gb", NZ: "nz", SE: "se",
  DK: "dk", CA: "ca", NL: "nl", DE: "de", IE: "ie", FI: "fi", BE: "be",
  SG: "sg", FR: "fr", JP: "jp", KR: "kr", BR: "br", IN: "in", ID: "id",
  PK: "pk", BD: "bd",
};

export function flagUrl(code: string): string {
  const iso = CODE_MAP[code] ?? code.toLowerCase();
  return `/flags/${iso}.svg`;
}
