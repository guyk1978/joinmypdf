export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __joinmypdfGaMissingIdWarned?: boolean;
  }
}

function warnMissingMeasurementId(context?: string): void {
  if (typeof window === "undefined" || GA_MEASUREMENT_ID || window.__joinmypdfGaMissingIdWarned) {
    return;
  }

  window.__joinmypdfGaMissingIdWarned = true;
  const suffix = context ? ` (${context})` : "";
  console.warn(`Google Analytics Measurement ID is not defined.${suffix}`);
}

export function isGoogleAnalyticsConfigured(): boolean {
  return Boolean(GA_MEASUREMENT_ID);
}

function ensureGtagStub(): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
}

export const pageview = (url: string) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function" && GA_MEASUREMENT_ID) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
    return;
  }

  if (!GA_MEASUREMENT_ID) {
    console.warn("Google Analytics Measurement ID is not defined.");
  }
};

const CONSENT_UPDATE = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
} as const;

/** Update Consent Mode when the user accepts or declines the cookie banner (no refresh required). */
export function updateConsent(granted: boolean): void {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") {
    warnMissingMeasurementId("updateConsent");
    return;
  }

  ensureGtagStub();
  window.gtag?.("consent", "update", {
    ...CONSENT_UPDATE,
    analytics_storage: granted ? "granted" : "denied",
  });

  if (granted) {
    pageview(`${window.location.pathname}${window.location.search}`);
  }
}

export function enableGoogleAnalytics(): void {
  updateConsent(true);
}

export function disableGoogleAnalytics(): void {
  updateConsent(false);
}
