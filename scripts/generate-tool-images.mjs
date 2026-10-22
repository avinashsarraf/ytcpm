/** Original first-party formula artwork. Re-run when the tool registry changes. */
import fs from 'node:fs/promises';
import sharp from 'sharp';
const tools = [
  ['youtube-shorts-earnings-calculator', 'Shorts Earnings', 'Engaged views / 1,000 x RPM', ['Engaged views', 'Creator RPM', 'Revenue scenario']],
  ['youtube-views-to-money-calculator', 'Views to Money', 'Views / 1,000 x creator RPM', ['Matching views', 'Creator RPM', 'Revenue scenario']],
  ['youtube-revenue-goal-calculator', 'Revenue Goal', 'Target / RPM x 1,000', ['Revenue target', 'Expected RPM', 'Views needed']],
  ['youtube-cpm-to-rpm-calculator', 'CPM to RPM', 'CPM x impressions per view x share', ['Impression CPM', 'Ad density + share', 'Ad-only RPM']],
  ['youtube-sponsorship-calculator', 'Sponsorship Quote', 'Views / 1,000 x sponsor CPM + fees', ['Expected views', 'CPM + scope fees', 'Proposed quote']],
  ['youtube-engagement-rate-calculator', 'Engagement Rate', '(Likes + comments) / views x 100', ['Likes + comments', 'Matching views', 'Interaction rate']],
  ['youtube-watch-time-calculator', 'Watch Time', 'Views x average minutes / 60', ['Video views', 'Average duration', 'Watch hours']],
];
await fs.mkdir('public/images/tools', { recursive: true });
for (const [slug, title, formula, labels] of tools) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#fff0f4"/><stop offset="1" stop-color="#f0faf7"/></linearGradient></defs><rect width="1200" height="630" rx="28" fill="url(#bg)"/><circle cx="1110" cy="45" r="160" fill="#ee1249" opacity=".05"/><text x="64" y="75" font-family="sans-serif" font-size="24" font-weight="700" fill="#d31645">ytcpm.online / CREATOR TOOLS</text><text x="64" y="185" font-family="sans-serif" font-size="64" font-weight="700" fill="#152238">${title}</text><text x="64" y="242" font-family="sans-serif" font-size="28" fill="#53647a">${formula}</text>${labels.map((label, i) => `<rect x="${64 + i * 365}" y="310" width="340" height="158" rx="20" fill="white" stroke="#e2e5ec"/><circle cx="${104 + i * 365}" cy="352" r="17" fill="${i === 2 ? '#e7f8ef' : '#fff0f4'}"/><text x="${98 + i * 365}" y="359" font-family="sans-serif" font-size="19" font-weight="700" fill="${i === 2 ? '#147958' : '#d31645'}">${i + 1}</text><text x="${88 + i * 365}" y="413" font-family="sans-serif" font-size="24" font-weight="600" fill="#152238">${label}</text>`).join('')}<text x="64" y="560" font-family="sans-serif" font-size="23" fill="#53647a">Editable inputs. Clear formulas. No guaranteed outcomes.</text></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`public/images/tools/${slug}.png`);
}
console.log('Generated 7 original 1200×630 tool formula illustrations.');
