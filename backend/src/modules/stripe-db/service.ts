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
 * Stripe payment provider — session placeholder only.
 *
 * Payment providers run inside the payment module's isolated Awilix container
 * which does NOT have access to other modules (store, etc.).
 * So this provider does NOT call the Stripe API directly.
 *
 * The actual Stripe PaymentIntent is created by POST /store/stripe/create-payment-intent,
 * a normal API route that has full container access and reads the Stripe secret key from
 * store.metadata.payments_tax_config.gateways.stripe (Admin → Payments).
 *
 * Flow:
 * 1. initPayment() creates a placeholder session → Medusa tracks the payment collection.
 * 2. Frontend calls /store/stripe/create-payment-intent → gets client_secret.
 * 3. Frontend uses Stripe.js to collect card details and confirm the PaymentIntent.
 * 4. On Stripe confirmation success → frontend calls cart.complete().
 * 5. authorizePayment() is called by Medusa during cart.complete() → always "authorized"
 *    because the actual charge was already captured by Stripe before this point.
 */
class StripeDbService extends AbstractPaymentProvider {
  static identifier = "stripe-db"

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
   * The real Stripe PaymentIntent is created later by the frontend via
   * POST /store/stripe/create-payment-intent (which has full module access).
   */
  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const sessionId = `stripe_${Date.now()}`
    return {
      id: sessionId,
      data: {
        session_id: sessionId,
        amount: this.toNumber(input.amount),
        currency: (input.currency_code || "USD").toUpperCase(),
        status: "pending",
      },
    }
  }

  /**
   * Called by Medusa during cart.complete().
   * Always returns "authorized" because the Stripe charge was already captured
   * by the Stripe PaymentIntent confirmation before cart.complete() is called.
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
    // Refunds can be handled via Stripe dashboard or a dedicated refund route
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

export default StripeDbService
