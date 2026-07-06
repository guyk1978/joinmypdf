"use client";

import { HeaderCategoryButtons, HeaderCategoryNavProvider, HeaderAllToolsButton } from "@/components/HeaderCategoryNav";
import type { HeaderCategoryId } from "@/lib/tool-registry";

type HeaderNavProps = {
  open?: boolean;
  activeCategory?: HeaderCategoryId;
  onOpenChange?: (open: boolean) => void;
  onCategoryChange?: (category: HeaderCategoryId) => void;
  onNavigate?: () => void;
};

export function HeaderNav({
  open,
  activeCategory,
  onOpenChange,
  onCategoryChange,
  onNavigate,
}: HeaderNavProps) {
  return (
    <div className="site-header__primary-nav">
      <HeaderCategoryNavProvider
        open={open}
        activeCategory={activeCategory}
        onOpenChange={onOpenChange}
        onCategoryChange={onCategoryChange}
        onNavigate={onNavigate}
      >
        <HeaderCategoryButtons />
        <HeaderAllToolsButton />
      </HeaderCategoryNavProvider>
    </div>
  );
}
