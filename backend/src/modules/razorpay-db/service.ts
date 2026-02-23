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
   * Called by Medusa during cart.complete().
   * Always returns "authorized" so the order is created.
   *
   * - Razorpay: payment is already captured by the Razorpay modal before
   *   completeCheckout() is called. No further authorization needed.
   * - COD: cash is collected on delivery. Authorization is implicit.
   *
   * Server-side signature verification can be done separately via
   * POST /store/razorpay/verify after the order is placed.
   */
  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    return { status: "authorized", data: input.data }
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
    return { status: "captured", data: input.data }
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
