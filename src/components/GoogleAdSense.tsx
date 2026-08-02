import Script from "next/script";

export const ADSENSE_CLIENT_ID = "ca-pub-3711924762921897";

/** AdSense loader — deferred so it does not compete with LCP / TBT on first paint. */
export function GoogleAdSense() {
  return (
    <Script
      id="google-adsense"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      strategy="lazyOnload"
      crossOrigin="anonymous"
    />
  );
}
