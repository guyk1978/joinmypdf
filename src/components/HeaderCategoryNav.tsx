"use client";

import { clsx } from "clsx";
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
import type { NavigationDrawerTab } from "@/components/NavigationDrawer";
import { HEADER_CATEGORY_BUTTONS, type HeaderCategoryId } from "@/lib/tool-registry";

const NavigationDrawer = dynamic(
  () => import("@/components/NavigationDrawer").then((mod) => mod.NavigationDrawer),
  { ssr: false },
);

type HeaderCategoryNavContextValue = {
  open: boolean;
  activeTab: NavigationDrawerTab;
  activeCategory: HeaderCategoryId;
  openDrawer: (tab?: NavigationDrawerTab, category?: HeaderCategoryId) => void;
  /** @deprecated Prefer openDrawer — opens All Tools tab (optionally filtered). */
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

/** Soft hook for Library / All Tools header buttons. */
export function useHeaderCategoryNavOptional(): HeaderCategoryNavContextValue | null {
  return useContext(HeaderCategoryNavContext);
}

type HeaderCategoryNavProviderProps = {
  children: ReactNode;
  onNavigate?: () => void;
  open?: boolean;
  activeTab?: NavigationDrawerTab;
  activeCategory?: HeaderCategoryId;
  onOpenChange?: (open: boolean) => void;
  onTabChange?: (tab: NavigationDrawerTab) => void;
  onCategoryChange?: (category: HeaderCategoryId) => void;
};

export function HeaderCategoryNavProvider({
  children,
  onNavigate,
  open: controlledOpen,
  activeTab: controlledTab,
  activeCategory: controlledCategory,
  onOpenChange,
  onTabChange,
  onCategoryChange,
}: HeaderCategoryNavProviderProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalTab, setInternalTab] = useState<NavigationDrawerTab>("all-tools");
  const [internalCategory, setInternalCategory] = useState<HeaderCategoryId>("all");
  const [hasLoaded, setHasLoaded] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const activeTab = controlledTab ?? internalTab;
  const activeCategory = controlledCategory ?? internalCategory;

  const setTab = useCallback(
    (tab: NavigationDrawerTab) => {
      onTabChange?.(tab);
      if (controlledTab === undefined) setInternalTab(tab);
    },
    [controlledTab, onTabChange],
  );

  const setCategory = useCallback(
    (category: HeaderCategoryId) => {
      onCategoryChange?.(category);
      if (controlledCategory === undefined) setInternalCategory(category);
    },
    [controlledCategory, onCategoryChange],
  );

  const openDrawer = useCallback(
    (tab: NavigationDrawerTab = "all-tools", category: HeaderCategoryId = "all") => {
      setHasLoaded(true);
      setTab(tab);
      setCategory(category);
      onOpenChange?.(true);
      if (controlledOpen === undefined) setInternalOpen(true);
    },
    [controlledOpen, onOpenChange, setCategory, setTab],
  );

  const openCategory = useCallback(
    (category: HeaderCategoryId) => {
      openDrawer("all-tools", category);
    },
    [openDrawer],
  );

  const close = useCallback(() => {
    onOpenChange?.(false);
    if (controlledOpen === undefined) setInternalOpen(false);
  }, [controlledOpen, onOpenChange]);

  useEffect(() => {
    if (open) setHasLoaded(true);
  }, [open]);

  const value = useMemo(
    () => ({ open, activeTab, activeCategory, openDrawer, openCategory, close }),
    [open, activeTab, activeCategory, openDrawer, openCategory, close],
  );

  return (
    <HeaderCategoryNavContext.Provider value={value}>
      <CategorySeoNav />
      {children}
      {hasLoaded ? (
        <NavigationDrawer
          open={open}
          activeTab={activeTab}
          activeCategory={activeCategory}
          onTabChange={setTab}
          onClose={close}
          onNavigate={onNavigate}
        />
      ) : null}
    </HeaderCategoryNavContext.Provider>
  );
}

export function HeaderCategoryButtons({ className }: { className?: string }) {
  const t = useTranslations("Header");
  const { open, activeTab, activeCategory, openCategory } = useHeaderCategoryNav();

  return (
    <div className={clsx("header-category-nav", className)} role="navigation" aria-label={t("primaryNav")}>
      {HEADER_CATEGORY_BUTTONS.filter((entry) => entry.id !== "all").map((entry) => (
        <button
          key={entry.id}
          type="button"
          className={clsx(
            "header-category-nav__btn",
            "rounded-none bg-transparent text-lg font-bold uppercase tracking-wide text-neutral-400 transition-all",
            "hover:text-white",
            open && activeTab === "all-tools" && activeCategory === entry.id && "text-white",
          )}
          aria-haspopup="dialog"
          aria-expanded={open && activeTab === "all-tools" && activeCategory === entry.id}
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
  const { open, activeTab, openDrawer } = useHeaderCategoryNav();

  return (
    <button
      type="button"
      className={clsx(
        "header-category-nav__all-tools",
        "rounded-none border-0 bg-transparent p-0 text-neutral-400 font-bold uppercase transition-all",
        "hover:text-white hover:underline hover:underline-offset-8 hover:decoration-2",
        open && activeTab === "all-tools" && "text-white underline underline-offset-8 decoration-2",
        className,
      )}
      aria-haspopup="dialog"
      aria-expanded={open && activeTab === "all-tools"}
      onClick={() => openDrawer("all-tools", "all")}
    >
      <span>{t("allTools.button")}</span>
    </button>
  );
}

export type { HeaderCategoryId, NavigationDrawerTab };
