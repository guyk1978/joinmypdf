export const COOKIE_CONSENT_KEY = "joinmypdf-cookie-consent";

export type CookieConsentChoice = "accepted" | "declined";

export function getCookieConsent(): CookieConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (value === "accepted" || value === "declined") return value;
    return null;
  } catch {
    return null;
  }
}

export function setCookieConsent(choice: CookieConsentChoice): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, choice);
  } catch {
    /* ignore quota / private mode */
  }
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent() === "accepted";
}
