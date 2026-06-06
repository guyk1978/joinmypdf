import {
  FOOTER_TOOL_COLUMNS,
  type FooterColumn,
  type FooterToolLink,
} from "@/lib/footer-directory";

export type DirectoryToolItem = FooterToolLink;

export type DirectorySection = Pick<FooterColumn, "titleKey"> & {
  items: DirectoryToolItem[];
};

export function buildToolsDirectorySections(): DirectorySection[] {
  return FOOTER_TOOL_COLUMNS.map((column) => ({
    titleKey: column.titleKey,
    items: column.links.filter((link): link is FooterToolLink => link.kind === "tool"),
  }));
}
