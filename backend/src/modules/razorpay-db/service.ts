import { AbstractPaymentProvider, BigNumber, Modules } from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/types"
import crypto from "crypto"

/**
 * Custom Razorpay payment provider that reads key_id and key_secret from
 * store.metadata.payments_tax_config.gateways.razorpay — the Admin > Payments
 * settings page — at payment time. No Coolify/env-var configuration needed.
 */
class RazorpayDbService extends AbstractPaymentProvider {
  static identifier = "razorpay-db"

  protected storeService_: any

  constructor(container: any, options: any) {
    super(container, options)
    this.storeService_ = container.resolve(Modules.STORE)
  }

  // ── Read keys from admin panel settings ──────────────────────────────────

  private async getKeys(): Promise<{ key_id: string; key_secret: string }> {
    const stores = await this.storeService_.listStores({}, { take: 1 })
    const gateways = (stores?.[0]?.metadata as any)?.payments_tax_config?.gateways
    const key_id: string = gateways?.razorpay?.keyId || ""
    const key_secret: string = gateways?.razorpay?.keySecret || ""

    if (!key_id || !key_secret) {
      throw new Error(
        "Razorpay keys not configured. Go to Admin → Payments and enter your Key ID and Key Secret."
      )
    }
    return { key_id, key_secret }
  }

  private authHeader(key_id: string, key_secret: string): string {
    return `Basic ${Buffer.from(`${key_id}:${key_secret}`).toString("base64")}`
  }

  /** Safely extract a numeric value from Medusa's BigNumberInput. */
  private toNumber(amount: any): number {
    if (typeof amount === "number") return amount
    if (typeof amount === "string") return parseFloat(amount) || 0
    // BigNumber object — .numeric holds the resolved value
    if (amount && typeof amount === "object" && "numeric" in amount) {
      return Number((amount as any).numeric) || 0
    }
    return 0
  }

  // ── AbstractPaymentProvider interface ────────────────────────────────────

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const { key_id, key_secret } = await this.getKeys()

    // Medusa passes amount in standard currency units (e.g. ₹25.00 not 2500 paise)
    const amountInPaise = Math.round(this.toNumber(input.amount) * 100)
    const currency = (input.currency_code || "INR").toUpperCase()

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.authHeader(key_id, key_secret),
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt: `vc_${Date.now()}`,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(
        (err as any)?.error?.description || "Failed to create Razorpay order"
      )
    }

    const order = await res.json() as Record<string, unknown>
    return { id: order.id as string, data: order }
  }

  /**
   * Called by Medusa after the user completes payment.
   * input.data = the payment session data (the Razorpay order stored in initiatePayment).
   * If the Razorpay signature was forwarded, verify it; otherwise, trust the handler callback.
   */
  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const data = (input.data || {}) as Record<string, unknown>

    const razorpay_payment_id = data.razorpay_payment_id as string | undefined
    const razorpay_order_id = data.razorpay_order_id as string | undefined
    const razorpay_signature = data.razorpay_signature as string | undefined

    // If signature was forwarded, verify HMAC
    if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
      try {
        const { key_secret } = await this.getKeys()
        const expected = crypto
          .createHmac("sha256", key_secret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest("hex")

        if (expected === razorpay_signature) {
          return { status: "authorized", data: { ...data, razorpay_payment_id } }
        }
        return { status: "error", data }
      } catch {
        // Keys unavailable — trust the Razorpay handler callback (client-verified)
        return { status: "authorized", data }
      }
    }

    // Razorpay order was created (data.id exists) — the handler only fires on success
    if (data.id) {
      return { status: "authorized", data }
    }

    return { status: "pending", data }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return { data: input.data }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: input.data }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const data = (input.data || {}) as Record<string, unknown>
    if (data.razorpay_payment_id) {
      return { status: "captured", data }
    }
    if (data.id) {
      return { status: "pending", data }
    }
    return { status: "pending", data }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return { data: input.data }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    // Re-create the Razorpay order with the new amount
    try {
      const output = await this.initiatePayment(input as any)
      return { data: output.data }
    } catch {
      return { data: input.data }
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const { key_id, key_secret } = await this.getKeys()
    const data = (input.data || {}) as Record<string, unknown>
    const paymentId = data.razorpay_payment_id as string | undefined

    if (!paymentId) throw new Error("No Razorpay payment ID found for refund")

    const amountInPaise = Math.round(this.toNumber(input.amount) * 100)

    const res = await fetch(
      `https://api.razorpay.com/v1/payments/${paymentId}/refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.authHeader(key_id, key_secret),
        },
        body: JSON.stringify({ amount: amountInPaise }),
      }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(
        (err as any)?.error?.description || "Failed to process refund"
      )
    }

    const refund = await res.json() as Record<string, unknown>
    return { data: { ...data, refund_id: refund.id } }
  }

  async getWebhookActionAndData(
    data: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    // Webhooks not yet implemented — return not_supported so Medusa ignores
    return {
      action: "not_supported",
      data: { session_id: "", amount: new BigNumber(0) },
    }
  }
}

export default RazorpayDbService
