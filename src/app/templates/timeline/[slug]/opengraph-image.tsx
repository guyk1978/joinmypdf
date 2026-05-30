import { ImageResponse } from "next/og";
import {
  getTimelineTemplateBySlug,
  TIMELINE_TEMPLATE_PROFILES,
} from "@/lib/timeline/templates";

export const alt = "JoinMyPDF — free timeline & Gantt template preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return TIMELINE_TEMPLATE_PROFILES.map((profile) => ({ slug: profile.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = getTimelineTemplateBySlug(slug);
  const profession = profile?.professionLabel ?? "Professional";
  const headline = `Free ${profession} Timeline Template`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "56px 64px",
          background: "linear-gradient(145deg, #0b1220 0%, #101b33 48%, #0f172a 100%)",
          border: "2px solid rgba(56, 189, 248, 0.35)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid rgba(56, 189, 248, 0.4)",
              background: "rgba(56, 189, 248, 0.12)",
              color: "#38bdf8",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            JoinMyPDF
          </div>
          <div
            style={{
              display: "flex",
              color: "#64748b",
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            Timeline template
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            marginTop: 24,
            maxWidth: 980,
            flexGrow: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#38bdf8",
              fontSize: 24,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            100% client-side - no upload
          </div>
          <div
            style={{
              display: "flex",
              color: "#f8fafc",
              fontSize: 54,
              fontWeight: 800,
              lineHeight: 1.12,
            }}
          >
            {headline}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              color: "#94a3b8",
              fontSize: 30,
              lineHeight: 1.35,
              fontWeight: 500,
            }}
          >
            Interactive Gantt Chart and Schedule Builder
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginTop: 36,
              width: "100%",
            }}
          >
            {[72, 48, 88, 56].map((widthPct, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: 120,
                    height: 8,
                    borderRadius: 4,
                    background: "rgba(100, 116, 139, 0.35)",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    marginLeft: 16,
                    height: 14,
                    width: `${widthPct}%`,
                    maxWidth: 720,
                    borderRadius: 6,
                    background:
                      i === 0
                        ? "#38bdf8"
                        : i === 1
                          ? "#34d399"
                          : i === 2
                            ? "#a78bfa"
                            : "#f472b6",
                    opacity: 0.9,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", color: "#64748b", fontSize: 22 }}>
            joinmypdf.com/templates/timeline/{slug}/
          </div>
          <div
            style={{
              display: "flex",
              padding: "12px 22px",
              borderRadius: 12,
              background: "rgba(56, 189, 248, 0.2)",
              border: "1px solid rgba(56, 189, 248, 0.45)",
              color: "#e0f2fe",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            JoinMyPDF
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
