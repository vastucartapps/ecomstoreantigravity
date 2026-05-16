import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ABANDONED_CART_RECOVERY_MODULE } from "../../../modules/abandoned-cart-recovery"
import { captureException } from "../../../lib/error-reporter"

/**
 * Storefront endpoint for one-click unsubscribe from cart-recovery emails.
 *
 * GET /store/unsubscribe?token=<recovery_token>
 *
 * GET is intentional — email clients prefetch + auto-click links in some
 * preview panes, and the action is idempotent (opt-out is a sticky flag).
 * Returning a tiny HTML confirmation page keeps the experience self-contained
 * without requiring a separate Next.js page round-trip.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const token = (req.query as any)?.token as string | undefined
  if (!token) {
    res.status(400).send(htmlPage("Missing token", "This unsubscribe link is malformed."))
    return
  }

  try {
    const service = req.scope.resolve(ABANDONED_CART_RECOVERY_MODULE) as any
    const result = await service.optOutByToken(token)
    if (!result.ok) {
      res.status(404).send(htmlPage("Link not found", "This unsubscribe link is no longer valid."))
      return
    }
    res
      .status(200)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(
        htmlPage(
          "You're unsubscribed",
          `We won't send any more cart-recovery emails to ${escapeHtml(result.email || "this address")}.`
        )
      )
  } catch (err) {
    captureException(err, { source: "api/store/unsubscribe:GET" })
    res.status(500).send(htmlPage("Something went wrong", "Please try the link again in a minute."))
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]!)
}

function htmlPage(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="robots" content="noindex,nofollow" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui,-apple-system,Segoe UI,sans-serif; background: #fffbf5; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #fff; border: 1px solid #f0ebe4; box-shadow: 0 2px 6px rgba(0,0,0,0.06); border-radius: 16px; padding: 40px 32px; max-width: 440px; text-align: center; }
    h1 { color: #013f47; font-family: Georgia, serif; font-size: 22px; margin: 0 0 12px; }
    p { color: #75615a; font-size: 15px; line-height: 1.5; margin: 0 0 24px; }
    a { display: inline-block; background: linear-gradient(135deg,#013f47,#054348); color: #fff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>${body}</p>
    <a href="/">Back to store</a>
  </div>
</body>
</html>`
}
