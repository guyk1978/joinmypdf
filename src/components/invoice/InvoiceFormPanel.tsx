"use client";

import { matteField, matteFieldArea, mattePanel, mattePanelInset, toolDownloadBtn } from "@/lib/tool-ui";
import type { InvoiceDocument, PartyInfo } from "@/lib/invoice/types";
import { computeTotals, formatMoney } from "@/lib/invoice/calculations";
import { InvoiceLineItemsEditor } from "@/components/invoice/InvoiceLineItemsEditor";
import { createEmptyLineItem } from "@/lib/invoice/defaults";

const inputClass = matteField;

const textareaClass = matteFieldArea;

type InvoiceFormPanelProps = {
  document: InvoiceDocument;
  onChange: (document: InvoiceDocument) => void;
  onDownload: () => void | Promise<void>;
  downloadBusy?: boolean;
};

function PartyFields({
  title,
  party,
  onChange,
}: {
  title: string;
  party: PartyInfo;
  onChange: (party: PartyInfo) => void;
}) {
  return (
    <fieldset className={`space-y-3 ${mattePanelInset}`}>
      <legend className="px-1 text-sm font-semibold text-ink">{title}</legend>
      <label className="block">
        <span className="mb-1 block text-xs text-ink-muted">Company / name</span>
        <input
          className={inputClass}
          type="text"
          value={party.companyName}
          onChange={(e) => onChange({ ...party, companyName: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-ink-muted">Email</span>
        <input
          className={inputClass}
          type="email"
          value={party.email}
          onChange={(e) => onChange({ ...party, email: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-ink-muted">Address</span>
        <textarea
          className={textareaClass}
          value={party.address}
          rows={3}
          onChange={(e) => onChange({ ...party, address: e.target.value })}
        />
      </label>
    </fieldset>
  );
}

export function InvoiceFormPanel({
  document,
  onChange,
  onDownload,
  downloadBusy = false,
}: InvoiceFormPanelProps) {
  const totals = computeTotals(document);

  const patch = (partial: Partial<InvoiceDocument>) => onChange({ ...document, ...partial });

  return (
    <div className="flex h-full flex-col gap-3 print:hidden">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black dark:text-neutral-200">Client-side only</p>
        <h2 className="text-xl font-bold text-ink">Invoice details</h2>
        <p className="text-sm text-ink-muted">
          Fill in the form — your preview updates instantly. Nothing is uploaded to our servers.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <label className="block sm:col-span-1">
          <span className="mb-1 block text-xs text-ink-muted">Invoice number</span>
          <input
            className={inputClass}
            type="text"
            value={document.invoiceNumber}
            onChange={(e) => patch({ invoiceNumber: e.target.value })}
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="mb-1 block text-xs text-ink-muted">Issue date</span>
          <input
            className={inputClass}
            type="date"
            value={document.issueDate}
            onChange={(e) => patch({ issueDate: e.target.value })}
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="mb-1 block text-xs text-ink-muted">Due date</span>
          <input
            className={inputClass}
            type="date"
            value={document.dueDate}
            onChange={(e) => patch({ dueDate: e.target.value })}
          />
        </label>
      </section>

      <div className="grid gap-2 lg:grid-cols-2">
        <PartyFields title="From (sender)" party={document.from} onChange={(from) => patch({ from })} />
        <PartyFields title="To (client)" party={document.to} onChange={(to) => patch({ to })} />
      </div>

      <InvoiceLineItemsEditor
        items={document.lineItems}
        onChange={(lineItems) => patch({ lineItems })}
        onAdd={() => patch({ lineItems: [...document.lineItems, createEmptyLineItem()] })}
      />

      <section className={mattePanelInset}>
        <label className="block max-w-xs">
          <span className="mb-1 block text-xs text-ink-muted">Tax / VAT (%)</span>
          <input
            className={inputClass}
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={document.taxPercent}
            onChange={(e) => patch({ taxPercent: Number(e.target.value) || 0 })}
          />
        </label>
        <dl className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between text-ink-muted">
            <dt>Subtotal</dt>
            <dd className="font-medium text-ink">{formatMoney(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-ink-muted">
            <dt>Tax ({document.taxPercent}%)</dt>
            <dd className="font-medium text-ink">{formatMoney(totals.taxAmount)}</dd>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2 text-base font-semibold text-ink">
            <dt>Total due</dt>
            <dd>{formatMoney(totals.grandTotal)}</dd>
          </div>
        </dl>
      </section>

      <button
        type="button"
        onClick={() => void onDownload()}
        disabled={downloadBusy}
        className={toolDownloadBtn}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3v12m0 0l4-4m-4 4L8 11M4 19h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {downloadBusy ? "Generating PDF…" : "Download PDF"}
      </button>
    </div>
  );
}
