import { FOOTER_TOOL_COLUMNS, type FooterColumn, type FooterLink } from "@/lib/footer-directory";

export type DirectoryToolItem = FooterLink & { slug: string };

export type DirectorySection = FooterColumn & {
  items: DirectoryToolItem[];
};

export function buildToolsDirectorySections(): DirectorySection[] {
  return FOOTER_TOOL_COLUMNS.map((column) => ({
    ...column,
    items: column.links.filter((link): link is DirectoryToolItem => Boolean(link.slug)),
  }));
}
