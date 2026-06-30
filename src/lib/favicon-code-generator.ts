export const DEFAULT_FAVICON_PATH = "/favicon.ico";

export type FaviconLinkTag = {
  rel: string;
  href: string;
  type?: string;
  sizes?: string;
};

export function normalizeFaviconPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return DEFAULT_FAVICON_PATH;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function joinAssetPath(dir: string, filename: string): string {
  if (!dir) return `/${filename}`.replace(/\/{2,}/g, "/");
  return `${dir.replace(/\/$/, "")}/${filename}`;
}

export function parseFaviconPath(path: string): {
  dir: string;
  filename: string;
  base: string;
  ext: string;
} {
  const normalized = normalizeFaviconPath(path);
  const withoutQuery = normalized.split("?")[0] ?? normalized;
  const lastSlash = withoutQuery.lastIndexOf("/");
  const dir = lastSlash > 0 ? withoutQuery.slice(0, lastSlash) : "";
  const filename =
    lastSlash >= 0 ? withoutQuery.slice(lastSlash + 1) : withoutQuery.replace(/^\//, "");
  const dot = filename.lastIndexOf(".");
  const base = dot > 0 ? filename.slice(0, dot) : filename || "favicon";
  const ext = dot > 0 ? filename.slice(dot + 1).toLowerCase() : "";

  return { dir, filename, base, ext };
}

export function buildFaviconLinkTags(faviconPath: string): FaviconLinkTag[] {
  const path = normalizeFaviconPath(faviconPath);
  const { dir, filename, base, ext } = parseFaviconPath(path);
  const tags: FaviconLinkTag[] = [];
  const usedHrefs = new Set<string>();

  const add = (tag: FaviconLinkTag) => {
    if (usedHrefs.has(tag.href)) return;
    usedHrefs.add(tag.href);
    tags.push(tag);
  };

  const asset = (name: string) => joinAssetPath(dir, name);

  if (ext === "svg") {
    add({ rel: "icon", type: "image/svg+xml", href: path });
  } else if (ext === "png") {
    const sizeMatch = filename.match(/(\d+)x(\d+)/i);
    if (sizeMatch) {
      add({
        rel: "icon",
        type: "image/png",
        sizes: `${sizeMatch[1]}x${sizeMatch[2]}`,
        href: path,
      });
    } else {
      add({ rel: "icon", type: "image/png", href: path });
    }
  } else if (ext === "ico") {
    add({ rel: "icon", href: path, sizes: "any" });
  } else if (ext === "jpg" || ext === "jpeg") {
    add({ rel: "icon", type: "image/jpeg", href: path });
  } else {
    add({ rel: "icon", href: path });
  }

  if (ext !== "ico") {
    add({ rel: "icon", href: asset("favicon.ico"), sizes: "any" });
  }

  add({ rel: "icon", type: "image/png", sizes: "32x32", href: asset("favicon-32x32.png") });
  add({ rel: "icon", type: "image/png", sizes: "16x16", href: asset("favicon-16x16.png") });
  add({ rel: "apple-touch-icon", sizes: "180x180", href: asset("apple-touch-icon.png") });
  add({
    rel: "icon",
    type: "image/png",
    sizes: "192x192",
    href: asset("android-chrome-192x192.png"),
  });
  add({
    rel: "icon",
    type: "image/png",
    sizes: "512x512",
    href: asset("android-chrome-512x512.png"),
  });
  add({ rel: "manifest", href: asset("site.webmanifest") });

  if (ext !== "svg") {
    add({ rel: "icon", type: "image/svg+xml", href: asset(`${base}.svg`) });
  }

  return tags;
}

export function renderFaviconLinkTag(tag: FaviconLinkTag): string {
  const parts = [`<link rel="${tag.rel}"`];
  if (tag.type) parts.push(` type="${tag.type}"`);
  if (tag.sizes) parts.push(` sizes="${tag.sizes}"`);
  parts.push(` href="${tag.href}">`);
  return parts.join("");
}

export function buildFaviconHtmlSnippet(faviconPath: string): string {
  return buildFaviconLinkTags(faviconPath).map(renderFaviconLinkTag).join("\n");
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

const LINK_TAG_PATTERN =
  /^<link rel="([^"]*)"(?: type="([^"]*)")?(?: sizes="([^"]*)")? href="([^"]*)">$/;

export type HighlightedHtmlToken =
  | { kind: "plain"; text: string }
  | { kind: "tag"; text: string }
  | { kind: "attr"; text: string }
  | { kind: "value"; text: string };

export function tokenizeFaviconHtmlLine(line: string): HighlightedHtmlToken[] {
  const match = line.match(LINK_TAG_PATTERN);
  if (!match) return [{ kind: "plain", text: line }];

  const [, rel, type, sizes, href] = match;
  const tokens: HighlightedHtmlToken[] = [
    { kind: "plain", text: "<" },
    { kind: "tag", text: "link" },
    { kind: "plain", text: " " },
    { kind: "attr", text: "rel" },
    { kind: "plain", text: "=" },
    { kind: "value", text: `"${rel}"` },
  ];

  if (type) {
    tokens.push(
      { kind: "plain", text: " " },
      { kind: "attr", text: "type" },
      { kind: "plain", text: "=" },
      { kind: "value", text: `"${type}"` },
    );
  }

  if (sizes) {
    tokens.push(
      { kind: "plain", text: " " },
      { kind: "attr", text: "sizes" },
      { kind: "plain", text: "=" },
      { kind: "value", text: `"${sizes}"` },
    );
  }

  tokens.push(
    { kind: "plain", text: " " },
    { kind: "attr", text: "href" },
    { kind: "plain", text: "=" },
    { kind: "value", text: `"${href}"` },
    { kind: "plain", text: ">" },
  );

  return tokens;
}
