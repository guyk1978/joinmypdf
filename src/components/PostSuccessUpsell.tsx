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
  } else if (operation === "crop-pdf") {
    rows.push({
      href: "/tools/add-watermark/",
      title: "Add a draft watermark",
      body: "Stamp CONFIDENTIAL or DRAFT before sharing the cropped PDF.",
    });
    rows.push({
      href: "/tools/pdf-compress/",
      title: "Compress for email",
      body: "Shrink the cropped file if attachment limits are tight.",
    });
  } else if (operation === "add-watermark") {
    rows.push({
      href: "/tools/protect-pdf/",
      title: "Password-protect the file",
      body: "Lock watermarked PDFs before sending them externally.",
    });
    rows.push({
      href: "/tools/pdf-compress/",
      title: "Compress for sharing",
      body: "Reduce file size after stamping every page.",
    });
  } else if (operation === "rotate-pdf") {
    rows.push({
      href: "/tools/crop-pdf/",
      title: "Trim margins next",
      body: "After orientation is fixed, crop white borders for cleaner pages.",
    });
    rows.push({
      href: "/tools/add-watermark/",
      title: "Mark drafts clearly",
      body: "Stamp DRAFT or CONFIDENTIAL before sharing corrected files.",
    });
  } else if (operation === "autocad-to-pdf") {
    rows.push({
      href: "/tools/crop-pdf/",
      title: "Trim blueprint margins",
      body: "Crop excess border space from the exported PDF before printing or sharing.",
    });
    rows.push({
      href: "/tools/pdf-compress/",
      title: "Compress for email",
      body: "Shrink large vector blueprint PDFs when attachment limits are tight.",
    });
  } else if (operation === "openoffice-to-pdf") {
    rows.push({
      href: "/tools/pdf-compress/",
      title: "Compress for email",
      body: "Shrink the exported PDF if attachment limits are tight.",
    });
    rows.push({
      href: "/tools/word-to-pdf/",
      title: "Converting Word files?",
      body: "Use Word to PDF for .docx documents from Microsoft Office.",
    });
  } else if (operation === "add-page-numbers") {
    rows.push({
      href: "/tools/protect-pdf/",
      title: "Protect the numbered PDF",
      body: "Add a password before sharing numbered drafts externally.",
    });
    rows.push({
      href: "/tools/pdf-compress/",
      title: "Compress for email",
      body: "Shrink the file if numbering pushed it over attachment limits.",
    });
  } else if (operation === "delete-pages") {
    rows.push({
      href: "/tools/pdf-merge/",
      title: "Combine trimmed pages",
      body: "Merge the cleaned PDF with other documents into one final package.",
    });
    rows.push({
      href: "/tools/pdf-compress/",
      title: "Compress before sending",
      body: "Shrink the file if email or a portal has size limits.",
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
  } else if (operation === "unlock") {
    rows.push({
      href: "/tools/protect-pdf/",
      title: "Re-lock with a new password",
      body: "After editing, protect the final PDF again before sharing.",
    });
    rows.push({
      href: "/tools/pdf-compress/",
      title: "Compress the unlocked file",
      body: "Smaller attachments are easier to email after you remove the password.",
    });
  } else if (operation === "sign") {
    rows.push({
      href: "/tools/protect-pdf/",
      title: "Password-protect the signed PDF",
      body: "Lock the signed document before emailing it to clients.",
    });
    rows.push({
      href: "/tools/pdf-compress/",
      title: "Compress for sending",
      body: "Shrink the signed file if it is too large for your inbox.",
    });
  } else if (operation === "redact") {
    rows.push({
      href: "/tools/protect-pdf/",
      title: "Password-protect before sending",
      body: "After redacting, add a password before you email the sanitized PDF.",
    });
    rows.push({
      href: "/tools/pdf-compress/",
      title: "Compress the redacted file",
      body: "Flattened pages can increase file size—compress if needed for upload limits.",
    });
  } else if (operation === "png-to-pdf") {
    rows.push({
      href: "/tools/pdf-compress/",
      title: "Compress the PDF",
      body: "Large PNG exports can produce big PDFs—compress before emailing.",
    });
    rows.push({
      href: "/tools/jpg-to-pdf/",
      title: "Also have JPG photos?",
      body: "Convert JPEG screenshots with our JPG → PDF tool.",
    });
  } else if (operation === "heic-to-pdf") {
    rows.push({
      href: "/tools/jpg-to-pdf/",
      title: "Have JPG photos too?",
      body: "Combine JPEG camera exports with our JPG → PDF tool.",
    });
    rows.push({
      href: "/tools/pdf-compress/",
      title: "Compress the PDF",
      body: "Shrink large photo PDFs before email or upload limits.",
    });
  } else if (operation === "pdf-to-png") {
    rows.push({
      href: "/tools/png-to-pdf/",
      title: "Need PNG back in a PDF?",
      body: "Combine exported PNGs into one document with PNG → PDF.",
    });
    rows.push({
      href: "/tools/pdf-to-jpg/",
      title: "Prefer smaller JPG files?",
      body: "Use PDF → JPG when file size matters more than lossless quality.",
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
