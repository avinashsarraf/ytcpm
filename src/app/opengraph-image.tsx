import { ImageResponse } from "next/og";
import { COUNTRIES, NICHES, DATA_YEAR, US_BLENDED_CPM } from "@/lib/data";

export const alt = "YouTube CPM Calculator — CPM and RPM rates by country and niche";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STATS = [
  { label: "Countries", value: String(COUNTRIES.length) },
  { label: "Niches", value: String(NICHES.length) },
  { label: "US blended CPM", value: `$${US_BLENDED_CPM}` },
  { label: "Currencies", value: String(COUNTRIES.length) },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #ffffff 0%, #fff0f0 55%, #ffe0e0 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 76,
              height: 76,
              borderRadius: 20,
              background: "#d90000",
              color: "#ffffff",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            CPM
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#0f0f0f" }}>ytcpm.online</div>
            <div style={{ display: "flex", fontSize: 20, color: "#606060" }}>{DATA_YEAR} benchmark data</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 74, fontWeight: 700, color: "#0f0f0f", lineHeight: 1.1 }}>
            YouTube CPM Calculator
          </div>
          <div style={{ display: "flex", marginTop: 16, fontSize: 30, color: "#444444" }}>
            Estimate earnings per 1,000 views in your local currency
          </div>
        </div>

        <div style={{ display: "flex", gap: 18 }}>
          {STATS.map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "16px 26px",
                borderRadius: 16,
                background: "#ffffff",
                border: "1px solid #f0caca",
              }}
            >
              <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#d90000" }}>{item.value}</div>
              <div style={{ display: "flex", fontSize: 18, color: "#606060" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
