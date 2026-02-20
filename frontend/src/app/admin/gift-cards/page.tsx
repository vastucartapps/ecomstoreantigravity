"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Gift cards are managed inside the Coupons & Gift Cards page (gift-cards tab)
export default function GiftCardsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin/coupons")
  }, [router])
  return null
}
