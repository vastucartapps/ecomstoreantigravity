"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { medusa } from "@/lib/medusa"
import { useCart } from "./cart-provider"
import type { CheckoutStepId, AddressPayload, ShippingOption } from "@/types/checkout"

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
  savedAddresses: any[]
  loadSavedAddresses: () => Promise<void>
  setAddresses: (shipping: AddressPayload, billing?: AddressPayload) => Promise<void>
  selectedAddressId: string | null
  setSelectedAddressId: (id: string | null) => void
  // Shipping
  shippingOptions: ShippingOption[]
  selectedShippingId: string | null
  loadShippingOptions: () => Promise<void>
  selectShippingMethod: (optionId: string) => Promise<void>
  codEnabled: boolean
  toggleCod: (enabled: boolean) => void
  // Payment
  paymentMethod: string
  setPaymentMethod: (method: string) => void
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
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null)
  const [codEnabled, setCodEnabled] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("system")
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
        setSavedAddresses(addresses || [])
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

  const loadShippingOptions = useCallback(async () => {
    try {
      const id = cart?.id || cartId
      if (!id) return
      const res = await fetch(
        `${BACKEND_URL}/store/shipping-options?cart_id=${id}`,
        { headers: { "x-publishable-api-key": PUB_KEY } }
      )
      const data = await res.json()
      const options: ShippingOption[] = (data.shipping_options || []).map((o: any) => ({
        id: o.id,
        name: o.name,
        amount: o.amount || 0,
        currency_code: o.price_type === "flat" ? "inr" : "inr",
        provider_id: o.provider_id || "",
      }))

      // Fallback options if none returned from Medusa (dev environment)
      if (options.length === 0) {
        options.push(
          { id: "fallback_standard", name: "Standard Shipping", amount: 0, currency_code: "inr", provider_id: "manual" },
          { id: "fallback_express", name: "Express Shipping", amount: 14900, currency_code: "inr", provider_id: "manual" }
        )
      }
      setShippingOptions(options)
    } catch {
      // Provide fallback options
      setShippingOptions([
        { id: "fallback_standard", name: "Standard Shipping (5-7 days)", amount: 0, currency_code: "inr", provider_id: "manual" },
        { id: "fallback_express", name: "Express Shipping (2-3 days)", amount: 14900, currency_code: "inr", provider_id: "manual" },
      ])
    }
  }, [cart, cartId])

  const selectShippingMethod = useCallback(async (optionId: string) => {
    setIsProcessing(true)
    setError(null)
    try {
      const id = cart?.id || cartId
      if (!id) throw new Error("No cart found")
      // Skip for fallback options (not real Medusa option IDs)
      if (!optionId.startsWith("fallback_")) {
        await medusa.store.cart.addShippingMethod(id, { option_id: optionId })
        await refreshCart()
      }
      setSelectedShippingId(optionId)
      setStepState("payment")
    } catch (err: any) {
      // If shipping method API fails (e.g., no fulfillment provider), still let user proceed
      setSelectedShippingId(optionId)
      setStepState("payment")
    } finally {
      setIsProcessing(false)
    }
  }, [cart, cartId, refreshCart])

  const toggleCod = (enabled: boolean) => {
    setCodEnabled(enabled)
    if (enabled) setPaymentMethod("cod")
    else setPaymentMethod("system")
  }

  const initPayment = useCallback(async () => {
    setIsProcessing(true)
    setError(null)
    try {
      if (!cart) throw new Error("No cart found")
      // Initialize payment session with system default provider
      await medusa.store.payment.initiatePaymentSession(cart, {
        provider_id: "pp_system_default",
      })
    } catch (err: any) {
      // Non-fatal — payment collection may already exist or system default unavailable in dev
      console.warn("Payment init warning:", err?.message)
    } finally {
      setIsProcessing(false)
    }
  }, [cart])

  const completeCheckout = useCallback(async (): Promise<{ orderId: string }> => {
    setIsProcessing(true)
    setError(null)
    try {
      const id = cart?.id || cartId
      if (!id) throw new Error("No cart found")
      const result = await medusa.store.cart.complete(id)
      const order = (result as any).order || (result as any)
      const orderId = order?.id || order?.order?.id || "unknown"
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
        shippingOptions, selectedShippingId, loadShippingOptions, selectShippingMethod,
        codEnabled, toggleCod,
        paymentMethod, setPaymentMethod, initPayment, completeCheckout,
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
