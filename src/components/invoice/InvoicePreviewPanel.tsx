"use client";

import { INVOICE_PRINT_ROOT_ID } from "@/lib/invoice/constants";
import { getBrandName } from "@/lib/brand";
import { toolCanvasPage, toolCanvasStudio } from "@/lib/tool-ui";
import { clsx } from "clsx";
import { useLocale } from "next-intl";
import type { InvoiceDocument } from "@/lib/invoice/types";
import {
  computeTotals,
  formatDisplayDate,
  formatMoney,
  lineTotal,
} from "@/lib/invoice/calculations";

type InvoicePreviewPanelProps = {
  document: InvoiceDocument;
};

function AddressBlock({ lines }: { lines: string }) {
  const parts = lines.split("\n").filter(Boolean);
  if (!parts.length) return <p className="text-sm text-black dark:text-neutral-200">—</p>;
  return (
    <address className="not-italic text-sm leading-relaxed text-black dark:text-neutral-200">
      {parts.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </address>
  );
}

export function InvoicePreviewPanel({ document }: InvoicePreviewPanelProps) {
  const locale = useLocale();
  const brand = getBrandName(locale);
  const totals = computeTotals(document);
  const hasItems = document.lineItems.some(
    (item) => item.description.trim() || item.quantity > 0 || item.price > 0,
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-semibold text-ink">Live preview</h2>
          <p className="text-xs text-ink-muted">A4 layout · updates as you type</p>
        </div>
        <span className="rounded-none border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-ink-muted">
          Print-ready
        </span>
      </div>

      <div
        className={clsx(
          "flex flex-1 items-start justify-center overflow-auto p-4 md:p-4 print:border-0 print:bg-white print:p-0",
          toolCanvasStudio,
        )}
      >
        <article
          id={INVOICE_PRINT_ROOT_ID}
          className={clsx(
            "w-full max-w-[210mm] text-black dark:text-neutral-200 transition-[box-shadow] duration-300 print:max-w-none print:shadow-none print:ring-0",
            toolCanvasPage,
          )}
          style={{ aspectRatio: "210 / 297", minHeight: "min(80vh, 297mm)" }}
        >
          <div className="flex h-full flex-col p-[10mm] sm:p-[12mm] md:p-[14mm]">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-300 dark:border-neutral-800 pb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black dark:text-neutral-200">Invoice</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-black dark:text-neutral-200">
                  {document.from.companyName.trim() || "Your company"}
                </h1>
                {document.from.email ? (
                  <p className="mt-1 text-sm text-black dark:text-neutral-200">{document.from.email}</p>
                ) : null}
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-black dark:text-neutral-200">
                  #{document.invoiceNumber.trim() || "—"}
                </p>
                <p className="mt-2 text-black dark:text-neutral-200">
                  <span className="text-black dark:text-neutral-200">Issued </span>
                  {formatDisplayDate(document.issueDate)}
                </p>
                <p className="text-black dark:text-neutral-200">
                  <span className="text-black dark:text-neutral-200">Due </span>
                  {formatDisplayDate(document.dueDate)}
                </p>
              </div>
            </header>

            <section className="mt-6 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-black dark:text-neutral-200">Bill from</p>
                <p className="mt-2 font-semibold text-black dark:text-neutral-200">
                  {document.from.companyName.trim() || "—"}
                </p>
                <AddressBlock lines={document.from.address} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-black dark:text-neutral-200">Bill to</p>
                <p className="mt-2 font-semibold text-black dark:text-neutral-200">
                  {document.to.companyName.trim() || "—"}
                </p>
                <AddressBlock lines={document.to.address} />
                {document.to.email ? (
                  <p className="mt-2 text-sm text-black dark:text-neutral-200">{document.to.email}</p>
                ) : null}
              </div>
            </section>

            <section className="mt-4 flex-1">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-neutral-300 dark:border-neutral-800 text-left text-xs uppercase tracking-wide text-black dark:text-neutral-200">
                    <th className="pb-2 pr-2 font-semibold">Description</th>
                    <th className="pb-2 pr-2 text-right font-semibold">Qty</th>
                    <th className="pb-2 pr-2 text-right font-semibold">Rate</th>
                    <th className="pb-2 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {hasItems ? (
                    document.lineItems.map((item) => (
                      <tr key={item.id} className="border-b border-neutral-300 dark:border-neutral-800">
                        <td className="py-2.5 pr-2 text-black dark:text-neutral-200">
                          {item.description.trim() || "—"}
                        </td>
                        <td className="py-2.5 pr-2 text-right tabular-nums text-black dark:text-neutral-200">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 pr-2 text-right tabular-nums text-black dark:text-neutral-200">
                          {formatMoney(item.price)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums font-medium text-black dark:text-neutral-200">
                          {formatMoney(lineTotal(item))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-3 text-center text-black dark:text-neutral-200">
                        Add line items to see them here
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            <footer className="mt-auto border-t border-neutral-300 dark:border-neutral-800 pt-6">
              <div className="ml-auto w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-black dark:text-neutral-200">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium text-black dark:text-neutral-200">
                    {formatMoney(totals.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-black dark:text-neutral-200">
                  <span>Tax ({document.taxPercent}%)</span>
                  <span className="tabular-nums font-medium text-black dark:text-neutral-200">
                    {formatMoney(totals.taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-neutral-300 dark:border-neutral-800 pt-2 text-base font-bold text-black dark:text-neutral-200">
                  <span>Total due</span>
                  <span className="tabular-nums">{formatMoney(totals.grandTotal)}</span>
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-black dark:text-neutral-200">
                Thank you for your business · Generated with {brand}
              </p>
            </footer>
          </div>
        </article>
      </div>
    </div>
  );
}
