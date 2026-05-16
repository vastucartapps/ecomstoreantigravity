"use client"

/**
 * Injects third-party tracking scripts and widgets when their respective
 * integrations are connected AND the visitor has granted the matching
 * consent category (GDPR / UK PECR compliance).
 *
 * Categories:
 *   - analytics: GA4 (page_view, funnel events)
 *   - marketing: Meta Pixel, TikTok/Pinterest/Snapchat/Twitter/LinkedIn,
 *                Google Ads retargeting
 *   - essential / functional: Chatwoot, WhatsApp button — customer-initiated
 *                contact widgets that don't track until engaged. Treated as
 *                essential so they remain available regardless of consent.
 *
 * Uses next/script with strategy="afterInteractive" so scripts load after
 * the page is interactive — no blocking of the critical rendering path.
 *
 * This component receives only PUBLIC-SAFE config fields (no API keys or
 * secrets).
 */

import Script from "next/script"
import { useConsent } from "@/providers/cookie-consent-provider"

interface MarketingTagConfig {
  id: string
  name: string
  platform: string
  pixelId: string
}

interface TrackingConfig {
  ga4: { isConnected: boolean; measurementId: string } | null
  metaPixel: { isConnected: boolean; pixelId: string } | null
  chatwoot: {
    isConnected: boolean
    websiteToken: string
    baseUrl: string
  } | null
  whatsapp: { isConnected: boolean; phoneNumber: string } | null
  marketingTags: MarketingTagConfig[]
}

/** Generate the pixel init script for a given marketing platform */
function marketingTagScript(tag: MarketingTagConfig): string | null {
  const { platform, pixelId } = tag
  switch (platform.toLowerCase()) {
    case "tiktok":
      return `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${pixelId}');ttq.page();}(window,document,'ttq');`
    case "pinterest":
      return `!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");pintrk('load','${pixelId}');pintrk('page');`
    case "snapchat":
      return `(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');snaptr('init','${pixelId}');snaptr('track','PAGE_VIEW');`
    case "twitter":
    case "x":
      return `!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');twq('config','${pixelId}');`
    case "linkedin":
      return `_linkedin_partner_id="${pixelId}";window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(_linkedin_partner_id);(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");b.type="text/javascript";b.async=true;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";s.parentNode.insertBefore(b,s)})(window.lintrk);`
    case "google-ads":
      return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${pixelId}');`
    default:
      return null
  }
}

export function TrackingScripts({ config }: { config: TrackingConfig }) {
  const { consent, ready } = useConsent()
  const { ga4, metaPixel, chatwoot, whatsapp, marketingTags = [] } = config

  // Sanitise the WhatsApp number: keep digits and leading +
  const waNumber = whatsapp?.phoneNumber
    ? whatsapp.phoneNumber.replace(/[^\d+]/g, "")
    : null

  // While the provider hasn't read localStorage yet, render only the
  // essential/functional widgets so we never fire analytics or marketing
  // pixels before consent is known.
  const allowAnalytics = ready && consent.analytics
  const allowMarketing = ready && consent.marketing

  return (
    <>
      {/* ── Google Analytics 4 (analytics consent required) ── */}
      {allowAnalytics && ga4?.isConnected && ga4.measurementId && (
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

      {/* ── Meta Pixel (marketing consent required) ── */}
      {allowMarketing && metaPixel?.isConnected && metaPixel.pixelId && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${metaPixel.pixelId}');fbq('track','PageView');`}
        </Script>
      )}

      {/* ── Marketing Tags (marketing consent required) ── */}
      {allowMarketing &&
        marketingTags.map((tag) => {
          const script = marketingTagScript(tag)
          if (!script) return null
          // Google Ads also needs the gtag.js loader
          if (tag.platform.toLowerCase() === "google-ads") {
            return (
              <span key={tag.id}>
                <Script
                  src={`https://www.googletagmanager.com/gtag/js?id=${tag.pixelId}`}
                  strategy="afterInteractive"
                />
                <Script id={`mtag-${tag.id}`} strategy="afterInteractive">
                  {script}
                </Script>
              </span>
            )
          }
          return (
            <Script key={tag.id} id={`mtag-${tag.id}`} strategy="afterInteractive">
              {script}
            </Script>
          )
        })}

      {/* ── Chatwoot Live Chat (functional / essential) ── */}
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

      {/* ── WhatsApp Floating Button (functional / essential) ── */}
      {whatsapp?.isConnected && waNumber && (
        <>
          <style>{`
            .wa-fab {
              position: fixed;
              bottom: 1.5rem;
              right: 1.5rem;
              z-index: 1000;
              width: 56px;
              height: 56px;
              border-radius: 50%;
              background: #25d366;
              box-shadow: 0 4px 16px rgba(37,211,102,0.45), 0 2px 6px rgba(0,0,0,0.18);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: transform 0.18s ease, box-shadow 0.18s ease;
              text-decoration: none;
            }
            .wa-fab:hover {
              transform: scale(1.08);
              box-shadow: 0 6px 20px rgba(37,211,102,0.55), 0 3px 8px rgba(0,0,0,0.22);
            }
            .wa-fab svg {
              width: 30px;
              height: 30px;
              fill: #fff;
            }
          `}</style>
          <a
            className="wa-fab"
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
          >
            {/* Official WhatsApp glyph path */}
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.866.49 3.617 1.346 5.13L2 22l5.014-1.318A9.94 9.94 0 0012.001 22C17.523 22 22 17.522 22 12S17.523 2 12.001 2zm0 1.8A8.19 8.19 0 0120.2 12a8.19 8.19 0 01-8.199 8.2 8.15 8.15 0 01-4.17-1.14l-.298-.178-3.094.812.824-3.007-.197-.313A8.153 8.153 0 013.8 12 8.19 8.19 0 0112.001 3.8zm-2.3 4.1c-.2 0-.527.075-.803.375-.276.3-1.053 1.028-1.053 2.508s1.078 2.91 1.228 3.11c.15.2 2.104 3.21 5.096 4.503.712.307 1.268.49 1.701.628.715.227 1.367.195 1.882.118.574-.085 1.768-.723 2.017-1.42.25-.697.25-1.295.175-1.42-.075-.125-.276-.2-.576-.35-.3-.15-1.768-.872-2.043-.972-.276-.1-.476-.15-.676.15-.2.3-.775.972-.95 1.172-.175.2-.35.225-.65.075-.3-.15-1.266-.466-2.41-1.487-.89-.793-1.491-1.773-1.666-2.073-.175-.3-.018-.462.13-.61.135-.133.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.628-.926-2.228-.244-.584-.49-.504-.676-.514l-.576-.01z" />
            </svg>
          </a>
        </>
      )}
    </>
  )
}
