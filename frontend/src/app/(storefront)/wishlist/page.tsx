"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, Trash2, ShoppingBag, ArrowLeft } from "lucide-react"
import { useWishlist } from "@/providers/wishlist-provider"
import { useCart } from "@/providers/cart-provider"
import { useAuth } from "@/providers/auth-provider"
import { primary, secondary, earth, bg, fonts } from "@/lib/theme"
import { normalizeImageUrl } from "@/lib/image-url"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
const REGION_ID = "reg_01KHTS3XAP0A8SM60C5NWECPRN"

interface WishlistProduct {
  id: string
  title: string
  handle: string
  thumbnail: string
  price: number
  mrp: number
  currency: string
  inStock: boolean
  variantId?: string
}

export default function WishlistPage() {
  const { items, removeFromWishlist, wishlistCount } = useWishlist()
  const { addItem } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<WishlistProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [movingToCart, setMovingToCart] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      if (!items || items.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }
      try {
        const productIds = items.map((i: any) => i.product_id || i.id || i).filter(Boolean)
        if (productIds.length === 0) {
          setProducts([])
          setLoading(false)
          return
        }
        const idsParam = productIds.map((id: string) => `id[]=${id}`).join("&")
        const res = await fetch(
          `${BACKEND_URL}/store/products?${idsParam}&fields=id,title,handle,thumbnail,variants.id,variants.calculated_price,variants.manage_inventory,variants.inventory_quantity&region_id=${REGION_ID}`,
          { headers: { "x-publishable-api-key": PUB_KEY } }
        )
        const data = await res.json()
        const mapped = (data.products || []).map((p: any) => {
          const v = p.variants?.[0]
          const cp = v?.calculated_price
          return {
            id: p.id,
            title: p.title,
            handle: p.handle,
            thumbnail: normalizeImageUrl(p.thumbnail),
            price: (cp?.calculated_amount ?? 0) / 100,
            mrp: (cp?.original_amount ?? cp?.calculated_amount ?? 0) / 100,
            currency: (cp?.currency_code || "inr").toUpperCase(),
            inStock: v?.manage_inventory === false || (v?.inventory_quantity ?? 1) > 0,
            variantId: v?.id,
          }
        })
        setProducts(mapped)
      } catch {
        setProducts([])
      }
      setLoading(false)
    }
    fetchProducts()
  }, [items])

  const handleMoveToCart = async (product: WishlistProduct) => {
    if (!product.variantId) return
    setMovingToCart(product.id)
    try {
      await addItem(product.variantId, 1)
      removeFromWishlist(product.id, product.variantId)
    } catch {}
    setMovingToCart(null)
  }

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)

  return (
    <div className="min-h-screen" style={{ background: bg.primary }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-white/60 transition"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: earth[600] }} />
          </button>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: primary[500], fontFamily: fonts.heading }}
            >
              My Wishlist
            </h1>
            <p className="text-sm mt-1" style={{ color: earth[400] }}>
              {wishlistCount} {wishlistCount === 1 ? "item" : "items"} saved
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: primary[200], borderTopColor: "transparent" }} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: primary[50] }}
            >
              <Heart className="w-10 h-10" style={{ color: primary[300] }} />
            </div>
            <h2
              className="text-xl font-semibold mb-2"
              style={{ color: earth[700], fontFamily: fonts.heading }}
            >
              Your wishlist is empty
            </h2>
            <p className="text-sm mb-6" style={{ color: earth[400] }}>
              Save items you love for later. Browse our collection and tap the heart icon.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${primary[500]}, ${primary[400]})` }}
            >
              <ShoppingBag className="w-4 h-4" />
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="group rounded-2xl overflow-hidden transition-all hover:shadow-lg"
                style={{ background: bg.card, border: "1px solid #f0ebe4" }}
              >
                <Link href={`/product/${product.handle}`} className="block">
                  <div className="relative aspect-square overflow-hidden">
                    {product.thumbnail ? (
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: primary[50] }}
                      >
                        <Heart className="w-12 h-12" style={{ color: primary[200] }} />
                      </div>
                    )}
                    {product.mrp > product.price && (
                      <span
                        className="absolute top-3 left-3 px-2 py-0.5 rounded-lg text-xs font-bold text-white"
                        style={{ background: secondary[500] }}
                      >
                        {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                      </span>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={`/product/${product.handle}`}>
                    <h3
                      className="text-sm font-semibold line-clamp-2 hover:underline"
                      style={{ color: earth[700], fontFamily: fonts.body }}
                    >
                      {product.title}
                    </h3>
                  </Link>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span
                      className="text-base font-bold"
                      style={{ color: primary[500] }}
                    >
                      {formatPrice(product.price)}
                    </span>
                    {product.mrp > product.price && (
                      <span
                        className="text-xs line-through"
                        style={{ color: earth[300] }}
                      >
                        {formatPrice(product.mrp)}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleMoveToCart(product)}
                      disabled={!product.inStock || movingToCart === product.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: primary[500] }}
                    >
                      {movingToCart === product.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <ShoppingBag className="w-3.5 h-3.5" />
                      )}
                      {product.inStock ? "Add to Cart" : "Out of Stock"}
                    </button>
                    <button
                      onClick={() => removeFromWishlist(product.id, product.variantId || "")}
                      className="p-2 rounded-xl transition-all hover:bg-red-50"
                      style={{ border: "1px solid #f0ebe4" }}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!user && products.length > 0 && (
          <div
            className="mt-8 p-4 rounded-xl text-center text-sm"
            style={{ background: primary[50], color: primary[500] }}
          >
            <Link href="/login" className="font-semibold underline">Sign in</Link> to save your wishlist across devices
          </div>
        )}
      </div>
    </div>
  )
}
