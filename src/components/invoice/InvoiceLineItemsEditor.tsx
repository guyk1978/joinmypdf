"use client";

import type { InvoiceLineItem } from "@/lib/invoice/types";
import { formatMoney, lineTotal } from "@/lib/invoice/calculations";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-surface/60 px-3 py-2 text-sm text-ink transition focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20";

type InvoiceLineItemsEditorProps = {
  items: InvoiceLineItem[];
  onChange: (items: InvoiceLineItem[]) => void;
  onAdd: () => void;
};

export function InvoiceLineItemsEditor({ items, onChange, onAdd }: InvoiceLineItemsEditorProps) {
  const updateItem = (id: string, patch: Partial<InvoiceLineItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Line items</h3>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand transition hover:border-brand/50 hover:bg-brand/20 active:scale-[0.98]"
        >
          <span aria-hidden="true">+</span> Add item
        </button>
      </div>

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-3 transition hover:border-white/15"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-ink-muted">Item {index + 1}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink">{formatMoney(lineTotal(item))}</span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length <= 1}
                  className="rounded-md px-2 py-0.5 text-xs text-ink-muted transition hover:bg-white/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Remove item ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-6">
              <label className="sm:col-span-3">
                <span className="mb-1 block text-xs text-ink-muted">Description</span>
                <input
                  className={inputClass}
                  type="text"
                  value={item.description}
                  placeholder="Service or product"
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                />
              </label>
              <label className="sm:col-span-1">
                <span className="mb-1 block text-xs text-ink-muted">Qty</span>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  step={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) || 0 })}
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-muted">Unit price</span>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.price}
                  onChange={(e) => updateItem(item.id, { price: Number(e.target.value) || 0 })}
                />
              </label>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
