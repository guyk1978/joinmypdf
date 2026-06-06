import type { Metadata } from "next";
import type { ReactNode } from "react";
export { runtime } from "@/lib/cloudflare-runtime";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { WattQuickCrossLink } from "@/components/partner/WattQuickCrossLink";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "How JoinMyPDF compares",
  description:
    "A candid comparison: where JoinMyPDF wins on privacy and speed, and where larger suites still make sense.",
  alternates: { canonical: "/compare/" },
};

const COMPARISON_ROWS = [
  {
    topic: "Processing location",
    typical: "Files often leave your device.",
    joinmypdf: "Core tools run locally in the browser session.",
  },
  {
    topic: "Watermarks",
    typical: "Free tiers may add branding.",
    joinmypdf: "No watermark on standard outputs for supported flows.",
  },
  {
    topic: "Breadth",
    typical: "Huge matrices (OCR, e-sign, desktop).",
    joinmypdf: "Focused merge / split / compress / image conversion.",
  },
  {
    topic: "Best for",
    typical: "“Do everything” workflows with accounts.",
    joinmypdf: "Teams with strict data handling and one-off power users.",
  },
] as const;

function TypicalCell({ children }: { children: ReactNode }) {
  return (
    <td className="border-b border-slate-100 p-4 align-top text-slate-600 dark:border-slate-800/60 dark:text-slate-400 md:p-5">
      <span className="flex items-start gap-2.5">
        <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" strokeWidth={2.5} aria-hidden />
        <span>{children}</span>
      </span>
    </td>
  );
}

function JoinMyPdfCell({ children }: { children: ReactNode }) {
  return (
    <td className="border-b border-slate-100 bg-blue-50/40 p-4 align-top text-slate-800 dark:border-slate-800/60 dark:bg-blue-950/20 dark:text-slate-200 md:p-5">
      <span className="flex items-start gap-2.5">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.5} aria-hidden />
        <span className="font-medium">{children}</span>
      </span>
    </td>
  );
}

export default function ComparePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl space-y-10 px-4 py-10 md:px-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">How we compare</h1>
          <p className="text-slate-700 dark:text-slate-300">
            JoinMyPDF is not trying to clone every feature of giant PDF suites. We optimize for{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">privacy</span>,{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">predictable UX</span>, and{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">fast everyday jobs</span>.
          </p>
        </header>

        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-900 dark:bg-slate-800/80 dark:text-slate-200">
              <tr>
                <th className="p-4 font-semibold md:p-5">Topic</th>
                <th className="p-4 font-semibold md:p-5">Typical upload-based tools</th>
                <th className="bg-blue-50/40 p-4 font-extrabold text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 md:p-5">
                  JoinMyPDF
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child_td]:border-b-0">
              {COMPARISON_ROWS.map((row) => (
                  <tr key={row.topic}>
                    <td className="border-b border-slate-100 p-4 align-top font-semibold text-slate-900 dark:border-slate-800/60 dark:text-slate-100 md:p-5">
                      {row.topic}
                    </td>
                    <TypicalCell>{row.typical}</TypicalCell>
                    <JoinMyPdfCell>{row.joinmypdf}</JoinMyPdfCell>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>

        <WattQuickCrossLink />

        <p className="text-sm text-slate-700 dark:text-slate-300">
          Ready to try it?{" "}
          <Link href="/tools/pdf-merge/" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
            Open merge
          </Link>{" "}
          or read{" "}
          <Link
            href="/privacy-first-pdf-tools/"
            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            why local processing matters
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
