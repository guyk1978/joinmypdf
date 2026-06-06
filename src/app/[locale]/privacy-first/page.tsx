import type { Metadata } from "next";
import type { ReactNode } from "react";
export const runtime = "edge";
import Link from "next/link";
import { Check, Globe, Lock, Shield, X } from "lucide-react";
import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { JsonLd, faqLd } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy First — Private PDF Tools & Secure Processing",
  description:
    "JoinMyPDF runs private PDF tools in your browser. No-upload PDF editing: merge, redact, flatten, and more—files never leave your device. Secure PDF processing without server uploads.",
  keywords: [
    "private pdf tools",
    "secure pdf processing",
    "no-upload pdf editor",
    "client-side pdf",
    "browser pdf privacy",
  ],
  alternates: { canonical: "/privacy-first/" },
  openGraph: {
    title: "Privacy First — Our Promise | JoinMyPDF",
    description:
      "No files are ever uploaded to our servers—everything stays on your device. Compare local PDF tools vs typical upload-based sites.",
    url: absoluteUrl("/privacy-first/"),
  },
};

const COMPARISON_ROWS = [
  {
    topic: "How your PDF is processed",
    typical: "Server-side — file upload to remote infrastructure",
    joinmypdf: "Client-side — processing in your browser only",
  },
  {
    topic: "File upload",
    typical: "Required for most operations",
    joinmypdf: "No upload — bytes stay on your device",
  },
  {
    topic: "Data storage",
    typical: "Often retained on servers (hours to days)",
    joinmypdf: "No PDF storage on JoinMyPDF servers",
  },
  {
    topic: "Privacy model",
    typical: "Trust the vendor’s policy",
    joinmypdf: "Private, local, verifiable in DevTools",
  },
  {
    topic: "Best for sensitive docs",
    typical: "Depends on vendor compliance",
    joinmypdf: "Financial, medical, legal, and personal files",
  },
] as const;

const PRIVACY_TOOLS = [
  { slug: "redact-pdf", label: "Redact PDF" },
  { slug: "remove-hidden-metadata", label: "Remove Metadata" },
  { slug: "flatten-pdf", label: "Flatten PDF" },
  { slug: "safe-to-share-auditor", label: "Safe-to-Share Auditor" },
  { slug: "protect-pdf", label: "Protect PDF" },
  { slug: "compare-pdf", label: "Compare PDFs" },
] as const;

const USE_CASES = [
  {
    title: "Financial",
    body: "Statements, tax packets, and payroll exports stay on the accountant’s laptop—not a stranger’s cloud queue.",
  },
  {
    title: "Medical",
    body: "Clinical summaries and insurance forms benefit from local redaction and metadata cleaning before fax or portal upload.",
  },
  {
    title: "Legal",
    body: "Contracts, exhibits, and discovery subsets can be merged, compared, and redacted without a third-party copy.",
  },
  {
    title: "Personal",
    body: "IDs, leases, and school records are poor candidates for random “free PDF” upload sites.",
  },
] as const;

const FAQ = [
  {
    q: "Are PDF files uploaded to JoinMyPDF?",
    a: "Standard tools process PDFs locally in your browser. No file bytes are sent to our servers to run merge, redact, compress, or similar operations.",
  },
  {
    q: "How can I verify that myself?",
    a: "Open DevTools → Network, run a tool, and confirm you do not see your PDF uploaded to JoinMyPDF domains. Processing should show local scripts (pdf.js, pdf-lib) running in the tab.",
  },
  {
    q: "Is this the same as the Privacy Policy page?",
    a: "This page explains why local processing matters. The Privacy Policy covers analytics, cookies, and legal terms.",
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

function JoinCell({ children }: { children: ReactNode }) {
  return (
    <td className="border-b border-slate-100 bg-emerald-50/50 p-4 align-top text-slate-800 dark:border-slate-800/60 dark:bg-emerald-950/20 dark:text-slate-200 md:p-5">
      <span className="flex items-start gap-2.5">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.5} aria-hidden />
        <span className="font-medium">{children}</span>
      </span>
    </td>
  );
}

function TrustCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{children}</p>
    </article>
  );
}

export default function PrivacyFirstPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Privacy First — JoinMyPDF",
          description:
            "Private PDF tools with client-side processing. No-upload secure PDF editing in your browser.",
          url: absoluteUrl("/privacy-first/"),
        }}
      />
      <JsonLd data={faqLd([...FAQ])} />
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-blue-50 px-6 py-12 text-center shadow-sm dark:border-emerald-500/20 dark:from-emerald-950/40 dark:via-slate-900 dark:to-blue-950/30 md:px-12 md:py-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Our privacy promise
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl lg:text-5xl">
            Privacy First
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-700 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white">
              No files are ever uploaded to our servers—everything stays on your device.
            </strong>
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            JoinMyPDF is built for private PDF tools and secure processing without the upload step every other
            “online PDF” site requires.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/tools/"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              Browse private PDF tools
            </Link>
            <Link
              href="/privacy/"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Privacy Policy
            </Link>
          </div>
        </section>

        <section className="mt-14 grid gap-6 md:grid-cols-3">
          <TrustCard icon={<Lock className="h-6 w-6" aria-hidden />} title="Local by design">
            Core tools use <strong>client-side processing</strong>: pdf.js reads your file in the tab, and pdf-lib
            writes the output locally. We do not need your document on a server to merge, redact, or resize it.
          </TrustCard>
          <TrustCard icon={<Shield className="h-6 w-6" aria-hidden />} title="Not just marketing">
            Privacy here is a <strong>technical fact</strong>, not a slogan. When processing runs in the browser,
            there is no server-side file path to breach for that job.
          </TrustCard>
          <TrustCard icon={<Globe className="h-6 w-6" aria-hidden />} title="You can verify">
            Open <strong>DevTools → Network</strong>, run any tool, and watch for yourself: your PDF should not
            upload to JoinMyPDF. That is the same check security reviewers use for local-first apps.
          </TrustCard>
        </section>

        <section className="mt-16 space-y-6" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-2xl font-bold text-slate-900 dark:text-white">
            How client-side PDF processing works
          </h2>
          <div className="space-y-4 text-slate-700 dark:text-slate-300">
            <p>
              Traditional “PDF online tools” ask you to <strong>upload</strong> a file. Their servers convert it,
              store it temporarily, and send back a download link. Your data crosses the internet twice and sits on
              hardware you do not control.
            </p>
            <p>
              JoinMyPDF flips the model: the website delivers JavaScript; <strong>your browser does the work</strong>.
              You pick a file from disk, the tab processes it, and you save the result—like desktop software, without
              an install.
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-sm md:text-base">
              <li>You select a PDF (it stays in browser memory on your device).</li>
              <li>Tools load pdf.js / pdf-lib and run the operation locally.</li>
              <li>You download the new PDF from a blob URL—no server copy of your document.</li>
            </ol>
          </div>
        </section>

        <section className="mt-16 space-y-6" aria-labelledby="comparison">
          <h2 id="comparison" className="text-2xl font-bold text-slate-900 dark:text-white">
            JoinMyPDF vs typical online PDF tools
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-900 dark:bg-slate-800/80 dark:text-slate-200">
                <tr>
                  <th className="p-4 font-semibold md:p-5">Topic</th>
                  <th className="p-4 font-semibold md:p-5">Typical PDF online tools</th>
                  <th className="bg-emerald-50/60 p-4 font-extrabold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 md:p-5">
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
                    <JoinCell>{row.joinmypdf}</JoinCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16 space-y-6" aria-labelledby="use-cases">
          <h2 id="use-cases" className="text-2xl font-bold text-slate-900 dark:text-white">
            Built for sensitive documents
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {USE_CASES.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 space-y-6" aria-labelledby="privacy-tools">
          <h2 id="privacy-tools" className="text-2xl font-bold text-slate-900 dark:text-white">
            Privacy in practice — our tools
          </h2>
          <p className="text-slate-700 dark:text-slate-300">
            These workflows show how local processing helps you ship documents safely:
          </p>
          <CompactToolCardGrid
            items={PRIVACY_TOOLS.map((t) => ({
              href: `/tools/${t.slug}/`,
              label: t.label,
              slugHint: t.slug,
            }))}
          />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Explore the full directory on{" "}
            <Link href="/tools/" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
              All PDF tools
            </Link>{" "}
            or read the{" "}
            <Link
              href="/privacy-first-pdf-tools/"
              className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
            >
              privacy-first PDF hub
            </Link>
            .
          </p>
        </section>

        <section className="mt-16 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Questions</h2>
          <div className="mt-4 space-y-2">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <summary className="cursor-pointer font-medium text-slate-900 dark:text-white">{f.q}</summary>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
