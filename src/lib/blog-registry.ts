import type { BlogRegistry } from "./types";
import raw from "../../assets/data/blog.json";
import editorial from "../data/blog-registry.json";
import { mergeBlogRegistry } from "./merge-blog-registry";

export const blogRegistry = mergeBlogRegistry(raw as BlogRegistry, editorial as BlogRegistry);
