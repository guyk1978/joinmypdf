import Script from "next/script";

/** Loads subscription/bookmark modal logic (post-download trigger only). */
export function EmailPopupScript() {
  return <Script src="/assets/js/email-popup.js" strategy="afterInteractive" />;
}
