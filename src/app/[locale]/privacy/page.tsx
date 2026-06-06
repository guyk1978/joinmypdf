import type { Metadata } from "next";
export const runtime = "edge";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { JsonLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy & security",
  description:
    "How JoinMyPDF handles files: local browser processing, no watermark on standard output, and clear expectations for sensitive documents.",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Privacy & security — JoinMyPDF",
          url: absoluteUrl("/privacy/"),
        }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 text-slate-700 dark:text-slate-300 md:px-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Privacy & security</h1>
        <p>
          JoinMyPDF is designed around <strong className="text-slate-900 dark:text-slate-100">local processing</strong>: merge, split, compress,
          and common conversions run in your browser session. Your files are not sent to JoinMyPDF servers to execute
          those operations.
        </p>
        <p>
          <strong className="text-slate-900 dark:text-slate-100">Downloads</strong> are generated on-device. Standard outputs from these tools are
          not watermarked by JoinMyPDF.
        </p>
        <p>
          <strong className="text-slate-900 dark:text-slate-100">Limits</strong> still apply: browser memory, device performance, and PDF
          protections (passwords, restrictions) can block some tasks. Very large files may fail on low-memory devices—
          split first, then process in batches.
        </p>
        <p>
          <strong className="text-slate-900 dark:text-slate-100">Analytics</strong> may collect usage signals (for example PostHog) to understand
          which tools help users succeed. Configure an ad/analytics blocker if your policy requires it.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
