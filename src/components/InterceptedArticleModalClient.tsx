"use client";

import type { ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { ArticleModal } from "@/components/ArticleModal";

type Props = {
  title: string;
  closeLabel: string;
  children: ReactNode;
};

/** Client wrapper so the intercepting RSC page can close via history.back(). */
export function InterceptedArticleModalClient({ title, closeLabel, children }: Props) {
  const router = useRouter();

  return (
    <ArticleModal title={title} closeLabel={closeLabel} onClose={() => router.back()}>
      {children}
    </ArticleModal>
  );
}
