export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __joinmypdfGaLoaded?: boolean;
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

/** Consent Mode v2 defaults — call before gtag.js loads if scripts are injected early. */
export function setGoogleConsentDefaults(): void {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });
}

export function grantGoogleAnalyticsConsent(): void {
  if (!window.gtag) setGoogleConsentDefaults();
  window.gtag?.("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "granted",
  });
}

export function denyGoogleAnalyticsConsent(): void {
  if (!window.gtag) setGoogleConsentDefaults();
  window.gtag?.("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });
}

export function enableGoogleAnalytics(): void {
  if (!GA_MEASUREMENT_ID || typeof document === "undefined") {
    warnMissingMeasurementId("enableGoogleAnalytics");
    return;
  }

  if (window.__joinmypdfGaLoaded) {
    grantGoogleAnalyticsConsent();
    pageview(`${window.location.pathname}${window.location.search}`);
    return;
  }

  setGoogleConsentDefaults();

  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  script.onload = () => {
    window.gtag?.("js", new Date());
    grantGoogleAnalyticsConsent();
    window.gtag?.("config", GA_MEASUREMENT_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    pageview(`${window.location.pathname}${window.location.search}`);
  };
  document.head.appendChild(script);
  window.__joinmypdfGaLoaded = true;
}

export function disableGoogleAnalytics(): void {
  denyGoogleAnalyticsConsent();
}
