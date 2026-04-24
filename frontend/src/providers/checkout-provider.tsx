"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { medusa } from "@/lib/medusa"
import { useCart } from "./cart-provider"
import type { CheckoutStepId, AddressPayload, SavedAddress, ShippingOption } from "@/types/checkout"
import type { AppliedGiftCard } from "./cart-provider"
import {
  trackBeginCheckout,
  trackAddShippingInfo,
  trackAddPaymentInfo,
  logPaymentLifecycle,
  mapLineItems,
  cartTotalMajor,
  type MedusaLineItem,
} from "@/lib/analytics/events"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

interface CheckoutContextValue {
  step: CheckoutStepId
  setStep: (step: CheckoutStepId) => void
  goBack: () => void
  goToStep: (step: CheckoutStepId) => void
  // Contact
  contactEmail: string
  contactPhone: string
  setContactEmail: (email: string) => void
  setContactPhone: (phone: string) => void
  submitContact: (email: string, phone: string, countryCode: string) => Promise<void>
  // Address
  savedAddresses: SavedAddress[]
  loadSavedAddresses: () => Promise<void>
  setAddresses: (shipping: AddressPayload, billing?: AddressPayload) => Promise<void>
  selectedAddressId: string | null
  setSelectedAddressId: (id: string | null) => void
  // Shipping
  shippingOptions: ShippingOption[]
  selectedShippingId: string | null
  loadShippingOptions: () => Promise<void>
  /** Apply a shipping method to the cart and refresh totals (does NOT advance step). */
  applyShippingMethod: (optionId: string) => Promise<void>
  /** Legacy: apply shipping and advance to payment step. */
  selectShippingMethod: (optionId: string) => Promise<void>
  codEnabled: boolean
  codConfig: { fee: number; minOrder: number; maxOrder: number } | null
  toggleCod: (enabled: boolean) => void
  // Payment
  paymentMethod: string
  setPaymentMethod: (method: string) => void
  razorpayKeyId: string | null
  stripePublishableKey: string | null
  initPayment: () => Promise<void>
  completeCheckout: () => Promise<{ orderId: string }>
  completedOrderId: string | null
  // Gift card (passed through from cart provider for use in PaymentStep)
  appliedGiftCard: AppliedGiftCard | null
  giftCardDiscount: number
  // State
  isProcessing: boolean
  error: string | null
  setError: (err: string | null) => void
}

const STEPS: CheckoutStepId[] = ["contact", "address", "shipping", "payment"]

const CheckoutContext = createContext<CheckoutContextValue | null>(null)

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const { cart, cartId, refreshCart, clearCart, appliedGiftCard, giftCardDiscount } = useCart()

  const [step, setStepState] = useState<CheckoutStepId>("contact")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null)
  const [codEnabled, setCodEnabled] = useState(false)
  const [codConfig, setCodConfig] = useState<{ fee: number; minOrder: number; maxOrder: number } | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("system")
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null)
  const [stripePublishableKey, setStripePublishableKey] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null)

  const setStep = (s: CheckoutStepId) => setStepState(s)

  const goBack = () => {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStepState(STEPS[idx - 1])
  }

  const goToStep = (s: CheckoutStepId) => {
    const targetIdx = STEPS.indexOf(s)
    const currentIdx = STEPS.indexOf(step)
    if (targetIdx < currentIdx) setStepState(s)
  }

  const submitContact = useCallback(async (email: string, phone: string, _countryCode: string) => {
    setIsProcessing(true)
    setError(null)
    try {
      const id = cart?.id || cartId
      if (!id) throw new Error("No cart found")
      await medusa.store.cart.update(id, { email })
      setContactEmail(email)
      setContactPhone(phone)
      // GA4 begin_checkout — fires at first commitment point (email captured)
      if (cart) {
        const { value, currency } = cartTotalMajor(cart)
        trackBeginCheckout({
          items: mapLineItems(
            (cart as { items?: MedusaLineItem[] }).items,
            currency
          ),
          currency,
          value,
          coupon: (cart as { promo_codes?: Array<{ code?: string } | string> }).promo_codes?.[0]
            ? typeof (cart as { promo_codes: Array<{ code?: string } | string> }).promo_codes[0] === "string"
              ? ((cart as { promo_codes: string[] }).promo_codes[0] as string)
              : ((cart as { promo_codes: Array<{ code?: string }> }).promo_codes[0]?.code)
            : undefined,
        })
      }
      setStepState("address")
    } catch (err: any) {
      setError(err?.message || "Failed to save contact info")
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [cart, cartId])

  const loadSavedAddresses = useCallback(async () => {
    try {
      const { customer } = await medusa.store.customer.retrieve()
      if (customer) {
        const { addresses } = await medusa.store.customer.listAddress()
        setSavedAddresses((addresses || []) as SavedAddress[])
      }
    } catch {
      setSavedAddresses([])
    }
  }, [])

  const setAddresses = useCallback(async (shipping: AddressPayload, billing?: AddressPayload) => {
    setIsProcessing(true)
    setError(null)
    try {
      const id = cart?.id || cartId
      if (!id) throw new Error("No cart found")
      await medusa.store.cart.update(id, {
        shipping_address: shipping,
        billing_address: billing || shipping,
      })
      await refreshCart()
      setStepState("shipping")
    } catch (err: any) {
      setError(err?.message || "Failed to save address")
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [cart, cartId, refreshCart])

  // Fix #4: No fake fallback shipping options. If Medusa returns none, surface the error.
  const loadShippingOptions = useCallback(async () => {
    setError(null)
    try {
      const id = cart?.id || cartId
      if (!id) return
      const res = await fetch(
        `${BACKEND_URL}/store/shipping-options?cart_id=${id}`,
        { headers: { "x-publishable-api-key": PUB_KEY } }
      )
      if (!res.ok) {
        throw new Error(`Failed to load shipping options (${res.status})`)
      }
      const data = await res.json()
      // Medusa v2 returns shipping amounts in minor units. Keep as-is;
      // display components divide by 100 at render time (ShippingStep.formatPrice).
      const cartCurrency = (cart as any)?.currency_code || "inr"
      const options: ShippingOption[] = (data.shipping_options || []).map((o: any) => ({
        id: o.id,
        name: o.name,
        amount: o.amount || 0,
        currency_code: o.amount_type === "flat" ? cartCurrency : (o.currency_code || cartCurrency),
        provider_id: o.provider_id || "",
      }))

      if (options.length === 0) {
        setError("No shipping options available. Please contact support.")
      }
      setShippingOptions(options)
    } catch (err: any) {
      setError(err?.message || "Failed to load shipping options. Please try again.")
      setShippingOptions([])
    }
  }, [cart, cartId])

  // Apply a shipping method to the cart and refresh totals WITHOUT advancing step.
  // Called when the user clicks a shipping option — updates cart total in real time.
  const applyShippingMethod = useCallback(async (optionId: string) => {
    setIsProcessing(true)
    setError(null)
    try {
      const id = cart?.id || cartId
      if (!id) throw new Error("No cart found")
      await medusa.store.cart.addShippingMethod(id, { option_id: optionId })
      await refreshCart()
      setSelectedShippingId(optionId)
      if (cart) {
        const { value, currency } = cartTotalMajor(cart)
        const tier = shippingOptions.find((o) => o.id === optionId)?.name
        trackAddShippingInfo({
          items: mapLineItems(
            (cart as { items?: MedusaLineItem[] }).items,
            currency
          ),
          currency,
          value,
          shippingTier: tier,
        })
      }
    } catch (err: any) {
      setError(err?.message || "Failed to apply shipping method. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }, [cart, cartId, refreshCart, shippingOptions])

  // Fix #2: Surface shipping method errors instead of silently advancing
  const selectShippingMethod = useCallback(async (optionId: string) => {
    setIsProcessing(true)
    setError(null)
    try {
      const id = cart?.id || cartId
      if (!id) throw new Error("No cart found")
      await medusa.store.cart.addShippingMethod(id, { option_id: optionId })
      await refreshCart()
      setSelectedShippingId(optionId)
      if (cart) {
        const { value, currency } = cartTotalMajor(cart)
        const tier = shippingOptions.find((o) => o.id === optionId)?.name
        trackAddShippingInfo({
          items: mapLineItems(
            (cart as { items?: MedusaLineItem[] }).items,
            currency
          ),
          currency,
          value,
          shippingTier: tier,
        })
      }
      setStepState("payment")
    } catch (err: any) {
      setError(err?.message || "Failed to select shipping method. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }, [cart, cartId, refreshCart, shippingOptions])

  const toggleCod = (enabled: boolean) => {
    setCodEnabled(enabled)
    if (enabled) setPaymentMethod("cod")
    else setPaymentMethod("system")
  }

  const initPayment = useCallback(async () => {
    if (!cart) return

    // Clear any stale error from a previous attempt before doing anything else —
    // including before the early-return guard, so the error is always wiped on re-entry.
    setError(null)

    // Detect currency from cart — determines which payment providers to use:
    // "inr" → Razorpay + COD (India only)
    // "usd" (or anything else) → Stripe → PayPal fallback (international)
    const isInternational = (cart as any).currency_code !== "inr"

    // Fetch payment keys + COD config from admin panel settings (single source of truth).
    let razorpayKey: string | null = null
    let stripeKey: string | null = null
    try {
      const fetches: Promise<Response>[] = [
        fetch(`${BACKEND_URL}/store/payment-config`, {
          headers: { "x-publishable-api-key": PUB_KEY },
        }),
      ]
      // Only fetch COD config for INR carts (COD is India-only)
      if (!isInternational) {
        fetches.push(
          fetch(`${BACKEND_URL}/store/shipping-config`, {
            headers: { "x-publishable-api-key": PUB_KEY },
          })
        )
      }

      const results = await Promise.allSettled(fetches)
      const [cfgRes, shippingRes] = results

      if (cfgRes.status === "fulfilled" && cfgRes.value.ok) {
        const cfg = await cfgRes.value.json()
        razorpayKey = cfg.razorpay_key_id || null
        setRazorpayKeyId(razorpayKey)
        stripeKey = cfg.stripe_publishable_key || null
        setStripePublishableKey(stripeKey)
      }

      // COD is strictly India-only; never shown or fetched for international carts
      if (!isInternational) {
        setCodEnabled(false)
        setCodConfig(null)
      } else if (shippingRes && shippingRes.status === "fulfilled" && shippingRes.value.ok) {
        const shData = await shippingRes.value.json()
        const cod = shData?.config?.cod
        if (cod?.enabled === true) {
          setCodEnabled(true)
          setCodConfig({
            fee: cod.fee ?? 0,
            minOrder: cod.minOrder ?? 0,
            maxOrder: cod.maxOrder ?? Infinity,
          })
        }
      }
    } catch {}

    // Guard: skip if we already have an active session for the right provider family.
    // This prevents duplicate session creation on re-entry (e.g. React Strict Mode).
    const paymentCollection = (cart as any)?.payment_collection
    const existingSessions: any[] = paymentCollection?.payment_sessions || []
    if (isInternational) {
      if (existingSessions.some((s: any) =>
        (s.provider_id?.includes("stripe") || s.provider_id?.includes("paypal")) &&
        s.status !== "canceled"
      )) return
    } else {
      if (existingSessions.some((s: any) => s.provider_id?.includes("razorpay") && s.status !== "canceled")) return
    }

    setIsProcessing(true)
    try {
      // Fetch available payment providers for this cart's region
      const res = await fetch(
        `${BACKEND_URL}/store/payment-providers?region_id=${(cart as any).region_id}`,
        { headers: { "x-publishable-api-key": PUB_KEY } }
      )
      const data = await res.json()
      const providers: any[] = data.payment_providers || []

      if (providers.length === 0) {
        setError("No payment providers available. Please contact support.")
        return
      }

      let providerId: string
      if (isInternational) {
        // International: prefer Stripe (admin-driven), fall back to PayPal, then system default
        const stripeProvider = providers.find((p: any) => p.id?.includes("stripe"))
        const paypalProvider = providers.find((p: any) => p.id?.includes("paypal"))
        const systemProvider = providers.find((p: any) => p.id === "pp_system_default")
        if (stripeKey && stripeProvider) {
          providerId = stripeProvider.id
        } else if (paypalProvider) {
          providerId = paypalProvider.id
        } else if (systemProvider) {
          providerId = systemProvider.id
        } else {
          providerId = providers[0].id
        }
      } else {
        // India: prefer Razorpay (admin-driven), fall back to system default (for COD)
        const razorpayProvider = providers.find((p: any) => p.id?.includes("razorpay"))
        const systemProvider = providers.find((p: any) => p.id === "pp_system_default")
        if (razorpayKey && razorpayProvider) {
          providerId = razorpayProvider.id
        } else if (systemProvider) {
          providerId = systemProvider.id
        } else {
          providerId = providers[0].id
        }
      }

      // If collection already exists but has no active sessions, add session to existing collection
      if (paymentCollection?.id) {
        await fetch(
          `${BACKEND_URL}/store/payment-collections/${paymentCollection.id}/payment-sessions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-publishable-api-key": PUB_KEY,
            },
            body: JSON.stringify({ provider_id: providerId }),
          }
        )
      } else {
        await medusa.store.payment.initiatePaymentSession(cart, {
          provider_id: providerId,
        })
      }
      // Refresh cart so the payment_collection is updated in state (guard works on next call)
      await refreshCart().catch(() => {})
    } catch {
      // A 500 here usually means a concurrent initPayment call already created the collection
      // (React Strict Mode double-invokes effects in development). Refresh cart silently —
      // errors will surface at order-placement time if the session is truly missing.
      await refreshCart().catch(() => {})
    } finally {
      setIsProcessing(false)
    }
  }, [cart, refreshCart])

  // Complete the order. Sets completedOrderId BEFORE returning so the checkout
  // page's empty-cart guard (which checks !completedOrderId) does not fire
  // during the route transition — even if clearCart() is called on the
  // order-confirmation page while the checkout page is still mounted.
  const completeCheckout = useCallback(async (): Promise<{ orderId: string }> => {
    setIsProcessing(true)
    setError(null)
    try {
      const id = cart?.id || cartId
      if (!id) throw new Error("No cart found")

      // GA4 add_payment_info — user has submitted payment (or COD confirmation).
      // Fires here since this is the reliable point for all payment providers
      // (Razorpay returns to here after modal, COD calls this directly).
      if (cart) {
        const { value, currency } = cartTotalMajor(cart)
        trackAddPaymentInfo({
          items: mapLineItems(
            (cart as { items?: MedusaLineItem[] }).items,
            currency
          ),
          currency,
          value,
          paymentType: paymentMethod,
        })
      }

      // Store gift card info in cart metadata so the order-gift-card subscriber
      // can deduct the balance after order.placed fires.
      if (appliedGiftCard && giftCardDiscount > 0) {
        await medusa.store.cart.update(id, {
          metadata: {
            ...(cart?.metadata || {}),
            gift_card_code: appliedGiftCard.code,
            gift_card_id: appliedGiftCard.id,
            gift_card_deduct_amount: giftCardDiscount,
          },
        })
      }

      const result = await medusa.store.cart.complete(id) as any

      // Medusa v2 returns { type: "order", order: { id, ... } }
      const orderId = result?.order?.id
      if (!orderId) {
        throw new Error("Order was created but no order ID was returned. Please check your order history.")
      }

      // Phase 4 — log successful payment to backend funnel.
      if (cart) {
        logPaymentLifecycle({
          cartId: id,
          stage: "succeeded",
          provider: paymentMethod || "system",
          currency: (cart as { currency_code?: string }).currency_code || "inr",
          amount: (cart as { total?: number }).total || 0,
          orderId,
          email: (cart as { email?: string }).email || contactEmail || undefined,
        })
      }

      // Mark the order as completed BEFORE returning so the checkout guard
      // is already suppressed when clearCart() fires on the next page.
      setCompletedOrderId(orderId)
      return { orderId }
    } catch (err: any) {
      const msg = err?.message || "Failed to complete order. Please try again."
      // Phase 4 — log cart.complete failure as a payment failure with provider context.
      const id = cart?.id || cartId
      if (id && cart) {
        logPaymentLifecycle({
          cartId: id,
          stage: "failed",
          provider: paymentMethod || "system",
          currency: (cart as { currency_code?: string }).currency_code || "inr",
          amount: (cart as { total?: number }).total || 0,
          errorCode: "cart_complete_failed",
          errorMessage: msg,
          email: (cart as { email?: string }).email || contactEmail || undefined,
        })
      }
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsProcessing(false)
    }
  }, [cart, cartId, paymentMethod, appliedGiftCard, giftCardDiscount, contactEmail])

  return (
    <CheckoutContext.Provider
      value={{
        step, setStep, goBack, goToStep,
        contactEmail, contactPhone, setContactEmail, setContactPhone, submitContact,
        savedAddresses, loadSavedAddresses, setAddresses, selectedAddressId, setSelectedAddressId,
        shippingOptions, selectedShippingId, loadShippingOptions, applyShippingMethod, selectShippingMethod,
        codEnabled, codConfig, toggleCod,
        paymentMethod, setPaymentMethod, razorpayKeyId, stripePublishableKey, initPayment, completeCheckout,
        completedOrderId,
        appliedGiftCard, giftCardDiscount,
        isProcessing, error, setError,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  )
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext)
  if (!ctx) throw new Error("useCheckout must be used within CheckoutProvider")
  return ctx
}
