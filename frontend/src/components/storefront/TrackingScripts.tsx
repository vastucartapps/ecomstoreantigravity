/**
 * Injects third-party tracking scripts (GA4, Meta Pixel, Chatwoot) when
 * their respective integrations are connected and configured.
 *
 * Uses next/script with strategy="afterInteractive" so scripts load after
 * the page is interactive — no blocking of the critical rendering path.
 *
 * This component is rendered in the storefront layout server component and
 * receives only PUBLIC-SAFE config fields (no API keys or secrets).
 */

import Script from "next/script"

interface TrackingConfig {
  ga4: { isConnected: boolean; measurementId: string } | null
  metaPixel: { isConnected: boolean; pixelId: string } | null
  chatwoot: {
    isConnected: boolean
    websiteToken: string
    baseUrl: string
  } | null
}

export function TrackingScripts({ config }: { config: TrackingConfig }) {
  const { ga4, metaPixel, chatwoot } = config

  return (
    <>
      {/* ── Google Analytics 4 ── */}
      {ga4?.isConnected && ga4.measurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4.measurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${ga4.measurementId}');`}
          </Script>
        </>
      )}

      {/* ── Meta Pixel ── */}
      {metaPixel?.isConnected && metaPixel.pixelId && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${metaPixel.pixelId}');fbq('track','PageView');`}
        </Script>
      )}

      {/* ── Chatwoot Live Chat ── */}
      {chatwoot?.isConnected &&
        chatwoot.websiteToken &&
        chatwoot.baseUrl && (
          <Script id="chatwoot-widget" strategy="afterInteractive">
            {`(function(d,t){var BASE_URL="${chatwoot.baseUrl}";
var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
g.src=BASE_URL+"/packs/js/sdk.js";g.defer=true;g.async=true;
s.parentNode.insertBefore(g,s);
g.onload=function(){window.chatwootSDK.run({websiteToken:'${chatwoot.websiteToken}',baseUrl:BASE_URL})};
})(document,"script");`}
          </Script>
        )}
    </>
  )
}
