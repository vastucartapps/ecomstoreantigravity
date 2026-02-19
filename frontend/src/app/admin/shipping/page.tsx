"use client"

import { useState, useEffect } from "react"
import { AdminShell } from "@/components/shell"
import { AdminShipping } from "@/components/admin/shipping"
import { useAdminShipping } from "@/hooks/useAdminShipping"
import type {
  ShippingConfig,
  ShippingZone,
  FreeShippingConfig,
  CODConfig,
  DeliveryEstimate,
} from "@/types/admin-shipping"
import { primary, earth, fonts } from "@/lib/theme"

export default function AdminShippingPage() {
  const [config, setConfig] = useState<ShippingConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const {
    fetchShippingConfig,
    saveZones,
    saveFreeShipping,
    saveCOD,
    saveDeliveryEstimates,
    saveShippingPolicy,
  } = useAdminShipping()

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const c = await fetchShippingConfig()
      setConfig(c)
    } catch {
      // error state handled below
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaveZones = async (zones: ShippingZone[]) => {
    await saveZones(zones)
    setConfig((prev) => (prev ? { ...prev, zones } : prev))
    showToast("Shipping zones saved")
  }

  const handleSaveFreeShipping = async (freeShipping: FreeShippingConfig) => {
    await saveFreeShipping(freeShipping)
    setConfig((prev) => (prev ? { ...prev, freeShipping } : prev))
    showToast("Free shipping config saved")
  }

  const handleSaveCOD = async (cod: CODConfig) => {
    await saveCOD(cod)
    setConfig((prev) => (prev ? { ...prev, cod } : prev))
    showToast("COD settings saved")
  }

  const handleSaveEstimates = async (deliveryEstimates: DeliveryEstimate[]) => {
    await saveDeliveryEstimates(deliveryEstimates)
    setConfig((prev) => (prev ? { ...prev, deliveryEstimates } : prev))
    showToast("Delivery estimates saved")
  }

  const handleSavePolicy = async (shippingPolicy: string) => {
    await saveShippingPolicy(shippingPolicy)
    setConfig((prev) => (prev ? { ...prev, shippingPolicy } : prev))
    showToast("Shipping policy saved")
  }

  return (
    <AdminShell>
      <div style={{ padding: "32px", fontFamily: fonts.body }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontFamily: fonts.heading,
              fontSize: "28px",
              fontWeight: 700,
              color: earth[700],
              margin: 0,
            }}
          >
            Shipping &amp; Delivery
          </h1>
          <p style={{ color: earth[400], fontSize: "14px", marginTop: "6px" }}>
            Configure shipping zones, free shipping, COD, delivery estimates, and
            shipping policy.
          </p>
        </div>

        {config ? (
          <AdminShipping
            config={config}
            isLoading={false}
            onSaveZones={handleSaveZones}
            onSaveFreeShipping={handleSaveFreeShipping}
            onSaveCOD={handleSaveCOD}
            onSaveDeliveryEstimates={handleSaveEstimates}
            onSaveShippingPolicy={handleSavePolicy}
          />
        ) : isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "300px",
            }}
          >
            <div style={{ textAlign: "center", color: earth[400] }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  border: `3px solid ${primary[200]}`,
                  borderTopColor: primary[500],
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 12px",
                }}
              />
              <p style={{ fontSize: "14px" }}>Loading shipping configuration...</p>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px", color: earth[400] }}>
            Failed to load configuration.{" "}
            <button
              onClick={loadConfig}
              style={{
                color: primary[500],
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              background: "#10B981",
              color: "#fff",
              padding: "12px 20px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 1000,
            }}
          >
            {toast}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
