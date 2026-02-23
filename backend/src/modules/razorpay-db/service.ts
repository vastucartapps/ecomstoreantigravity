import { AbstractPaymentProvider, BigNumber } from "@medusajs/framework/utils"
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

/**
 * Razorpay payment provider — session placeholder only.
 *
 * Payment providers run inside the payment module's isolated Awilix container
 * which does NOT have access to other modules (store, etc.).
 * So this provider does NOT call the Razorpay API directly.
 *
 * The actual Razorpay order is created by POST /store/razorpay/create-order,
 * a normal API route that has full container access and reads keys from
 * store.metadata.payments_tax_config.gateways.razorpay (Admin → Payments).
 */
class RazorpayDbService extends AbstractPaymentProvider {
  static identifier = "razorpay-db"

  constructor(container: any, options: any) {
    super(container, options)
  }

  /** Safely extract a numeric value from Medusa's BigNumberInput. */
  private toNumber(amount: any): number {
    if (typeof amount === "number") return amount
    if (typeof amount === "string") return parseFloat(amount) || 0
    if (amount && typeof amount === "object" && "numeric" in amount) {
      return Number((amount as any).numeric) || 0
    }
    return 0
  }

  // ── AbstractPaymentProvider interface ────────────────────────────────────

  /**
   * Creates a placeholder payment session.
   * The real Razorpay order is created later by the frontend via
   * POST /store/razorpay/create-order (which has full module access).
   */
  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const sessionId = `rzp_${Date.now()}`
    return {
      id: sessionId,
      data: {
        session_id: sessionId,
        amount: this.toNumber(input.amount),
        currency: (input.currency_code || "INR").toUpperCase(),
        status: "pending",
      },
    }
  }

  /**
   * Called by Medusa after the user completes payment in the Razorpay modal.
   * The frontend passes razorpay_payment_id, razorpay_order_id, razorpay_signature
   * via the payment session data update.
   * We trust the Razorpay callback — server-side signature verification is
   * handled separately at POST /store/razorpay/verify if needed.
   */
  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const data = (input.data || {}) as Record<string, unknown>

    // Razorpay handler was called — payment succeeded
    if (data.razorpay_payment_id) {
      return { status: "authorized", data }
    }

    // Session exists but payment not yet completed
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
    return { status: "pending", data }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return { data: input.data }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return { data: input.data }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    // Refunds are handled via POST /store/razorpay/refund (has full container access)
    return { data: input.data }
  }

  async getWebhookActionAndData(
    data: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    return {
      action: "not_supported",
      data: { session_id: "", amount: new BigNumber(0) },
    }
  }
}

export default RazorpayDbService
