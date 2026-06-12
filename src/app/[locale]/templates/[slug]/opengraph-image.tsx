import { ImageResponse } from "next/og";
import { routing } from "@/i18n/routing";
import { getInvoiceTemplateBySlug, INVOICE_TEMPLATE_PROFILES } from "@/lib/invoice/templates";

export const dynamic = "force-static";

export const alt = "JoinMyPDF — free invoice template preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    INVOICE_TEMPLATE_PROFILES.map((profile) => ({ locale, slug: profile.slug })),
  );
}

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const profile = getInvoiceTemplateBySlug(slug);
  const profession = profile?.professionLabel ?? "Professional";
  const headline = `Free ${profession} Invoice Template`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "56px 64px",
          background: "linear-gradient(145deg, #0b1220 0%, #101b33 48%, #0a0a0a 100%)",
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
              color: "#404040",
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            Invoice template
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
              fontSize: 58,
              fontWeight: 800,
              lineHeight: 1.15,
            }}
          >
            {headline}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              color: "#a3a3a3",
              fontSize: 30,
              lineHeight: 1.4,
              fontWeight: 500,
            }}
          >
            Generate and download client-side PDFs instantly
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
          <div style={{ display: "flex", color: "#404040", fontSize: 22 }}>
            joinmypdf.com/templates/{slug}/
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
            Edit - Preview - Download PDF
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
