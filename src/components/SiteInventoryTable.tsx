"use client";

import { useCallback, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { Check, ClipboardCopy } from "lucide-react";
import type { InventoryCategoryGroup } from "@/lib/site-inventory";

type SiteInventoryTableProps = {
  groups: InventoryCategoryGroup[];
  generatedAt: string;
};

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

type CopyButtonProps = {
  label: string;
  value: string;
  className?: string;
  children?: ReactNode;
};

function CopyButton({ label, value, className, children }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [value]);

  return (
    <button
      type="button"
      className={clsx("site-inventory__copy-btn", className)}
      onClick={() => void onCopy()}
      aria-label={label}
    >
      {copied ? <Check className="site-inventory__copy-icon" aria-hidden /> : null}
      {copied ? "Copied" : children ?? "Copy"}
    </button>
  );
}

export function SiteInventoryTable({ groups, generatedAt }: SiteInventoryTableProps) {
  const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="site-inventory">
      <p className="site-inventory__meta">
        {totalItems} items across {groups.length} categories · generated {generatedAt}
      </p>

      {groups.map((group) => {
        const categoryTitles = group.items.map((item) => item.name).join("\n");

        return (
          <section key={group.id} className="site-inventory__section" aria-labelledby={`inventory-${group.id}`}>
            <div className="site-inventory__section-head">
              <div>
                <h2 id={`inventory-${group.id}`} className="site-inventory__section-title">
                  {group.label}
                </h2>
                <p className="site-inventory__section-count">{group.items.length} items</p>
              </div>
              <CopyButton
                label={`Copy ${group.label} category list`}
                value={categoryTitles}
                className="site-inventory__copy-btn--category"
              >
                Copy Category List
              </CopyButton>
            </div>

            <div className="site-inventory__table-wrap">
              <table className="site-inventory__table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Category</th>
                    <th scope="col">Path</th>
                    <th scope="col" className="site-inventory__actions-col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item) => (
                    <tr key={`${group.id}-${item.id}`}>
                      <td className="site-inventory__name">{item.name}</td>
                      <td className="site-inventory__category">{group.label}</td>
                      <td className="site-inventory__path">
                        <code>{item.path}</code>
                      </td>
                      <td className="site-inventory__actions">
                        <CopyButton label={`Copy ${item.name}`} value={`${item.name}\n${item.path}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </section>
        );
      })}

      <div className="site-inventory__footer-note">
        <ClipboardCopy className="site-inventory__copy-icon" aria-hidden />
        <p>
          Inventory is built automatically from <code>tools.json</code>, blog registry data, and{" "}
          <code>src/components/tools</code> at request time.
        </p>
      </div>
    </div>
  );
}
