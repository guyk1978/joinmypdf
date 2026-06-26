export const ADSENSE_CLIENT_ID = "ca-pub-3711924762921897";

/** AdSense loader — rendered in `<head>` on every page via root layout. */
export function GoogleAdSense() {
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
    />
  );
}
