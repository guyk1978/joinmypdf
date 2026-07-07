"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { ToolGridShowMoreButton } from "@/components/ToolGridShowMoreButton";
import {
  FOOTER_COLUMN_BATCH_SIZE,
  FOOTER_COLUMN_INITIAL_VISIBLE,
} from "@/lib/tool-grid-config";

export type FooterToolsColumnItem = {
  slug: string;
  href: string;
  label: string;
};

type FooterToolsColumnProps = {
  id: string;
  label: string;
  items: FooterToolsColumnItem[];
};

export function FooterToolsColumn({ label, items }: FooterToolsColumnProps) {
  const [visibleCount, setVisibleCount] = useState(FOOTER_COLUMN_INITIAL_VISIBLE);
  const visibleItems = items.slice(0, visibleCount);
  const remainingCount = Math.max(0, items.length - visibleCount);

  return (
    <div className="footer-tools-panel__column">
      <h3 className="footer-tools-panel__column-title">{label}</h3>
      <ul className="footer-tools-panel__list">
        {visibleItems.map((item) => (
          <li key={item.slug}>
            <Link href={item.href} className="footer-tools-panel__link" prefetch={false}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      {remainingCount > 0 ? (
        <ToolGridShowMoreButton
          className="footer-tools-panel__show-more"
          remainingCount={remainingCount}
          onClick={() => setVisibleCount((current) => Math.min(current + FOOTER_COLUMN_BATCH_SIZE, items.length))}
        />
      ) : null}
    </div>
  );
}
