"use client";

import { useCallback, useState } from "react";
import type { InvoiceDocument } from "@/lib/invoice/types";
import { createDefaultInvoiceDocument } from "@/lib/invoice/defaults";
import { INVOICE_PRINT_ROOT_ID } from "@/lib/invoice/constants";
import { exportInvoiceElementToPdf } from "@/lib/invoice/export-pdf";
import { InvoiceFormPanel } from "@/components/invoice/InvoiceFormPanel";
import { InvoicePreviewPanel } from "@/components/invoice/InvoicePreviewPanel";

type InvoiceGeneratorProps = {
  initialDocument?: InvoiceDocument;
  templateSlug?: string;
};

export async function handleInvoiceDownload(document: InvoiceDocument): Promise<void> {
  const root = window.document.getElementById(INVOICE_PRINT_ROOT_ID);
  if (!root) {
    throw new Error("Invoice preview is not ready. Try again in a moment.");
  }
  await exportInvoiceElementToPdf(root, document);
}

export function InvoiceGenerator({ initialDocument, templateSlug }: InvoiceGeneratorProps) {
  const [document, setDocument] = useState<InvoiceDocument>(
    () => initialDocument ?? createDefaultInvoiceDocument(),
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const onDownload = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setStatus("Generating PDF…");
    try {
      await handleInvoiceDownload(document);
      setStatus("PDF downloaded.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "PDF export failed.";
      setStatus(message);
      console.error("[InvoiceGenerator]", err);
    } finally {
      setBusy(false);
    }
  }, [busy, document]);

  return (
    <div className="invoice-generator-workspace space-y-2">
      {templateSlug ? (
        <p className="border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-400">
          Template loaded for{" "}
          <span className="font-medium text-neutral-200">{templateSlug.replace(/-/g, " ")}</span> — edit any
          field before you download.
        </p>
      ) : null}
      {status ? (
        <p className="text-sm text-neutral-400" aria-live="polite">
          {status}
        </p>
      ) : null}
      <div className="grid gap-2 lg:grid-cols-12 lg:items-start">
        <section className="border border-neutral-800 bg-neutral-900 p-4 lg:col-span-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <InvoiceFormPanel
            document={document}
            onChange={setDocument}
            onDownload={onDownload}
            downloadBusy={busy}
          />
        </section>
        <section className="min-h-[420px] border border-neutral-800 bg-neutral-900 p-4 lg:col-span-8 lg:min-h-[calc(100vh-6rem)]">
          <InvoicePreviewPanel document={document} />
        </section>
      </div>
    </div>
  );
}
