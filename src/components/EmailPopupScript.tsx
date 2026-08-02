import Script from "next/script";

export function EmailPopupScript() {
  return <Script src="/assets/js/email-popup.js" strategy="lazyOnload" />;
}
