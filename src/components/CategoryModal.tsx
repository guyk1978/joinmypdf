"use client";

import { clsx } from "clsx";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useMemo } from "react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { Link, usePathname } from "@/i18n/navigation";
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

function CategoryColumns({
  columns,
  pathname,
  onNavigate,
  onClose,
}: {
  columns: ReturnType<typeof buildCategoryNav>[number]["columns"];
  pathname: string;
  onNavigate?: () => void;
  onClose: () => void;
}) {
  return (
    <div className="category-modal__columns">
      {columns.map((column) => (
        <div key={column.id} className="category-modal__column">
          <p className="category-modal__column-title">{column.label}</p>
          <ul className="category-modal__list">
            {column.items.map((item) => (
              <li key={item.slug}>
                <Link
                  href={item.href}
                  className={clsx(
                    "category-modal__link",
                    isNavItemActive(pathname, item.href) && "is-active",
                  )}
                  prefetch={false}
                  onClick={() => {
                    onNavigate?.();
                    onClose();
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
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
            className="category-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="category-modal__panel-header">
              <h2 id={titleId} className="category-modal__title">
                {title}
              </h2>
              <button
                type="button"
                className="category-modal__close"
                aria-label={t("allTools.close")}
                onClick={onClose}
              >
                <X className="category-modal__close-icon" aria-hidden />
              </button>
            </div>
            <div className="category-modal__body">
              {isAllView ? (
                <div className="category-modal__categories">
                  {groups.map((group) => (
                    <section
                      key={group.id}
                      className="category-modal__category"
                      aria-labelledby={`${titleId}-${group.id}`}
                    >
                      <h3 id={`${titleId}-${group.id}`} className="category-modal__category-title">
                        {group.label}
                      </h3>
                      <CategoryColumns
                        columns={group.columns}
                        pathname={pathname}
                        onNavigate={onNavigate}
                        onClose={onClose}
                      />
                    </section>
                  ))}
                </div>
              ) : (
                <div className="category-modal__single">
                  {groups.flatMap((group) => (
                    <CategoryColumns
                      key={group.id}
                      columns={group.columns}
                      pathname={pathname}
                      onNavigate={onNavigate}
                      onClose={onClose}
                    />
                  ))}
                </div>
              )}
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
