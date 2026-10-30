import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/cms/posts";
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/lib/cms/media-config";
import { SITE_URL } from "@/lib/editorial";

export const dynamic = "force-dynamic";

/**
 * The per-post social card.
 *
 * Every published article gets a card built from its own title, category and
 * focus keyword, so a link to the blog never shows the generic site card.
 * An author can still override this by uploading their own image in the CMS
 * — that upload then becomes the og:image instead.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  const title = post?.title ?? "YouTube CPM & RPM guides";
  const category = post?.category ?? "YouTube earnings";
  const keyword = post?.focusKeyword ?? "youtube cpm and rpm";
  const label = "ytcpm.online";

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
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#d90000",
              color: "#ffffff",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            CPM
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#0f0f0f" }}>{label}</div>
            <div style={{ display: "flex", fontSize: 20, color: "#606060" }}>{category}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 62, fontWeight: 700, color: "#0f0f0f", lineHeight: 1.15 }}>{title}</div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 26, color: "#444444" }}>{keyword}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", padding: "14px 24px", borderRadius: 14, background: "#ffffff", border: "1px solid #f0caca", fontSize: 22, color: "#d90000", fontWeight: 700 }}>
            Practical, source-linked guides
          </div>
          <div style={{ display: "flex", fontSize: 20, color: "#606060" }}>{SITE_URL.replace("https://", "")}</div>
        </div>
      </div>
    ),
    {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
