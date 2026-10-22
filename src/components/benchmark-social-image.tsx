/** First-party social card shared by country/niche image routes. No external assets. */
export default function BenchmarkSocialImage({ name, kind, range, localRange }: { name: string; kind: "Country" | "Niche"; range: string; localRange: string }) {
  return <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: "56px 64px", background: "linear-gradient(130deg,#fff0f4,#fff 55%,#edf9f5)", color: "#18181f" }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#b80f3c" }}><span>ytcpm.online</span><span>{kind} planning model</span></div>
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}><span style={{ fontSize: 26, color: "#62626f" }}>YouTube CPM scenarios</span><span style={{ fontSize: name.length > 25 ? 54 : 68, fontWeight: 700, lineHeight: 1.1 }}>{name}</span></div>
    <div style={{ display: "flex", flexDirection: "column", gap: 14, border: "1px solid #e5e5eb", borderRadius: 22, padding: "28px 32px", background: "white" }}><span style={{ fontSize: 20, color: "#62626f" }}>MODELED ADVERTISER CPM · NOT LIVE RATES</span><span style={{ fontSize: 48, fontWeight: 700, color: "#087d61" }}>{range}</span><span style={{ fontSize: 23, color: "#62626f" }}>{localRange}</span></div>
    <span style={{ fontSize: 21, color: "#62626f" }}>Directional assumptions, not verified averages or payout promises.</span>
  </div>;
}
