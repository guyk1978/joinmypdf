import type { BlogRegistry } from "./types";
import raw from "../../assets/data/blog.json";
import editorial from "../data/blog-registry.json";
import rawHe from "../../assets/data/blog-he.json";
import editorialHe from "../data/blog-registry-he.json";
import { mergeBlogRegistry } from "./merge-blog-registry";

const englishRegistry = mergeBlogRegistry(raw as BlogRegistry, editorial as BlogRegistry);

/** Default English registry (backward compatible). */
export const blogRegistry = englishRegistry;

/** Locale-aware blog registry; Hebrew posts override English by slug. */
export function getBlogRegistry(locale?: string): BlogRegistry {
  if (locale !== "he") return englishRegistry;
  return mergeBlogRegistry(englishRegistry, rawHe as BlogRegistry, editorialHe as BlogRegistry);
}
