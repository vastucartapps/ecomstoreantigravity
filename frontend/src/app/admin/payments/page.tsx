"use client"

import { useEffect, useState } from "react"
import { primary, earth, fonts, semantic } from "@/lib/theme"
import { AdminPaymentsTax } from "@/components/admin/payments-tax"
import { useAdminPaymentsTax } from "@/hooks/useAdminPaymentsTax"
import type {
  PaymentsTaxConfig,
  ProductTaxOverride,
  GatewayConfig,
  GSTConfig,
  InternationalTaxConfig,
  TaxTab,
  PaymentMode,
} from "@/types/admin-payments-tax"

const EMPTY_CONFIG: PaymentsTaxConfig = {
  mode: "test",
  gateways: {
    razorpay: { keyId: "", keySecret: "", isConnected: false },
    stripe: { publishableKey: "", secretKey: "", isConnected: false },
  },
  paymentMethods: [],
  gstConfig: { gstin: "", defaultRate: 18, defaultHSN: "8306" },
  internationalTax: { taxExempt: false, lutNumber: "" },
}

export default function PaymentsTaxPage() {
  const hook = useAdminPaymentsTax()

  const [config, setConfig] = useState<PaymentsTaxConfig>(EMPTY_CONFIG)
  const [productOverrides, setProductOverrides] = useState<ProductTaxOverride[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTaxTab, setActiveTaxTab] = useState<TaxTab>("gst")
  const [toast, setToast] = useState<{
    message: string
    type: "success" | "error"
  } | null>(null)

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function load() {
    setIsLoading(true)
    setError(null)
    hook
      .fetchConfig()
      .then(({ config: c, productOverrides: po }) => {
        setConfig(c)
        setProductOverrides(po)
      })
      .catch((e: Error) => setError(e.message || "Failed to load settings"))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "80px 0",
        }}
      >
        <p style={{ color: earth[400], fontSize: "14px" }}>
          Loading payments &amp; tax settings…
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <p style={{ color: semantic.error, marginBottom: "16px", fontSize: "14px" }}>
          {error}
        </p>
        <button
          onClick={load}
          style={{
            padding: "8px 20px",
            background: primary[500],
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontFamily: fonts.heading,
            color: primary[900],
            fontSize: "1.5rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
          }}
        >
          Payments &amp; Tax
        </h1>
        <p style={{ color: earth[400], fontSize: "0.875rem" }}>
          Configure payment gateways, payment methods, and tax settings
        </p>
      </div>

      <AdminPaymentsTax
        mode={config.mode}
        gateways={config.gateways}
        paymentMethods={config.paymentMethods}
        gstConfig={config.gstConfig}
        internationalTax={config.internationalTax}
        productOverrides={productOverrides}
        activeTaxTab={activeTaxTab}
        onToggleMode={async (mode: PaymentMode) => {
          await hook.toggleMode(mode)
          setConfig((prev) => ({ ...prev, mode }))
          showToast(`Switched to ${mode} mode`)
        }}
        onSaveGateways={async (gateways: GatewayConfig) => {
          await hook.saveGateways(gateways)
          setConfig((prev) => ({ ...prev, gateways }))
          showToast("Gateway settings saved")
        }}
        onTestConnection={async (gateway, keys) => {
          return hook.testConnection(gateway, keys)
        }}
        onTogglePaymentMethod={async (methodId: string) => {
          await hook.togglePaymentMethod(methodId)
          setConfig((prev) => ({
            ...prev,
            paymentMethods: prev.paymentMethods.map((m) =>
              m.id === methodId ? { ...m, enabled: !m.enabled } : m
            ),
          }))
        }}
        onChangeTaxTab={(tab: TaxTab) => setActiveTaxTab(tab)}
        onSaveGST={async (gstConfig: GSTConfig) => {
          await hook.saveGST(gstConfig)
          setConfig((prev) => ({ ...prev, gstConfig }))
          showToast("GST settings saved")
        }}
        onSaveInternationalTax={async (
          internationalTax: InternationalTaxConfig
        ) => {
          await hook.saveInternationalTax(internationalTax)
          setConfig((prev) => ({ ...prev, internationalTax }))
          showToast("International tax settings saved")
        }}
        onSaveProductOverride={async (override: ProductTaxOverride) => {
          await hook.saveProductOverride(override)
          showToast(`Updated tax for "${override.productName}"`)
        }}
      />

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background:
              toast.type === "success" ? semantic.success : semantic.error,
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
