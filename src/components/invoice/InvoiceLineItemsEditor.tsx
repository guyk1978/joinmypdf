"use client";

import { matteField, mattePanelInset } from "@/lib/tool-ui";
import type { InvoiceLineItem } from "@/lib/invoice/types";
import { formatMoney, lineTotal } from "@/lib/invoice/calculations";

const inputClass = matteField;

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
          className="inline-flex items-center gap-1.5 border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-xs font-semibold text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-700"
        >
          <span aria-hidden="true">+</span> Add item
        </button>
      </div>

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            className={`${mattePanelInset} transition hover:border-neutral-700`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-ink-muted">Item {index + 1}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold tabular-nums text-neutral-200">{formatMoney(lineTotal(item))}</span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length <= 1}
                  className="px-2 py-0.5 text-xs text-neutral-400 transition hover:bg-neutral-800 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
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
