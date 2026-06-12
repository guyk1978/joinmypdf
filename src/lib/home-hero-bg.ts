/** Industrial dark glassmorphism theme tokens for the homepage. */
export const HOME_HERO_BG = {
  dark: { en: "#0c0e12", he: "#0c0e12" },
  light: { en: "#f4f5f7", he: "#f4f5f7" },
} as const;

export const HOME_GRID_THEME = {
  light: {
    cardBg: "rgba(255, 255, 255, 0.72)",
    cardBgHover: "rgba(255, 255, 255, 0.88)",
    cardText: "#0f172a",
    iconBg: "rgba(255, 255, 255, 0.9)",
    iconBgHover: "rgba(255, 255, 255, 0.98)",
    muted: "#64748b",
  },
  dark: {
    cardBg: "rgba(23, 23, 23, 0.5)",
    cardBgHover: "rgba(255, 255, 255, 0.06)",
    cardText: "#fafafa",
    iconBg: "rgba(255, 255, 255, 0.06)",
    iconBgHover: "rgba(255, 255, 255, 0.1)",
    muted: "#94a3b8",
  },
} as const;

export type HomePageThemeVars = {
  "--home-page-bg": string;
  "--home-card-bg": string;
  "--home-card-bg-hover": string;
  "--home-card-text": string;
  "--home-icon-bg": string;
  "--home-icon-bg-hover": string;
  "--home-card-muted": string;
  "--home-card-border": string;
  "--home-card-border-hover": string;
};

export function getHomePageThemeVars(locale: string, isLight: boolean): HomePageThemeVars {
  const lang = locale === "he" ? "he" : "en";
  const palette = isLight ? HOME_GRID_THEME.light : HOME_GRID_THEME.dark;

  return {
    "--home-page-bg": isLight ? HOME_HERO_BG.light[lang] : HOME_HERO_BG.dark[lang],
    "--home-card-bg": palette.cardBg,
    "--home-card-bg-hover": palette.cardBgHover,
    "--home-card-text": palette.cardText,
    "--home-icon-bg": palette.iconBg,
    "--home-icon-bg-hover": palette.iconBgHover,
    "--home-card-muted": palette.muted,
    "--home-card-border": isLight ? "rgb(229, 229, 229)" : "rgb(38, 38, 38)",
    "--home-card-border-hover": isLight ? "rgb(163, 163, 163)" : "rgb(82, 82, 82)",
  };
}

/** @deprecated Use getHomePageThemeVars */
export function getHomePageBgColor(locale: string, isLight: boolean): string {
  return getHomePageThemeVars(locale, isLight)["--home-page-bg"];
}
