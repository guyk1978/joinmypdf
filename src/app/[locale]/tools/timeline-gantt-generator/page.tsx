import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { TimelineGenerator } from "@/components/timeline/TimelineGenerator";
import { getBrandName } from "@/lib/brand";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Timeline & Gantt Chart Generator",
  description:
    "Build project timelines and Gantt charts in your browser. Add tasks, milestones, and dates—then download a landscape PDF. Nothing uploaded to our servers.",
  alternates: { canonical: "/tools/timeline-gantt-generator/" },
};

type PageProps = { params: Promise<{ locale: string }> };

export default async function TimelineGanttGeneratorPage({ params }: PageProps) {
  const { locale } = await params;
  const brand = getBrandName(locale);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: `${brand} Timeline & Gantt Chart Generator`,
          url: absoluteUrl("/tools/timeline-gantt-generator/"),
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web browser",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          description:
            "Client-side timeline and Gantt chart builder with live preview and landscape PDF export.",
        }}
      />
      <AppPageShell mainClassName="mx-auto max-w-7xl px-4 py-10 md:px-4 md:py-12">
        <div className="tools-directory-page">
          <h1 className="sr-only">Timeline &amp; Gantt Chart Generator</h1>
          <TimelineGenerator />
        </div>
      </AppPageShell>
    </>
  );
}
