"use client";

import { clsx } from "clsx";
import { LayoutGrid } from "lucide-react";
import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { CategorySeoNav } from "@/components/CategoryModal";
import { HEADER_CATEGORY_BUTTONS, type HeaderCategoryId } from "@/lib/tool-registry";

const CategoryModal = dynamic(
  () => import("@/components/CategoryModal").then((mod) => mod.CategoryModal),
  { ssr: false },
);

type HeaderCategoryNavContextValue = {
  open: boolean;
  activeCategory: HeaderCategoryId;
  openCategory: (category: HeaderCategoryId) => void;
  close: () => void;
};

const HeaderCategoryNavContext = createContext<HeaderCategoryNavContextValue | null>(null);

function useHeaderCategoryNav() {
  const context = useContext(HeaderCategoryNavContext);
  if (!context) {
    throw new Error("Header category nav components must be used within HeaderCategoryNavProvider");
  }
  return context;
}

type HeaderCategoryNavProviderProps = {
  children: ReactNode;
  onNavigate?: () => void;
  open?: boolean;
  activeCategory?: HeaderCategoryId;
  onOpenChange?: (open: boolean) => void;
  onCategoryChange?: (category: HeaderCategoryId) => void;
};

export function HeaderCategoryNavProvider({
  children,
  onNavigate,
  open: controlledOpen,
  activeCategory: controlledCategory,
  onOpenChange,
  onCategoryChange,
}: HeaderCategoryNavProviderProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalCategory, setInternalCategory] = useState<HeaderCategoryId>("all");
  const [hasLoaded, setHasLoaded] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const activeCategory = controlledCategory ?? internalCategory;

  const openCategory = useCallback(
    (category: HeaderCategoryId) => {
      setHasLoaded(true);
      onCategoryChange?.(category);
      onOpenChange?.(true);
      if (controlledCategory === undefined) setInternalCategory(category);
      if (controlledOpen === undefined) setInternalOpen(true);
    },
    [controlledCategory, controlledOpen, onCategoryChange, onOpenChange],
  );

  const close = useCallback(() => {
    onOpenChange?.(false);
    if (controlledOpen === undefined) setInternalOpen(false);
  }, [controlledOpen, onOpenChange]);

  useEffect(() => {
    if (open) setHasLoaded(true);
  }, [open]);

  const value = useMemo(
    () => ({ open, activeCategory, openCategory, close }),
    [open, activeCategory, openCategory, close],
  );

  return (
    <HeaderCategoryNavContext.Provider value={value}>
      <CategorySeoNav />
      {children}
      {hasLoaded ? (
        <CategoryModal
          open={open}
          activeCategory={activeCategory}
          onClose={close}
          onNavigate={onNavigate}
        />
      ) : null}
    </HeaderCategoryNavContext.Provider>
  );
}

export function HeaderCategoryButtons({ className }: { className?: string }) {
  const t = useTranslations("Header");
  const { open, activeCategory, openCategory } = useHeaderCategoryNav();

  return (
    <div className={clsx("header-category-nav", className)} role="navigation" aria-label={t("primaryNav")}>
      {HEADER_CATEGORY_BUTTONS.filter((entry) => entry.id !== "all").map((entry) => (
        <button
          key={entry.id}
          type="button"
          className="header-category-nav__btn"
          aria-haspopup="dialog"
          aria-expanded={open && activeCategory === entry.id}
          onClick={() => openCategory(entry.id)}
        >
          {t(entry.labelKey as "nav.image")}
        </button>
      ))}
    </div>
  );
}

export function HeaderAllToolsButton({ className }: { className?: string }) {
  const t = useTranslations("Header");
  const { open, activeCategory, openCategory } = useHeaderCategoryNav();
  const allToolsButton = HEADER_CATEGORY_BUTTONS.find((entry) => entry.id === "all");
  if (!allToolsButton) return null;

  return (
    <button
      type="button"
      className={clsx("header-category-nav__all-tools", className)}
      aria-haspopup="dialog"
      aria-expanded={open && activeCategory === "all"}
      onClick={() => openCategory("all")}
    >
      <LayoutGrid className="header-category-nav__all-tools-icon" aria-hidden />
      <span>{t(allToolsButton.labelKey as "nav.image")}</span>
    </button>
  );
}

export type { HeaderCategoryId };
