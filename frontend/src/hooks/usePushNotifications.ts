"use client"

import { useState, useEffect, useCallback } from "react"

const BACKEND_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "")
    : ""
const PUB_KEY =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "")
    : ""

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer as ArrayBuffer
}

export function usePushNotifications(customerId?: string) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsSupported("Notification" in window && "serviceWorker" in navigator && "PushManager" in window)
  }, [])

  useEffect(() => {
    if (!isSupported) return
    checkSubscription()
  }, [isSupported])

  async function checkSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setIsSubscribed(!!sub)
    } catch {
      setIsSubscribed(false)
    }
  }

  const subscribe = useCallback(async () => {
    if (!isSupported) return
    setIsLoading(true)
    setError(null)

    try {
      // Get VAPID public key from backend
      const keyRes = await fetch(`${BACKEND_URL}/store/push/vapid-public-key`, {
        headers: { "x-publishable-api-key": PUB_KEY },
      })
      if (!keyRes.ok) throw new Error("Push notifications not configured on server")
      const { vapidPublicKey } = await keyRes.json()
      if (!vapidPublicKey) throw new Error("VAPID public key not available")

      // Request notification permission
      const permission = await Notification.requestPermission()
      if (permission !== "granted") throw new Error("Notification permission denied")

      // Register service worker
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" })
      await navigator.serviceWorker.ready

      // Subscribe to push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      const subJson = sub.toJSON()

      // Save subscription to backend
      await fetch(`${BACKEND_URL}/store/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PUB_KEY },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
          customer_id: customerId || null,
        }),
      })

      setIsSubscribed(true)
    } catch (err: any) {
      setError(err.message || "Failed to subscribe")
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, customerId])

  const unsubscribe = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch(`${BACKEND_URL}/store/push/unsubscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-publishable-api-key": PUB_KEY },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setIsSubscribed(false)
    } catch (err: any) {
      setError(err.message || "Failed to unsubscribe")
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { isSupported, isSubscribed, isLoading, error, subscribe, unsubscribe }
}
