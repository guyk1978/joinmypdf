import type { InvoiceDocument, InvoiceExportPayload, InvoiceLineItem, InvoiceTotals } from "./types";

export function lineTotal(item: InvoiceLineItem): number {
  const qty = Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0;
  const price = Number.isFinite(item.price) ? Math.max(0, item.price) : 0;
  return qty * price;
}

export function computeTotals(document: InvoiceDocument): InvoiceTotals {
  const subtotal = document.lineItems.reduce((sum, item) => sum + lineTotal(item), 0);
  const rate = Number.isFinite(document.taxPercent) ? Math.max(0, document.taxPercent) : 0;
  const taxAmount = subtotal * (rate / 100);
  return {
    subtotal,
    taxAmount,
    grandTotal: subtotal + taxAmount,
  };
}

export function formatMoney(amount: number, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return "—";
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function buildExportPayload(document: InvoiceDocument): InvoiceExportPayload {
  return {
    ...document,
    totals: computeTotals(document),
    generatedAt: new Date().toISOString(),
  };
}
