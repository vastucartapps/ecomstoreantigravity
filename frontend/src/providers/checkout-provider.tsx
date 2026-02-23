"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { medusa } from "@/lib/medusa"
import { useCart } from "./cart-provider"
import type { CheckoutStepId, AddressPayload, SavedAddress, ShippingOption } from "@/types/checkout"

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
  toggleCod: (enabled: boolean) => void
  // Payment
  paymentMethod: string
  setPaymentMethod: (method: string) => void
  razorpayKeyId: string | null
  initPayment: () => Promise<void>
  completeCheckout: () => Promise<{ orderId: string }>
  // State
  isProcessing: boolean
  error: string | null
  setError: (err: string | null) => void
}

const STEPS: CheckoutStepId[] = ["contact", "address", "shipping", "payment"]

const CheckoutContext = createContext<CheckoutContextValue | null>(null)

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const { cart, cartId, refreshCart, clearCart } = useCart()

  const [step, setStepState] = useState<CheckoutStepId>("contact")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null)
  const [codEnabled, setCodEnabled] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("system")
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      // Medusa v2 returns shipping amounts in minor units (paise). Keep as-is;
      // display components divide by 100 at render time (ShippingStep.formatPrice).
      const options: ShippingOption[] = (data.shipping_options || []).map((o: any) => ({
        id: o.id,
        name: o.name,
        amount: o.amount || 0,
        currency_code: "inr",
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
    } catch (err: any) {
      setError(err?.message || "Failed to apply shipping method. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }, [cart, cartId, refreshCart])

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
      setStepState("payment")
    } catch (err: any) {
      setError(err?.message || "Failed to select shipping method. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }, [cart, cartId, refreshCart])

  const toggleCod = (enabled: boolean) => {
    setCodEnabled(enabled)
    if (enabled) setPaymentMethod("cod")
    else setPaymentMethod("system")
  }

  // Fix #6: Fetch available payment providers instead of hardcoding pp_system_default
  const initPayment = useCallback(async () => {
    if (!cart) return

    // Fetch Razorpay public key from admin panel settings (single source of truth)
    try {
      const cfgRes = await fetch(`${BACKEND_URL}/store/payment-config`, {
        headers: { "x-publishable-api-key": PUB_KEY },
      })
      if (cfgRes.ok) {
        const cfg = await cfgRes.json()
        setRazorpayKeyId(cfg.razorpay_key_id || null)
      }
    } catch {}

    // Guard: skip if a valid (non-cancelled) payment session already exists
    const existingSessions = (cart as any)?.payment_collection?.payment_sessions
    if (existingSessions?.some((s: any) => s.status !== "canceled")) return

    setIsProcessing(true)
    setError(null)
    try {
      // Fetch available payment providers for this cart
      const res = await fetch(
        `${BACKEND_URL}/store/payment-providers?region_id=${cart.region_id}`,
        { headers: { "x-publishable-api-key": PUB_KEY } }
      )
      const data = await res.json()
      const providers: any[] = data.payment_providers || []

      if (providers.length === 0) {
        setError("No payment providers available. Please contact support.")
        return
      }

      // Prefer Razorpay if available (primary gateway for India), otherwise first available
      const razorpayProvider = providers.find((p) => p.id?.includes("razorpay"))
      const providerId = (razorpayProvider || providers[0]).id

      await medusa.store.payment.initiatePaymentSession(cart, {
        provider_id: providerId,
      })
    } catch (err: any) {
      setError(err?.message || "Failed to initialize payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }, [cart])

  // Fix #3: Proper order ID extraction from Medusa v2 cart.complete() response
  const completeCheckout = useCallback(async (): Promise<{ orderId: string }> => {
    setIsProcessing(true)
    setError(null)
    try {
      const id = cart?.id || cartId
      if (!id) throw new Error("No cart found")
      const result = await medusa.store.cart.complete(id) as any

      // Medusa v2 returns { type: "order", order: { id, ... } }
      const orderId = result?.order?.id
      if (!orderId) {
        throw new Error("Order was created but no order ID was returned. Please check your order history.")
      }

      clearCart()
      return { orderId }
    } catch (err: any) {
      const msg = err?.message || "Failed to complete order. Please try again."
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsProcessing(false)
    }
  }, [cart, cartId, clearCart])

  return (
    <CheckoutContext.Provider
      value={{
        step, setStep, goBack, goToStep,
        contactEmail, contactPhone, setContactEmail, setContactPhone, submitContact,
        savedAddresses, loadSavedAddresses, setAddresses, selectedAddressId, setSelectedAddressId,
        shippingOptions, selectedShippingId, loadShippingOptions, applyShippingMethod, selectShippingMethod,
        codEnabled, toggleCod,
        paymentMethod, setPaymentMethod, razorpayKeyId, initPayment, completeCheckout,
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
