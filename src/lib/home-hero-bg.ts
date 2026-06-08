/** Flat background colors sampled from homepage header banners (upper field area). */
export const HOME_HERO_BG = {
  dark: { en: "#0a0b10", he: "#0a0b10" },
  light: { en: "#fefefe", he: "#fefefe" },
} as const;

export const HOME_GRID_THEME = {
  light: {
    cardBg: "#e5e6de",
    cardBgHover: "#ecece5",
    cardText: "#2a3d52",
    iconBg: "#d8d9d1",
    iconBgHover: "#dfe0d8",
    muted: "#8a8378",
  },
  dark: {
    cardBg: "#262626",
    cardBgHover: "#2e2e2e",
    cardText: "#f0f0f0",
    iconBg: "#303030",
    iconBgHover: "#383838",
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
  };
}

/** @deprecated Use getHomePageThemeVars */
export function getHomePageBgColor(locale: string, isLight: boolean): string {
  return getHomePageThemeVars(locale, isLight)["--home-page-bg"];
}
