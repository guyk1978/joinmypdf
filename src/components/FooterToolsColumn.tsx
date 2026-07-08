"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FOOTER_COLUMN_INITIAL_VISIBLE } from "@/lib/tool-grid-config";

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
  const t = useTranslations("Home");
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const columnRef = useRef<HTMLDivElement>(null);
  const wasExpanded = useRef(false);

  const hasOverflow = items.length > FOOTER_COLUMN_INITIAL_VISIBLE;
  const coreItems = hasOverflow ? items.slice(0, FOOTER_COLUMN_INITIAL_VISIBLE) : items;
  const extraItems = hasOverflow ? items.slice(FOOTER_COLUMN_INITIAL_VISIBLE) : [];
  const hiddenCount = extraItems.length;

  // Keep the just-collapsed column anchored in view so the list does not jump.
  useEffect(() => {
    if (wasExpanded.current && !expanded) {
      columnRef.current?.scrollIntoView({
        block: "nearest",
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
    wasExpanded.current = expanded;
  }, [expanded, reduceMotion]);

  const renderLink = (item: FooterToolsColumnItem) => (
    <Link href={item.href} className="footer-tools-panel__link" prefetch={false}>
      {item.label}
    </Link>
  );

  return (
    <div className="footer-tools-panel__column" ref={columnRef}>
      <h3 className="footer-tools-panel__column-title">{label}</h3>
      <ul className="footer-tools-panel__list">
        {coreItems.map((item) => (
          <li key={item.slug}>{renderLink(item)}</li>
        ))}
      </ul>

      <AnimatePresence initial={false}>
        {expanded && extraItems.length > 0 ? (
          <motion.ul
            key="footer-tools-panel-extra"
            className="footer-tools-panel__list footer-tools-panel__list--extra"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={reduceMotion ? undefined : { height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {extraItems.map((item) => (
              <li key={item.slug}>{renderLink(item)}</li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>

      {hasOverflow ? (
        <div className="tool-grid-show-more footer-tools-panel__show-more">
          <button
            type="button"
            className="tool-grid-show-more__button footer-tools-panel__show-more-button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            <span>
              {expanded
                ? t("showLessTools", { count: hiddenCount })
                : t("showMoreTools", { count: hiddenCount })}
            </span>
            <ChevronDown
              className={clsx(
                "footer-tools-panel__show-more-icon",
                expanded && "footer-tools-panel__show-more-icon--open",
              )}
              aria-hidden
            />
          </button>
        </div>
      ) : null}
    </div>
  );
}
