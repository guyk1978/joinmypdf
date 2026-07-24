/**
 * Local sample favicons for the Favicon Previewer preset library.
 * All glyphs are inline SVG — no external asset or network fetch.
 */

export type FaviconPresetCategoryId =
  | "tech"
  | "ecommerce"
  | "minimalist"
  | "emoji"
  | "social";

export type FaviconPreviewPreset = {
  id: string;
  category: FaviconPresetCategoryId;
  /** i18n key under FaviconPreviewer.presets.* */
  titleKey: string;
  /** Suggested browser tab / home-screen title when applied */
  suggestedTitle: string;
  fileStem: string;
  svg: string;
};

export const FAVICON_PRESET_CATEGORY_IDS: FaviconPresetCategoryId[] = [
  "tech",
  "ecommerce",
  "minimalist",
  "emoji",
  "social",
];

function svgRoot(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="128" height="128">${body}</svg>`;
}

function roundedBg(fill: string, radius = 14): string {
  return `<rect width="64" height="64" rx="${radius}" fill="${fill}"/>`;
}

export const FAVICON_PREVIEW_PRESETS: FaviconPreviewPreset[] = [
  /* —— Tech / SaaS —— */
  {
    id: "pulse-saas",
    category: "tech",
    titleKey: "pulseSaaS",
    suggestedTitle: "Pulse",
    fileStem: "pulse-saas",
    svg: svgRoot(
      `${roundedBg("#0B1220")}<circle cx="32" cy="32" r="18" fill="none" stroke="#38BDF8" stroke-width="4"/><circle cx="32" cy="32" r="6" fill="#38BDF8"/><path d="M14 32h8M42 32h8M32 14v8M32 42v8" stroke="#7DD3FC" stroke-width="3" stroke-linecap="round"/>`,
    ),
  },
  {
    id: "orbit-api",
    category: "tech",
    titleKey: "orbitApi",
    suggestedTitle: "Orbit API",
    fileStem: "orbit-api",
    svg: svgRoot(
      `${roundedBg("#111827")}<ellipse cx="32" cy="32" rx="22" ry="10" fill="none" stroke="#A78BFA" stroke-width="3" transform="rotate(-24 32 32)"/><ellipse cx="32" cy="32" rx="22" ry="10" fill="none" stroke="#6366F1" stroke-width="3" transform="rotate(24 32 32)"/><circle cx="32" cy="32" r="5" fill="#C4B5FD"/>`,
    ),
  },
  {
    id: "stack-cloud",
    category: "tech",
    titleKey: "stackCloud",
    suggestedTitle: "Stack Cloud",
    fileStem: "stack-cloud",
    svg: svgRoot(
      `${roundedBg("#0F172A")}<path d="M18 40h28a8 8 0 0 0 0-16 12 12 0 0 0-23-3A9 9 0 0 0 18 40Z" fill="#38BDF8"/><rect x="24" y="28" width="16" height="3.5" rx="1" fill="#0F172A"/><rect x="26" y="34" width="12" height="3.5" rx="1" fill="#0F172A"/>`,
    ),
  },
  {
    id: "neon-dev",
    category: "tech",
    titleKey: "neonDev",
    suggestedTitle: "Neon Dev",
    fileStem: "neon-dev",
    svg: svgRoot(
      `${roundedBg("#020617")}<path d="M18 44 32 12l14 32H40l-8-19-8 19H18Z" fill="none" stroke="#22D3EE" stroke-width="3.5" stroke-linejoin="round"/><path d="M24 34h16" stroke="#67E8F9" stroke-width="3" stroke-linecap="round"/>`,
    ),
  },
  {
    id: "hex-labs",
    category: "tech",
    titleKey: "hexLabs",
    suggestedTitle: "Hex Labs",
    fileStem: "hex-labs",
    svg: svgRoot(
      `${roundedBg("#18181B")}<path d="M32 10 50 20v24L32 54 14 44V20Z" fill="none" stroke="#F59E0B" stroke-width="3.5" stroke-linejoin="round"/><path d="M32 22v20M22 28l20 12M42 28 22 40" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round"/>`,
    ),
  },

  /* —— E-commerce —— */
  {
    id: "cart-shop",
    category: "ecommerce",
    titleKey: "cartShop",
    suggestedTitle: "Cart Shop",
    fileStem: "cart-shop",
    svg: svgRoot(
      `${roundedBg("#1C1917")}<path d="M14 18h6l4 22h22l4-14H26" fill="none" stroke="#FB923C" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="28" cy="48" r="3.5" fill="#FDBA74"/><circle cx="44" cy="48" r="3.5" fill="#FDBA74"/>`,
    ),
  },
  {
    id: "bag-market",
    category: "ecommerce",
    titleKey: "bagMarket",
    suggestedTitle: "Bag Market",
    fileStem: "bag-market",
    svg: svgRoot(
      `${roundedBg("#1E1B4B")}<path d="M20 26h24l-2 24H22Z" fill="#818CF8"/><path d="M26 26c0-6 12-6 12 0" fill="none" stroke="#C7D2FE" stroke-width="3.5" stroke-linecap="round"/>`,
    ),
  },
  {
    id: "tag-sale",
    category: "ecommerce",
    titleKey: "tagSale",
    suggestedTitle: "Tag Sale",
    fileStem: "tag-sale",
    svg: svgRoot(
      `${roundedBg("#14532D")}<path d="M14 28 34 12h16v16L30 48Z" fill="#4ADE80"/><circle cx="44" cy="22" r="3.5" fill="#14532D"/>`,
    ),
  },
  {
    id: "store-front",
    category: "ecommerce",
    titleKey: "storeFront",
    suggestedTitle: "Storefront",
    fileStem: "store-front",
    svg: svgRoot(
      `${roundedBg("#292524")}<path d="M14 28 20 16h24l6 12v24H14Z" fill="#F97316"/><rect x="26" y="34" width="12" height="18" fill="#1C1917"/><path d="M14 28h36" stroke="#FED7AA" stroke-width="3"/>`,
    ),
  },

  /* —— Minimalist —— */
  {
    id: "mono-mark",
    category: "minimalist",
    titleKey: "monoMark",
    suggestedTitle: "Mono",
    fileStem: "mono-mark",
    svg: svgRoot(
      `${roundedBg("#09090B")}<circle cx="32" cy="32" r="16" fill="#FAFAFA"/>`,
    ),
  },
  {
    id: "dot-mark",
    category: "minimalist",
    titleKey: "dotMark",
    suggestedTitle: "Dot",
    fileStem: "dot-mark",
    svg: svgRoot(
      `${roundedBg("#18181B")}<circle cx="22" cy="32" r="5" fill="#E4E4E7"/><circle cx="42" cy="32" r="5" fill="#71717A"/>`,
    ),
  },
  {
    id: "line-mark",
    category: "minimalist",
    titleKey: "lineMark",
    suggestedTitle: "Line",
    fileStem: "line-mark",
    svg: svgRoot(
      `${roundedBg("#0A0A0A")}<path d="M16 40 32 16 48 40" fill="none" stroke="#F4F4F5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    ),
  },
  {
    id: "square-mark",
    category: "minimalist",
    titleKey: "squareMark",
    suggestedTitle: "Square",
    fileStem: "square-mark",
    svg: svgRoot(
      `${roundedBg("#111111")}<rect x="18" y="18" width="28" height="28" rx="4" fill="none" stroke="#A1A1AA" stroke-width="4"/>`,
    ),
  },
  {
    id: "arc-mark",
    category: "minimalist",
    titleKey: "arcMark",
    suggestedTitle: "Arc",
    fileStem: "arc-mark",
    svg: svgRoot(
      `${roundedBg("#0C0C0C")}<path d="M16 42a20 20 0 0 1 32 0" fill="none" stroke="#D4D4D8" stroke-width="4.5" stroke-linecap="round"/>`,
    ),
  },

  /* —— Emoji-style icons —— */
  {
    id: "emoji-rocket",
    category: "emoji",
    titleKey: "emojiRocket",
    suggestedTitle: "Rocket",
    fileStem: "emoji-rocket",
    svg: svgRoot(
      `${roundedBg("#1E3A8A")}<path d="M32 10c8 8 12 18 12 26l-8 4-4-8-4 8-8-4c0-8 4-18 12-26Z" fill="#F8FAFC"/><circle cx="36" cy="24" r="3.5" fill="#3B82F6"/><path d="M22 44c-4 2-8 8-6 10 2 0 8-2 10-6M42 44c4 2 8 8 6 10-2 0-8-2-10-6" fill="#F97316"/>`,
    ),
  },
  {
    id: "emoji-star",
    category: "emoji",
    titleKey: "emojiStar",
    suggestedTitle: "Star",
    fileStem: "emoji-star",
    svg: svgRoot(
      `${roundedBg("#422006")}<path d="M32 12l5.5 11.5L50 26l-9 8.5L43.5 48 32 41.5 20.5 48 23 34.5 14 26l12.5-2.5Z" fill="#FBBF24"/>`,
    ),
  },
  {
    id: "emoji-fire",
    category: "emoji",
    titleKey: "emojiFire",
    suggestedTitle: "Fire",
    fileStem: "emoji-fire",
    svg: svgRoot(
      `${roundedBg("#450A0A")}<path d="M32 12c8 10 16 14 16 26a16 16 0 0 1-32 0c0-8 6-14 10-18-2 6 2 10 6 10 0-6 2-12 0-18Z" fill="#FB923C"/><path d="M32 34c3 2 6 4 6 8a6 6 0 0 1-12 0c0-3 2-5 4-6 0-2 1-4 2-2Z" fill="#FDE68A"/>`,
    ),
  },
  {
    id: "emoji-spark",
    category: "emoji",
    titleKey: "emojiSpark",
    suggestedTitle: "Spark",
    fileStem: "emoji-spark",
    svg: svgRoot(
      `${roundedBg("#312E81")}<path d="M32 10v12M32 42v12M10 32h12M42 32h12M18 18l8 8M38 38l8 8M46 18l-8 8M26 38l-8 8" stroke="#A5B4FC" stroke-width="3.5" stroke-linecap="round"/><circle cx="32" cy="32" r="5" fill="#EEF2FF"/>`,
    ),
  },
  {
    id: "emoji-heart",
    category: "emoji",
    titleKey: "emojiHeart",
    suggestedTitle: "Heart",
    fileStem: "emoji-heart",
    svg: svgRoot(
      `${roundedBg("#4C0519")}<path d="M32 48 14 30a10 10 0 0 1 16-12 10 10 0 0 1 16 12Z" fill="#FB7185"/>`,
    ),
  },

  /* —— Social —— */
  {
    id: "share-node",
    category: "social",
    titleKey: "shareNode",
    suggestedTitle: "Share",
    fileStem: "share-node",
    svg: svgRoot(
      `${roundedBg("#0F172A")}<circle cx="18" cy="32" r="6" fill="#38BDF8"/><circle cx="46" cy="18" r="6" fill="#38BDF8"/><circle cx="46" cy="46" r="6" fill="#38BDF8"/><path d="M23 29l15-9M23 35l15 9" stroke="#7DD3FC" stroke-width="3.5" stroke-linecap="round"/>`,
    ),
  },
  {
    id: "chat-bubble",
    category: "social",
    titleKey: "chatBubble",
    suggestedTitle: "Chat",
    fileStem: "chat-bubble",
    svg: svgRoot(
      `${roundedBg("#172554")}<path d="M14 18h36v26H28l-8 8v-8H14Z" fill="#60A5FA"/><circle cx="26" cy="31" r="2.5" fill="#172554"/><circle cx="32" cy="31" r="2.5" fill="#172554"/><circle cx="38" cy="31" r="2.5" fill="#172554"/>`,
    ),
  },
  {
    id: "like-mark",
    category: "social",
    titleKey: "likeMark",
    suggestedTitle: "Like",
    fileStem: "like-mark",
    svg: svgRoot(
      `${roundedBg("#1E1B4B")}<path d="M20 28h8V18l12 14H28v12l-12-14Z" fill="#A78BFA"/><rect x="36" y="28" width="12" height="18" rx="2" fill="#C4B5FD"/>`,
    ),
  },
  {
    id: "wave-signal",
    category: "social",
    titleKey: "waveSignal",
    suggestedTitle: "Signal",
    fileStem: "wave-signal",
    svg: svgRoot(
      `${roundedBg("#042F2E")}<path d="M18 40c8-16 20-16 28 0" fill="none" stroke="#2DD4BF" stroke-width="4" stroke-linecap="round"/><path d="M22 46c6-10 14-10 20 0" fill="none" stroke="#5EEAD4" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="50" r="3" fill="#99F6E4"/>`,
    ),
  },
];

export function getFaviconPresetsByCategory(
  category: FaviconPresetCategoryId,
): FaviconPreviewPreset[] {
  return FAVICON_PREVIEW_PRESETS.filter((preset) => preset.category === category);
}

export function faviconPresetPreviewDataUrl(preset: FaviconPreviewPreset): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(preset.svg)}`;
}

export function createFaviconPresetFile(preset: FaviconPreviewPreset): File {
  const blob = new Blob([preset.svg], { type: "image/svg+xml" });
  return new File([blob], `${preset.fileStem}.svg`, { type: "image/svg+xml" });
}
