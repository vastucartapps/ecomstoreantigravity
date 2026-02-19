"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart, ShoppingCart, Package, Loader2 } from "lucide-react"
import { useWishlist } from "@/providers/wishlist-provider"
import { medusa } from "@/lib/medusa"
import { normalizeImageUrl } from "@/lib/image-url"
import { getRegionId } from "@/lib/region"
import { primary, earth, bg, fonts } from "@/lib/theme"

interface WishlistProduct {
  wishlistItemId: string
  productId: string
  variantId?: string
  title: string
  thumbnail?: string
  price: number
  handle: string
  inStock: boolean
}

export function WishlistGrid() {
  const { items, removeFromWishlist, wishlistCount } = useWishlist()
  const [products, setProducts] = useState<WishlistProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    if (!items || items.length === 0) {
      setIsLoading(false)
      setProducts([])
      return
    }
    enrichWishlistItems()
  }, [items])

  const enrichWishlistItems = async () => {
    try {
      const regionId = await getRegionId()
      const enriched = await Promise.allSettled(
        items.map(async (item: any) => {
          try {
            const result = await medusa.store.product.retrieve(item.product_id || item.productId, { region_id: regionId })
            const product = (result as any).product || result
            const variant = product.variants?.[0]
            return {
              wishlistItemId: item.id,
              productId: product.id,
              variantId: item.variant_id || variant?.id,
              title: product.title,
              thumbnail: normalizeImageUrl(product.thumbnail || ""),
              price: variant?.calculated_price?.calculated_amount || 0,
              handle: product.handle,
              inStock: (variant?.inventory_quantity || 0) > 0 || variant?.allow_backorder,
            } as WishlistProduct
          } catch {
            return null
          }
        })
      )
      setProducts(enriched.filter((r): r is PromiseFulfilledResult<WishlistProduct> => r.status === "fulfilled" && r.value !== null).map((r) => r.value))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (wishlistItemId: string, productId: string, variantId?: string) => {
    setRemoving(wishlistItemId)
    try {
      await removeFromWishlist(productId, variantId || "")
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: primary[900], fontFamily: fonts.heading }}>
          My Wishlist
        </h1>
        <p className="text-sm mt-0.5" style={{ color: earth[400] }}>
          {wishlistCount} item{wishlistCount !== 1 ? "s" : ""} saved
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: primary[500] }} />
        </div>
      ) : products.length === 0 ? (
        <div className="py-12 text-center rounded-2xl" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
          <Heart className="w-12 h-12 mx-auto mb-3" style={{ color: earth[200] }} />
          <p className="text-sm font-medium" style={{ color: earth[500] }}>Your wishlist is empty</p>
          <Link href="/" className="mt-2 text-sm font-medium inline-block" style={{ color: primary[500] }}>
            Discover products →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map((product) => (
            <div
              key={product.wishlistItemId}
              className="rounded-2xl overflow-hidden group"
              style={{ background: bg.card, border: "1px solid #f0ebe4" }}
            >
              {/* Image */}
              <Link href={`/product/${product.handle}`} className="block relative">
                <div className="aspect-square overflow-hidden" style={{ background: "#f9f6f2" }}>
                  {product.thumbnail ? (
                    <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10" style={{ color: earth[200] }} />
                    </div>
                  )}
                </div>
                {!product.inStock && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>
                    Out of Stock
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="p-3">
                <Link href={`/product/${product.handle}`}>
                  <p className="text-xs font-medium line-clamp-2" style={{ color: earth[700] }}>{product.title}</p>
                </Link>
                {product.price > 0 && (
                  <p className="text-sm font-bold mt-1" style={{ color: primary[500] }}>
                    ₹{(product.price / 100).toLocaleString("en-IN")}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-2">
                  <Link
                    href={`/product/${product.handle}`}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold text-white"
                    style={{ background: primary[500] }}
                  >
                    <ShoppingCart className="w-3 h-3" />
                    Buy
                  </Link>
                  <button
                    onClick={() => handleRemove(product.wishlistItemId, product.productId, product.variantId)}
                    disabled={removing === product.wishlistItemId}
                    className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                    style={{ border: "1.5px solid #EF4444", color: "#EF4444" }}
                    title="Remove from wishlist"
                  >
                    {removing === product.wishlistItemId ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Heart className="w-3 h-3 fill-current" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
