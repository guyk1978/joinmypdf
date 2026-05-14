import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "How JoinMyPDF compares",
  description:
    "A candid comparison: where JoinMyPDF wins on privacy and speed, and where larger suites still make sense.",
  alternates: { canonical: "/compare/" },
};

export default function ComparePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl space-y-10 px-4 py-10 md:px-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-ink">How we compare</h1>
          <p className="text-ink-muted">
            JoinMyPDF is not trying to clone every feature of giant PDF suites. We optimize for{" "}
            <span className="text-ink">privacy</span>, <span className="text-ink">predictable UX</span>, and{" "}
            <span className="text-ink">fast everyday jobs</span>.
          </p>
        </header>

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Typical upload-based tools</th>
                <th className="px-4 py-3">JoinMyPDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-ink-muted">
              <tr>
                <td className="px-4 py-3 font-medium text-ink">Processing location</td>
                <td className="px-4 py-3">Files often leave your device.</td>
                <td className="px-4 py-3">Core tools run locally in the browser session.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-ink">Watermarks</td>
                <td className="px-4 py-3">Free tiers may add branding.</td>
                <td className="px-4 py-3">No watermark on standard outputs for supported flows.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-ink">Breadth</td>
                <td className="px-4 py-3">Huge matrices (OCR, e-sign, desktop).</td>
                <td className="px-4 py-3">Focused merge / split / compress / image conversion.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-ink">Best for</td>
                <td className="px-4 py-3">“Do everything” workflows with accounts.</td>
                <td className="px-4 py-3">Teams with strict data handling and one-off power users.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-sm text-ink-muted">
          Ready to try it? <Link href="/tools/pdf-merge/">Open merge</Link> or read{" "}
          <Link href="/privacy-first-pdf-tools/">why local processing matters</Link>.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
