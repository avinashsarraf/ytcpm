import { ImageResponse } from "next/og";
export const alt = "YouTube Channel Auditor — audit any public channel for categories, keywords, top videos and modeled CPM/RPM scenarios";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ROWS = [
  { label: "Category & playlists", value: "Public" },
  { label: "Tags & keywords", value: "Inferred" },
  { label: "CPM / RPM scenarios", value: "Estimated" },
];

export default function ChannelAuditorImage() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: "60px 68px", background: "linear-gradient(128deg,#fff0f4 0%,#ffffff 52%,#eef8f4 100%)", color: "#18181f", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 62, height: 62, borderRadius: 18, background: "#d90000", color: "#ffffff", fontSize: 30, fontWeight: 700 }}>▶</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 28, fontWeight: 700 }}>ytcpm.online</span>
              <span style={{ fontSize: 19, color: "#62626f" }}>Channel Auditor · free tool</span>
            </div>
          </div>
          <span style={{ fontSize: 20, color: "#b80f3c" }}>Public data only</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <span style={{ fontSize: 26, color: "#62626f" }}>Audit any public YouTube channel</span>
          <span style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.08 }}>Categories, keywords, top videos &amp; modeled revenue</span>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {ROWS.map((row) => (
            <div key={row.label} style={{ display: "flex", flexDirection: "column", padding: "16px 26px", borderRadius: 16, background: "#ffffff", border: "1px solid #e5e5eb", minWidth: 240 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: "#c91043" }}>{row.value}</span>
              <span style={{ fontSize: 19, color: "#62626f" }}>{row.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
