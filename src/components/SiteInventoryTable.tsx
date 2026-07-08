"use client";

import { useCallback, useState, useTransition, type ReactNode } from "react";
import { clsx } from "clsx";
import { Check, ClipboardCopy } from "lucide-react";
import type {
  InventoryCategoryGroup,
  InventoryItem,
  InventoryToolStatus,
} from "@/lib/site-inventory-types";

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

function StatusToggle({
  item,
  onStatusChange,
}: {
  item: InventoryItem;
  onStatusChange: (slug: string, status: InventoryToolStatus) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isArticle = item.category === "articles";
  const isActive = item.status === "active";

  const toggle = () => {
    if (isArticle || pending) return;
    const next: InventoryToolStatus = isActive ? "inactive" : "active";
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/inventory-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: item.slug, status: next }),
        });
        if (!response.ok) {
          setError("Failed");
          return;
        }
        onStatusChange(item.slug, next);
      } catch {
        setError("Failed");
      }
    });
  };

  if (isArticle) {
    return <span className="site-inventory__status-static">—</span>;
  }

  return (
    <div className="site-inventory__status-cell">
      <button
        type="button"
        className={clsx(
          "site-inventory__status-toggle",
          isActive ? "site-inventory__status-toggle--active" : "site-inventory__status-toggle--inactive",
        )}
        aria-pressed={isActive}
        disabled={pending}
        onClick={toggle}
      >
        {pending ? "…" : isActive ? "Active" : "Inactive"}
      </button>
      {error ? <span className="site-inventory__status-error">{error}</span> : null}
    </div>
  );
}

export function SiteInventoryTable({ groups: initialGroups, generatedAt }: SiteInventoryTableProps) {
  const [groups, setGroups] = useState(initialGroups);
  const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0);
  const activeTools = groups
    .filter((group) => group.id !== "articles")
    .reduce((sum, group) => sum + group.items.filter((item) => item.status === "active").length, 0);

  const onStatusChange = useCallback((slug: string, status: InventoryToolStatus) => {
    setGroups((prev) =>
      prev.map((group) => ({
        ...group,
        items: group.items.map((item) => (item.slug === slug ? { ...item, status } : item)),
      })),
    );
  }, []);

  return (
    <div className="site-inventory">
      <p className="site-inventory__meta">
        {totalItems} items · {activeTools} active tools · {groups.length} categories · generated{" "}
        {generatedAt}
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
                    <th scope="col">Slug</th>
                    <th scope="col">Category</th>
                    <th scope="col">Description</th>
                    <th scope="col">Path</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="site-inventory__actions-col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item) => (
                    <tr
                      key={`${group.id}-${item.id}`}
                      className={clsx(item.status === "inactive" && "site-inventory__row--inactive")}
                    >
                      <td className="site-inventory__name">{item.name}</td>
                      <td className="site-inventory__slug">
                        <code>{item.slug}</code>
                      </td>
                      <td className="site-inventory__category">{group.label}</td>
                      <td className="site-inventory__description" title={item.description}>
                        {item.description || "—"}
                      </td>
                      <td className="site-inventory__path">
                        <code>{item.path}</code>
                      </td>
                      <td className="site-inventory__status">
                        <StatusToggle item={item} onStatusChange={onStatusChange} />
                      </td>
                      <td className="site-inventory__actions">
                        <CopyButton
                          label={`Copy ${item.name}`}
                          value={`${item.name}\n${item.slug}\n${item.path}\n${item.description}`}
                        />
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
          Inventory auto-appends tools from <code>tools.json</code>, nav definitions, audio registry,
          and studio tools. Inactive tools are excluded from the sitemap.
        </p>
      </div>
    </div>
  );
}
