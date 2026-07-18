"use client";

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
import { ArticleModal } from "@/components/ArticleModal";

type OpenArticleModalOptions = {
  slug: string;
  href: string;
  title: string;
};

type ArticleModalContextValue = {
  openArticleModal: (options: OpenArticleModalOptions) => void;
  closeArticleModal: () => void;
  isOpen: boolean;
};

const ArticleModalContext = createContext<ArticleModalContextValue | null>(null);

const SCROLL_KEY = "joinmypdf:blog-scroll-y";

function rememberBlogScroll() {
  try {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
  } catch {
    // ignore
  }
}

function restoreBlogScroll() {
  try {
    const raw = sessionStorage.getItem(SCROLL_KEY);
    if (raw == null) return;
    const y = Number(raw);
    if (!Number.isFinite(y)) return;
    requestAnimationFrame(() => {
      window.scrollTo(0, y);
      requestAnimationFrame(() => window.scrollTo(0, y));
    });
  } catch {
    // ignore
  }
}

/**
 * Soft-opens blog articles in ArticleModal (ToolModal-style history sync)
 * so the blog index stays mounted and scroll position is preserved.
 */
export function ArticleModalProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("Blog");
  const [active, setActive] = useState<OpenArticleModalOptions | null>(null);

  const closeArticleModal = useCallback(() => {
    setActive(null);
  }, []);

  const openArticleModal = useCallback((options: OpenArticleModalOptions) => {
    rememberBlogScroll();
    window.history.pushState(
      { articleModal: options.slug, returnScroll: window.scrollY },
      "",
      options.href,
    );
    setActive(options);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      if (!active) return;
      setActive(null);
      restoreBlogScroll();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [active]);

  const value = useMemo(
    () => ({
      openArticleModal,
      closeArticleModal,
      isOpen: Boolean(active),
    }),
    [openArticleModal, closeArticleModal, active],
  );

  return (
    <ArticleModalContext.Provider value={value}>
      <div data-article-modal-root="" className="contents">
        {children}
      </div>
      {active ? (
        <ArticleModal
          title={active.title}
          closeLabel={t("articleModalClose")}
          onClose={() => {
            const shouldBack = Boolean(window.history.state?.articleModal);
            closeArticleModal();
            if (shouldBack) window.history.back();
            restoreBlogScroll();
          }}
        >
          <iframe
            title={active.title}
            src={`${active.href.replace(/\/?$/, "")}/embed`}
            className="article-modal__frame"
          />
        </ArticleModal>
      ) : null}
    </ArticleModalContext.Provider>
  );
}

export function useArticleModal() {
  return useContext(ArticleModalContext);
}
