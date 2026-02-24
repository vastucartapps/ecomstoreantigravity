"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { medusa } from "@/lib/medusa"
import { getRegionId } from "@/lib/region"

const CART_ID_KEY = "vastucart_cart_id"

interface CartContextValue {
  cart: any | null
  cartId: string | null
  itemCount: number
  isLoading: boolean
  addItem: (variantId: string, quantity?: number) => Promise<void>
  updateItem: (lineItemId: string, quantity: number) => Promise<void>
  removeItem: (lineItemId: string) => Promise<void>
  refreshCart: () => Promise<void>
  clearCart: () => void
  applyPromoCode: (code: string) => Promise<void>
  removePromoCode: (code: string) => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const itemCount = cart?.items?.reduce(
    (sum: number, item: any) => sum + item.quantity,
    0
  ) ?? 0

  const refreshCart = useCallback(async () => {
    const cartId =
      typeof window !== "undefined" ? localStorage.getItem(CART_ID_KEY) : null
    if (!cartId) {
      setIsLoading(false)
      return
    }
    try {
      const { cart: retrieved } = await medusa.store.cart.retrieve(cartId)
      setCart(retrieved)
    } catch {
      // Cart expired or invalid
      if (typeof window !== "undefined") localStorage.removeItem(CART_ID_KEY)
      setCart(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const ensureCart = async (): Promise<string> => {
    const existingId =
      typeof window !== "undefined" ? localStorage.getItem(CART_ID_KEY) : null
    if (existingId && cart) return existingId

    // Read geo-IP region cookie set by middleware (vc-region = "india" | "international").
    // This cookie is set server-side from the Cloudflare CF-IPCountry header so it is
    // available immediately on the first client-side render.
    const vcRegion =
      typeof window !== "undefined"
        ? document.cookie.split("; ").find((c) => c.startsWith("vc-region="))?.split("=")[1]
        : undefined
    const preferInternational = vcRegion === "international"

    const regionId = await getRegionId(preferInternational)
    const { cart: newCart } = await medusa.store.cart.create({ region_id: regionId })
    if (typeof window !== "undefined")
      localStorage.setItem(CART_ID_KEY, newCart.id)
    setCart(newCart)
    return newCart.id
  }

  const addItem = async (variantId: string, quantity = 1) => {
    const cartId = await ensureCart()
    const { cart: updated } = await medusa.store.cart.createLineItem(cartId, {
      variant_id: variantId,
      quantity,
    })
    setCart(updated)
  }

  const updateItem = async (lineItemId: string, quantity: number) => {
    if (!cart) return
    const { cart: updated } = await medusa.store.cart.updateLineItem(
      cart.id,
      lineItemId,
      { quantity }
    )
    setCart(updated)
  }

  const removeItem = async (lineItemId: string) => {
    if (!cart) return
    // Medusa v2 deleteLineItem returns { parent: Cart } (not { cart: Cart })
    const result = await medusa.store.cart.deleteLineItem(
      cart.id,
      lineItemId
    )
    const updated = (result as any).parent ?? (result as any).cart ?? result
    setCart(updated)
  }

  const clearCart = () => {
    if (typeof window !== "undefined") localStorage.removeItem(CART_ID_KEY)
    setCart(null)
  }

  const applyPromoCode = async (code: string) => {
    if (!cart) return

    // Validate coupon eligibility rules before applying.
    // Uses medusa.client.fetch() so the Medusa SDK's session cookie is sent
    // automatically — enabling server-side customer identity checks.
    //
    // FAIL-OPEN: if the validate call errors (network, 500, etc.) we let the
    // coupon through — Medusa's own promotion engine validates it server-side
    // anyway. Only a deliberate { valid: false } response blocks the attempt.
    // This ensures a deploy bug never freezes the coupon input for everyone.
    let eligibilityError: string | null = null
    try {
      const validateData = await (medusa.client.fetch as any)(
        `/store/promotions/validate?code=${encodeURIComponent(code)}&cart_id=${encodeURIComponent(cart.id)}`,
        { method: "GET" }
      ) as { valid: boolean; reason?: string }

      if (validateData && validateData.valid === false) {
        eligibilityError = validateData.reason || "This coupon cannot be applied."
      }
    } catch {
      // Network / server error — fail-open, Medusa's engine handles it
    }
    if (eligibilityError) throw new Error(eligibilityError)

    const existing = cart.promo_codes?.map((p: any) => p.code || p) || []
    const { cart: updated } = await medusa.store.cart.update(cart.id, {
      promo_codes: [...existing, code],
    })
    setCart(updated)
  }

  const removePromoCode = async (code: string) => {
    if (!cart) return
    const existing = cart.promo_codes?.map((p: any) => p.code || p) || []
    const { cart: updated } = await medusa.store.cart.update(cart.id, {
      promo_codes: existing.filter((c: string) => c !== code),
    })
    setCart(updated)
  }

  const cartId =
    typeof window !== "undefined" ? localStorage.getItem(CART_ID_KEY) : null

  return (
    <CartContext.Provider
      value={{
        cart,
        cartId,
        itemCount,
        isLoading,
        addItem,
        updateItem,
        removeItem,
        refreshCart,
        clearCart,
        applyPromoCode,
        removePromoCode,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
