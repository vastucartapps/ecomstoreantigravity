import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { gateway, keyId, keySecret, secretKey } = req.body as {
    gateway?: string
    keyId?: string
    keySecret?: string
    secretKey?: string
  }

  try {
    if (gateway === "razorpay") {
      if (!keyId || !keySecret) {
        return res.json({ connected: false, error: "Key ID and Key Secret are required" })
      }
      const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64")
      const response = await fetch("https://api.razorpay.com/v1/payments?count=0", {
        headers: { Authorization: `Basic ${credentials}` },
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as any
        return res.json({
          connected: false,
          error: data.error?.description || "Authentication failed",
        })
      }
      return res.json({ connected: true })
    }

    if (gateway === "stripe") {
      if (!secretKey) {
        return res.json({ connected: false, error: "Secret Key is required" })
      }
      const response = await fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${secretKey}` },
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as any
        return res.json({
          connected: false,
          error: data.error?.message || "Authentication failed",
        })
      }
      return res.json({ connected: true })
    }

    res.json({ connected: false, error: "Unknown gateway" })
  } catch (err: any) {
    res.json({ connected: false, error: err.message || "Connection failed" })
  }
}
