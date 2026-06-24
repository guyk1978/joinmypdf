/** Industrial dark glassmorphism theme tokens for the homepage. */
export const HOME_HERO_BG = {
  dark: { en: "#000000", he: "#000000" },
  light: { en: "#ffffff", he: "#ffffff" },
} as const;

export const HOME_GRID_THEME = {
  light: {
    cardBg: "#ffffff",
    cardBgHover: "#f5f5f5",
    cardText: "#000000",
    iconBg: "transparent",
    iconBgHover: "transparent",
    muted: "#737373",
  },
  dark: {
    cardBg: "#0a0a0a",
    cardBgHover: "#171717",
    cardText: "#ffffff",
    iconBg: "transparent",
    iconBgHover: "transparent",
    muted: "#a3a3a3",
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
