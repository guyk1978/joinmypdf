"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { Link, usePathname } from "@/i18n/navigation";
import { ToolListIcon } from "@/components/ToolListIcon";
import { isNavItemActive } from "@/lib/nav-config";
import {
  buildAllToolsNav,
  buildCategoryNav,
  getCategoryTitleKey,
  type HeaderCategoryId,
} from "@/lib/tool-registry";

type CategoryModalProps = {
  open: boolean;
  activeCategory: HeaderCategoryId;
  onClose: () => void;
  onNavigate?: () => void;
};

type ToolBlockColumn = ReturnType<typeof buildCategoryNav>[number]["columns"][number];

/** Number of "core" tools shown before the Show all / Show less toggle appears. */
const DEFAULT_VISIBLE_TOOLS = 7;

function ToolBlock({
  column,
  pathname,
  showAllLabel,
  collapseLabel,
  onNavigate,
  onClose,
}: {
  column: ToolBlockColumn;
  pathname: string;
  showAllLabel: string;
  collapseLabel: string;
  onNavigate?: () => void;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const wasExpanded = useRef(false);

  const hasOverflow = column.items.length > DEFAULT_VISIBLE_TOOLS;
  const coreItems = hasOverflow ? column.items.slice(0, DEFAULT_VISIBLE_TOOLS) : column.items;
  const extraItems = hasOverflow ? column.items.slice(DEFAULT_VISIBLE_TOOLS) : [];
  const totalCount = column.items.length;

  // Keep the just-collapsed block anchored in view so the list does not jump.
  useEffect(() => {
    if (wasExpanded.current && !expanded) {
      sectionRef.current?.scrollIntoView({
        block: "nearest",
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
    wasExpanded.current = expanded;
  }, [expanded, reduceMotion]);

  const renderLink = (item: ToolBlockColumn["items"][number]) => (
    <Link
      href={item.href}
      className={clsx(
        "category-modal__link group flex items-center gap-2 rounded-none",
        "text-lg font-mono text-neutral-400 transition-colors hover:text-white",
        isNavItemActive(pathname, item.href) && "is-active text-white",
      )}
      prefetch={false}
      onClick={() => {
        onNavigate?.();
        onClose();
      }}
    >
      <ToolListIcon slug={item.slug} label={item.label} />
      <span>{item.label}</span>
    </Link>
  );

  return (
    <section className="category-modal__block rounded-none bg-black" ref={sectionRef}>
      <h4 className="category-modal__block-title mb-6 text-base font-mono uppercase tracking-wider text-neutral-600">
        {column.label}
      </h4>
      <ul className="category-modal__list">
        {coreItems.map((item) => (
          <li key={item.slug}>{renderLink(item)}</li>
        ))}
        <AnimatePresence initial={false}>
          {expanded
            ? extraItems.map((item) => (
                <motion.li
                  key={item.slug}
                  className="category-modal__list-extra"
                  initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                  animate={reduceMotion ? undefined : { opacity: 1, height: "auto" }}
                  exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {renderLink(item)}
                </motion.li>
              ))
            : null}
        </AnimatePresence>
      </ul>
      {hasOverflow ? (
        <button
          type="button"
          className={clsx(
            "category-modal__toggle mt-4 rounded-none border-0 bg-transparent p-0",
            "text-sm font-mono text-blue-500 transition-colors hover:text-blue-300",
          )}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? `${collapseLabel} (${totalCount})` : `${showAllLabel} (${totalCount})`}
        </button>
      ) : null}
    </section>
  );
}

export function CategoryModal({ open, activeCategory, onClose, onNavigate }: CategoryModalProps) {
  const t = useTranslations("Header");
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const pathname = usePathname() || "/";

  const groups = useMemo(
    () => buildCategoryNav((key) => t(key as "nav.image"), activeCategory),
    [t, activeCategory],
  );

  const title = t(getCategoryTitleKey(activeCategory) as "nav.image");
  const isAllView = activeCategory === "all";
  const showAllLabel = t("allTools.showAll");
  const collapseLabel = t("allTools.collapse");

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  const modal = (
    <AnimatePresence>
      {open ? (
        <motion.div
          key={`category-modal-${activeCategory}`}
          className="category-modal"
          role="presentation"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <button
            type="button"
            className="category-modal__backdrop"
            aria-label={t("allTools.close")}
            onClick={onClose}
          />
          <motion.div
            className="category-modal__panel rounded-none border-none bg-black"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="category-modal__panel-header border-b-2 border-neutral-800">
              <h2
                id={titleId}
                className="category-modal__title text-4xl font-black uppercase tracking-tighter text-white"
              >
                {title}
              </h2>
              <button
                type="button"
                className="category-modal__close rounded-none border-0 bg-transparent text-white hover:text-neutral-400"
                aria-label={t("allTools.close")}
                onClick={onClose}
              >
                <span className="category-modal__close-glyph" aria-hidden>
                  ×
                </span>
              </button>
            </div>
            <div className="category-modal__body bg-black">
              <div className="category-modal__grid bg-black">
                {groups.map((group) => (
                  <Fragment key={group.id}>
                    {isAllView ? (
                      <h3
                        id={`${titleId}-${group.id}`}
                        className="category-modal__group-band font-mono uppercase tracking-wider text-neutral-600"
                      >
                        {group.label}
                      </h3>
                    ) : null}
                    {group.columns.map((column) => (
                      <ToolBlock
                        key={`${group.id}-${column.id}`}
                        column={column}
                        pathname={pathname}
                        showAllLabel={showAllLabel}
                        collapseLabel={collapseLabel}
                        onNavigate={onNavigate}
                        onClose={onClose}
                      />
                    ))}
                  </Fragment>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}

/** Crawlable tool links — always in DOM for SEO. */
export function CategorySeoNav() {
  const t = useTranslations("Header");
  const groups = useMemo(() => buildAllToolsNav((key) => t(key as "nav.image")), [t]);

  return (
    <nav className="sr-only" aria-label={t("allTools.seoNavLabel")}>
      {groups.map((group) => (
        <section key={group.id}>
          <h2>{group.label}</h2>
          {group.columns.map((column) => (
            <div key={column.id}>
              <h3>{column.label}</h3>
              <ul>
                {column.items.map((item) => (
                  <li key={item.slug}>
                    <Link href={item.href} prefetch={false}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </nav>
  );
}
