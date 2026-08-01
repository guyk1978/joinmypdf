"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import type { InvoiceDocument } from "@/lib/invoice/types";
import { createDefaultInvoiceDocument } from "@/lib/invoice/defaults";
import { INVOICE_PRINT_ROOT_ID } from "@/lib/invoice/constants";
import { exportInvoiceElementToPdf } from "@/lib/invoice/export-pdf";
import { InvoiceFormPanel } from "@/components/invoice/InvoiceFormPanel";
import { InvoicePreviewPanel } from "@/components/invoice/InvoicePreviewPanel";
import { matteWorkspaceBanner, matteWorkspaceSection } from "@/lib/tool-ui";

type InvoiceGeneratorProps = {
  initialDocument?: InvoiceDocument;
  templateSlug?: string;
  previewAlt?: string;
};

export async function handleInvoiceDownload(document: InvoiceDocument): Promise<void> {
  const root = window.document.getElementById(INVOICE_PRINT_ROOT_ID);
  if (!root) {
    throw new Error("Invoice preview is not ready. Try again in a moment.");
  }
  await exportInvoiceElementToPdf(root, document);
}

export function InvoiceGenerator({
  initialDocument,
  templateSlug,
  previewAlt,
}: InvoiceGeneratorProps) {
  const t = useTranslations("StudioTools");
  const [document, setDocument] = useState<InvoiceDocument>(
    () => initialDocument ?? createDefaultInvoiceDocument(),
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const onDownload = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setStatus(t("generatingPdf"));
    try {
      await handleInvoiceDownload(document);
      setStatus(t("pdfDownloaded"));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("pdfExportFailed");
      setStatus(message);
      console.error("[InvoiceGenerator]", err);
    } finally {
      setBusy(false);
    }
  }, [busy, document, t]);

  return (
    <div className="invoice-generator-workspace tool-split-workspace space-y-2">
      {templateSlug ? (
        <p className={matteWorkspaceBanner}>
          {t("invoiceTemplateLoaded", { slug: templateSlug.replace(/-/g, " ") })}
        </p>
      ) : null}
      {status ? (
        <p className="text-sm text-black dark:text-neutral-200" aria-live="polite">
          {status}
        </p>
      ) : null}
      <div className="tool-split-workspace__layout invoice-generator-workspace__layout grid gap-2 lg:grid-cols-12">
        <section className={`${matteWorkspaceSection} tool-split-workspace__pane tool-split-workspace__pane--form lg:col-span-4`}>
          <InvoiceFormPanel
            document={document}
            onChange={setDocument}
            onDownload={onDownload}
            downloadBusy={busy}
          />
        </section>
        <section className={`tool-split-workspace__pane tool-split-workspace__pane--preview ${matteWorkspaceSection} lg:col-span-8`}>
          <InvoicePreviewPanel document={document} previewAlt={previewAlt} />
        </section>
      </div>
    </div>
  );
}
