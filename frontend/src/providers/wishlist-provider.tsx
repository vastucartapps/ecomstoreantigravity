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
import { useAuth } from "./auth-provider"

/** Shape of a wishlist item returned by the wishlist plugin */
export interface WishlistItem {
  product_id: string
  product_variant_id?: string
  quantity?: number
}

interface WishlistContextValue {
  wishlistCount: number
  items: WishlistItem[]
  isLoading: boolean
  addToWishlist: (productId: string, variantId: string) => Promise<void>
  removeFromWishlist: (productId: string, variantId: string) => Promise<void>
  refreshWishlist: () => Promise<void>
  isInWishlist: (productId: string) => boolean
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refreshWishlist = useCallback(async () => {
    if (!user) {
      setItems([])
      return
    }
    setIsLoading(true)
    try {
      const res = await medusa.client.fetch<{ wishlist: { items: WishlistItem[] } }>(
        "/store/customers/me/wishlist",
        { method: "GET" }
      )
      setItems(res.wishlist?.items || [])
    } catch {
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    refreshWishlist()
  }, [refreshWishlist])

  const addToWishlist = async (productId: string, variantId: string) => {
    if (!user) throw new Error("LOGIN_REQUIRED")
    await medusa.client.fetch("/store/customers/me/wishlist/items", {
      method: "POST",
      body: { productId, productVariantId: variantId, quantity: 1 },
    })
    await refreshWishlist()
  }

  const removeFromWishlist = async (productId: string, variantId: string) => {
    if (!user) throw new Error("LOGIN_REQUIRED")
    await medusa.client.fetch(
      `/store/customers/me/wishlist/items?productId=${productId}&productVariantId=${variantId}`,
      { method: "DELETE" }
    )
    await refreshWishlist()
  }

  const isInWishlist = (productId: string) =>
    items.some((item) => item.product_id === productId)

  return (
    <WishlistContext.Provider
      value={{
        wishlistCount: items.length,
        items,
        isLoading,
        addToWishlist,
        removeFromWishlist,
        refreshWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider")
  return ctx
}
