"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FileClock } from "lucide-react";
import { IndustrialToolCard } from "@/components/IndustrialToolCard";
import { ToolListIcon } from "@/components/ToolListIcon";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { HomeSection } from "@/components/homepage/HomeSection";
import { HOME_SECTION_MAX_ITEMS } from "@/components/homepage/home-section";
import {
  RECENT_ACTIVITY_CHANGED_EVENT,
  readRecentWorkspaces,
  type RecentWorkspaceEntry,
} from "@/lib/recent-activity";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { getToolCardDescription } from "@/data/tool-card-descriptions";
import { resolveInventoryToolLabel } from "@/lib/tools-inventory-query";

type RecentWorkspacesProps = {
  locale: string;
};

function formatRelativeTime(at: number, locale: string): string {
  const diffMs = at - Date.now();
  const minutes = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  return rtf.format(Math.round(hours / 24), "day");
}

/**
 * "Recent Workspaces" — up to 20 recent files as category-style cards.
 */
export function RecentWorkspaces({ locale }: RecentWorkspacesProps) {
  const t = useTranslations("Home");
  const tTools = useTranslations("Tools");
  const [entries, setEntries] = useState<RecentWorkspaceEntry[]>([]);

  useEffect(() => {
    const sync = () => setEntries(readRecentWorkspaces());
    sync();
    window.addEventListener(RECENT_ACTIVITY_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(RECENT_ACTIVITY_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const items = useMemo(() => {
    const resolved = [];
    for (const entry of entries) {
      const inventory = getToolsInventoryEntry(entry.toolId);
      if (!inventory) continue;
      const toolTitle = resolveInventoryToolLabel(entry.toolId, tTools);
      const toolDescription =
        getToolCardDescription(entry.toolId, inventory.description, tTools) ?? "";
      const when = formatRelativeTime(entry.at, locale);
      resolved.push({
        key: `${entry.toolId}:${entry.fileName}`,
        toolId: entry.toolId,
        href: resolveToolHref(entry.toolId, inventory.primaryCategory, locale),
        label: toolTitle,
        description: [entry.fileName, when, toolDescription].filter(Boolean).join(" · "),
        categoryId: inventory.primaryCategory,
      });
      if (resolved.length >= HOME_SECTION_MAX_ITEMS) break;
    }
    return resolved;
  }, [entries, locale, tTools]);

  if (!items.length) return null;

  return (
    <HomeReveal className="w-full">
      <HomeSection
        id="recent-workspaces-title"
        title={t("landing.recentTitle")}
        icon={<FileClock size={22} strokeWidth={1.75} />}
      >
        {items.map(({ key, toolId, href, label, description, categoryId }) => (
          <IndustrialToolCard
            key={key}
            href={href}
            label={label}
            description={description}
            slug={toolId}
            categoryId={categoryId}
            icon={<ToolListIcon slug={toolId} label={label} size="md" />}
          />
        ))}
      </HomeSection>
    </HomeReveal>
  );
}
