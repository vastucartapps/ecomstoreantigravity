"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle, AlertTriangle, Loader2, Package, RefreshCw } from "lucide-react"
import { AdminShipping } from "@/components/admin/shipping"
import { useAdminShipping } from "@/hooks/useAdminShipping"
import { adminFetch } from "@/lib/medusa"
import type {
  ShippingConfig,
  ShippingZone,
  FreeShippingConfig,
  CODConfig,
  DeliveryEstimate,
} from "@/types/admin-shipping"
import { primary, earth, fonts, bg, shadows, gradients, semantic } from "@/lib/theme"

// ─── Medusa Shipping Setup Panel ─────────────────────────────────────────────

interface MedusaShippingStatus {
  setup_required: boolean
  fulfillment_sets: Array<{ id: string; name: string }>
  shipping_options: Array<{ id: string; name: string }>
}

function MedusaShippingPanel() {
  const [status, setStatus] = useState<MedusaShippingStatus | null>(null)
  const [checking, setChecking] = useState(true)
  const [settingUp, setSettingUp] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const checkStatus = useCallback(async () => {
    setChecking(true)
    try {
      const data = await adminFetch<MedusaShippingStatus>("/admin/shipping-setup")
      setStatus(data)
    } catch {
      setStatus(null)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  const handleSetup = async () => {
    setSettingUp(true)
    setMessage(null)
    try {
      const data = await adminFetch<{
        success: boolean
        already_exists?: boolean
        message: string
        details?: { shipping_options: string[] }
      }>("/admin/shipping-setup", { method: "POST" })

      setMessage({ type: "success", text: data.message })
      await checkStatus()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setMessage({ type: "error", text: msg })
    } finally {
      setSettingUp(false)
    }
  }

  const cardStyle: React.CSSProperties = {
    background: `linear-gradient(${bg.card}, ${bg.card}) padding-box, ${gradients.accentBorder} border-box`,
    borderTop: "4px solid transparent",
    borderRadius: "12px",
    padding: "28px 32px",
    boxShadow: shadows.card,
    marginBottom: "24px",
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <Package size={20} style={{ color: primary[500] }} />
        <div>
          <h2 style={{ fontFamily: fonts.heading, fontSize: "17px", fontWeight: 700, color: earth[700], margin: 0 }}>
            Medusa Checkout Shipping Options
          </h2>
          <p style={{ color: earth[400], fontSize: "13px", margin: "3px 0 0" }}>
            These options appear in the checkout shipping step. Required for orders to be placed.
          </p>
        </div>
        <button
          onClick={checkStatus}
          disabled={checking}
          style={{ marginLeft: "auto", background: "none", border: "none", cursor: checking ? "default" : "pointer", color: earth[400], padding: "4px" }}
          title="Refresh status"
        >
          <RefreshCw size={15} style={{ animation: checking ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {checking && !status ? (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: earth[400], fontSize: "14px" }}>
          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          Checking shipping configuration…
        </div>
      ) : status ? (
        <>
          {/* Status row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            {status.setup_required ? (
              <>
                <AlertTriangle size={16} style={{ color: "#F59E0B" }} />
                <span style={{ fontSize: "14px", color: "#92400E", fontWeight: 600 }}>
                  No shipping options found — checkout is blocked until setup is complete.
                </span>
              </>
            ) : (
              <>
                <CheckCircle size={16} style={{ color: semantic.success }} />
                <span style={{ fontSize: "14px", color: "#065F46", fontWeight: 600 }}>
                  Shipping options active ({status.shipping_options.length} option{status.shipping_options.length !== 1 ? "s" : ""})
                </span>
              </>
            )}
          </div>

          {/* Option list */}
          {status.shipping_options.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
              {status.shipping_options.map((o) => (
                <span
                  key={o.id}
                  style={{
                    background: `${primary[500]}15`,
                    color: primary[600],
                    border: `1px solid ${primary[200]}`,
                    borderRadius: "6px",
                    padding: "4px 10px",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  {o.name}
                </span>
              ))}
            </div>
          )}

          {/* Setup / re-setup button */}
          {status.setup_required && (
            <button
              onClick={handleSetup}
              disabled={settingUp}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: settingUp ? earth[300] : primary[500],
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: settingUp ? "default" : "pointer",
                transition: "background 200ms",
              }}
            >
              {settingUp ? (
                <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Package size={15} />
              )}
              {settingUp ? "Setting up…" : "Setup India Shipping Options"}
            </button>
          )}
        </>
      ) : (
        <div style={{ fontSize: "14px", color: earth[500] }}>
          Unable to check status — ensure you are logged in as admin.
        </div>
      )}

      {/* Result message */}
      {message && (
        <div
          style={{
            marginTop: "14px",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 500,
            background: message.type === "success" ? "#D1FAE5" : "#FEE2E2",
            color: message.type === "success" ? "#065F46" : "#991B1B",
            border: `1px solid ${message.type === "success" ? "#6EE7B7" : "#FCA5A5"}`,
          }}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
          Configure shipping zones, free shipping, COD, delivery estimates, and shipping policy.
        </p>
      </div>

      {/* Medusa checkout shipping options — must be configured for orders to work */}
      <MedusaShippingPanel />

      {/* Store-level config (zones, COD rules, policy text) */}
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
            <p style={{ fontSize: "14px" }}>Loading shipping configuration…</p>
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
  )
}
