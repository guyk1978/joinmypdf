"use client";

import Link from "next/link";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { CalnexAppCrossLink } from "@/components/partner/CalnexAppCrossLink";

type Props = {
  operation: string;
};

export function PostSuccessUpsell({ operation }: Props) {
  const rows: { href: string; title: string; body: string }[] = [];
  if (operation === "merge") {
    rows.push({
      href: "/tools/pdf-compress/",
      title: "Tighten file size next",
      body: "If email or a portal rejected the attachment, compress before you resend.",
    });
    rows.push({
      href: "/tools/pdf-split/",
      title: "Only need a few pages?",
      body: "Split first, then merge the pieces you actually want in the final pack.",
    });
  } else if (operation === "compress") {
    rows.push({
      href: "/tools/pdf-merge/",
      title: "Bundling multiple PDFs?",
      body: "Merge related PDFs first, then compress the combined file for one clean attachment.",
    });
  } else if (operation === "split") {
    rows.push({
      href: "/tools/pdf-merge/",
      title: "Recombine later",
      body: "Split for review rounds, then merge approved pages back into a single deliverable.",
    });
  } else if (operation === "protect") {
    rows.push({
      href: "/tools/pdf-compress/",
      title: "Shrink before you send",
      body: "After protecting, compress if the encrypted file is still too large for email.",
    });
    rows.push({
      href: "/tools/pdf-merge/",
      title: "Bundle first, then lock",
      body: "Merge related PDFs, then password-protect the final package in one pass.",
    });
  } else if (operation === "jpg-to-pdf" || operation === "pdf-to-jpg") {
    rows.push({
      href: "/tools/pdf-compress/",
      title: "Optimize for sharing",
      body: "Compress when your new PDF is close to mailbox or upload limits.",
    });
  }

  if (!rows.length) return null;

  return (
    <div className="mt-6 space-y-4">
      <aside className="rounded-2xl border border-brand/30 bg-brand/5 p-4">
        <p className="text-sm font-semibold text-ink">Suggested next step</p>
        <ul className="mt-3 space-y-3">
          {rows.map((r) => (
            <li key={r.href}>
              <Link
                href={r.href}
                onClick={() => capture(EVENTS.upsell_click, { target: r.href, from: operation })}
                className="block rounded-xl border border-white/10 bg-surface/60 p-3 transition hover:border-brand/50"
              >
                <span className="font-medium text-brand">{r.title}</span>
                <p className="mt-1 text-sm text-ink-muted">{r.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <CalnexAppCrossLink />
    </div>
  );
}
