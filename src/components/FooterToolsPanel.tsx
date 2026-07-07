"use client";

import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FooterToolsColumn } from "@/components/FooterToolsColumn";
import { buildFooterToolsColumns } from "@/lib/tool-registry";

export function FooterToolsPanel() {
  const tHeader = useTranslations("Header");
  const tFooter = useTranslations("Footer");
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const columns = useMemo(
    () => buildFooterToolsColumns((key) => tHeader(key as "nav.image")),
    [tHeader],
  );

  const panelId = "footer-tools-panel";

  return (
    <section className="footer-tools-panel" aria-label={tFooter("toolsPanel.label")}>
      <div className="footer-tools-panel__shell">
        <button
          type="button"
          className={clsx("footer-tools-panel__toggle", open && "footer-tools-panel__toggle--open")}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="footer-tools-panel__toggle-text">{tFooter("toolsPanel.toggle")}</span>
          <ChevronDown className="footer-tools-panel__toggle-icon" aria-hidden />
        </button>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              id={panelId}
              key="footer-tools-panel-content"
              className="footer-tools-panel__content"
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={reduceMotion ? undefined : { height: "auto", opacity: 1 }}
              exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="footer-tools-panel__grid">
                {columns.map((column) => (
                  <FooterToolsColumn
                    key={column.id}
                    id={column.id}
                    label={column.label}
                    items={column.items}
                  />
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
