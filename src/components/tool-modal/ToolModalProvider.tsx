"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ToolModalWrapper } from "@/components/tool-modal/ToolModalWrapper";
import {
  ToolModalCalcFrame,
  ToolModalDocsPanel,
  ToolModalRelatedPanel,
} from "@/components/tool-modal/ToolModalPanels";
import {
  findToolsDataByPathname,
  getToolModalPath,
  getToolsDataEntry,
  normalizeToolPath,
} from "@/data/tools-data";
import {
  buildToolEmbedHref,
  getToolModalDocModel,
  getToolModalRelatedArticles,
  getToolModalRelatedTools,
  type ToolModalRelatedTool,
} from "@/lib/tool-modal-catalog";

export type OpenToolModalOptions = {
  slug: string;
  href: string;
  title: string;
  description?: string;
  calc?: ReactNode;
  docs?: ReactNode;
  related?: ReactNode;
  skipUrlSync?: boolean;
};

type ToolModalContextValue = {
  openToolModal: (options: OpenToolModalOptions) => void;
  closeToolModal: () => void;
  isOpen: boolean;
};

const ToolModalContext = createContext<ToolModalContextValue | null>(null);

export function useToolModal(): ToolModalContextValue {
  const ctx = useContext(ToolModalContext);
  if (!ctx) {
    throw new Error("useToolModal must be used within ToolModalProvider");
  }
  return ctx;
}

export function useOptionalToolModal(): ToolModalContextValue | null {
  return useContext(ToolModalContext);
}

function isEmbedRequest(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("embed") === "1";
}

/** Locale-prefixed path for the History API (no Next navigation). */
function toWindowPath(locale: string, appPath: string): string {
  const normalized = normalizeToolPath(appPath).replace(/\/$/, "") || "";
  return `/${locale}${normalized}`;
}

function homeWindowPath(locale: string): string {
  return `/${locale}`;
}

function toOpenOptionsFromSlug(slug: string): OpenToolModalOptions | null {
  const entry = getToolsDataEntry(slug);
  if (!entry) return null;
  return {
    slug: entry.id,
    href: getToolModalPath(entry),
    title: entry.title,
    description: entry.description || undefined,
  };
}

function maskBackground(on: boolean) {
  if (typeof document === "undefined") return;
  if (on) document.documentElement.setAttribute("data-tool-modal-open", "1");
  else document.documentElement.removeAttribute("data-tool-modal-open");
}

export function ToolModalProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const t = useTranslations("ToolModal");
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState<OpenToolModalOptions | null>(null);
  const [visible, setVisible] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const closingRef = useRef(false);
  /** Soft History URL ownership — true when we pushed tool URL without Next navigation. */
  const softUrlRef = useRef(false);

  const applyActiveTool = useCallback((options: OpenToolModalOptions) => {
    const href = normalizeToolPath(options.href || `/tools/${options.slug}/`);
    setActive({ ...options, href });
    setContentReady(Boolean(options.calc)); // custom calc is ready immediately
    setVisible(true);
    maskBackground(true);
    if (typeof document !== "undefined" && options.title) {
      document.title = `${options.title} | JoinMyPDF`;
    }
  }, []);

  const softPushToolUrl = useCallback(
    (href: string, slug: string) => {
      if (typeof window === "undefined") return;
      const nextUrl = toWindowPath(locale, href);
      const current = window.location.pathname.replace(/\/$/, "");
      if (current === nextUrl.replace(/\/$/, "")) return;
      window.history.pushState({ toolModal: slug }, "", nextUrl);
      softUrlRef.current = true;
    },
    [locale],
  );

  const closeToolModal = useCallback(() => {
    closingRef.current = true;
    setVisible(false);
    setContentReady(false);
    maskBackground(false);

    const onHardToolRoute = findToolsDataByPathname(pathname) != null;

    if (onHardToolRoute) {
      // Deep-linked / hard-navigated tool page → return home via Next router.
      softUrlRef.current = false;
      router.replace("/", { scroll: false });
      return;
    }

    // Soft-opened from dashboard — restore home URL without remounting the page tree.
    if (typeof window !== "undefined") {
      const home = homeWindowPath(locale);
      if (window.location.pathname.replace(/\/$/, "") !== home.replace(/\/$/, "")) {
        window.history.replaceState({ toolModal: null }, "", home);
      }
    }
    softUrlRef.current = false;
  }, [locale, pathname, router]);

  const openToolModal = useCallback(
    (options: OpenToolModalOptions) => {
      if (isEmbedRequest()) return;
      closingRef.current = false;
      applyActiveTool(options);
      if (!options.skipUrlSync) {
        softPushToolUrl(
          normalizeToolPath(options.href || `/tools/${options.slug}/`),
          options.slug,
        );
      }
    },
    [applyActiveTool, softPushToolUrl],
  );

  const handleExitComplete = useCallback(() => {
    if (!visible) {
      setActive(null);
      closingRef.current = false;
    }
  }, [visible]);

  // Deep link: mask + open before paint to avoid background flash.
  useLayoutEffect(() => {
    if (isEmbedRequest()) return;
    const matched = findToolsDataByPathname(pathname);
    if (!matched) return;
    maskBackground(true);
    closingRef.current = false;
    softUrlRef.current = false;
    setActive({
      slug: matched.id,
      href: getToolModalPath(matched),
      title: matched.title,
      description: matched.description || undefined,
    });
    setContentReady(false);
    setVisible(true);
  }, [pathname]);

  // Browser back/forward while soft URL is in history.
  useEffect(() => {
    const onPopState = () => {
      if (isEmbedRequest()) return;
      const matched = findToolsDataByPathname(window.location.pathname);
      if (matched) {
        closingRef.current = false;
        applyActiveTool({
          slug: matched.id,
          href: getToolModalPath(matched),
          title: matched.title,
          description: matched.description || undefined,
        });
        softUrlRef.current = true;
        return;
      }
      // Left tool URL via back → close overlay, keep current Next page.
      closingRef.current = true;
      softUrlRef.current = false;
      setVisible(false);
      setContentReady(false);
      maskBackground(false);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [applyActiveTool]);

  // Hard navigation away from a tool route (e.g. in-app link) closes the modal.
  useEffect(() => {
    if (isEmbedRequest()) return;
    if (softUrlRef.current) return;
    if (closingRef.current) return;

    const matched = findToolsDataByPathname(pathname);
    if (!matched && visible) {
      setVisible(false);
      setContentReady(false);
      maskBackground(false);
    }
  }, [pathname, visible]);

  useEffect(() => {
    if (!visible) maskBackground(false);
  }, [visible]);

  const value = useMemo(
    () => ({
      openToolModal,
      closeToolModal,
      isOpen: visible,
    }),
    [openToolModal, closeToolModal, visible],
  );

  const docModel = active ? getToolModalDocModel(active.slug, active.title) : null;
  const relatedTools = active ? getToolModalRelatedTools(active.slug) : [];
  const relatedArticles = active ? getToolModalRelatedArticles(active.slug) : [];
  const embedSrc = active ? buildToolEmbedHref(active.href, locale) : "";

  const openRelatedTool = useCallback(
    (tool: ToolModalRelatedTool) => {
      openToolModal({
        slug: tool.slug,
        href: tool.href,
        title: tool.title,
        description: tool.description,
      });
    },
    [openToolModal],
  );

  const loadingLabel = t.has("loading") ? t("loading") : "Loading tool…";

  return (
    <ToolModalContext.Provider value={value}>
      {children}
      {active && docModel ? (
        <ToolModalWrapper
          open={visible}
          title={active.title}
          slug={active.slug}
          onClose={closeToolModal}
          onExitComplete={handleExitComplete}
          contentReady={contentReady || Boolean(active.calc)}
          labels={{
            calc: t("calc"),
            doc: t("doc"),
            related: t("related"),
            close: t("close"),
            loading: loadingLabel,
            addFavorite: t("addFavorite"),
            removeFavorite: t("removeFavorite"),
          }}
          calc={
            active.calc ?? (
              <ToolModalCalcFrame
                key={active.slug}
                src={embedSrc}
                title={active.title}
                loadingLabel={loadingLabel}
                onReadyChange={setContentReady}
              />
            )
          }
          docs={
            active.docs ?? (
              <ToolModalDocsPanel
                model={docModel}
                labels={{
                  overview: t("overview"),
                  howItWorks: t("howItWorks"),
                  useCases: t("useCases"),
                  faq: t("faq"),
                  keyword: t("keyword"),
                  loading: loadingLabel,
                  expandAll: t("expandAll"),
                  collapseAll: t("collapseAll"),
                }}
              />
            )
          }
          related={
            active.related ?? (
              <ToolModalRelatedPanel
                tools={relatedTools}
                articles={relatedArticles}
                onOpenTool={openRelatedTool}
                labels={{
                  toolsHeading: t("alsoCheckOut"),
                  articlesHeading: t("guidesArticles"),
                  empty: t("relatedEmpty"),
                }}
              />
            )
          }
        />
      ) : null}
    </ToolModalContext.Provider>
  );
}

export { toOpenOptionsFromSlug };
