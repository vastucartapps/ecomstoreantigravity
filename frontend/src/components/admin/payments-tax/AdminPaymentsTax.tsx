"use client"

import { useState } from "react"
import {
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Smartphone,
  CreditCard,
  Landmark,
  Wallet,
  Banknote,
  DollarSign,
  Loader2,
} from "lucide-react"
import {
  primary,
  earth,
  bg,
  fonts,
  shadows,
  semantic,
  gradients,
} from "@/lib/theme"
import type {
  AdminPaymentsTaxProps,
  GatewayConfig,
  GSTConfig,
  InternationalTaxConfig,
  ProductTaxOverride,
  TaxTab,
} from "@/types/admin-payments-tax"

const cardStyle: React.CSSProperties = {
  background: `linear-gradient(${bg.card}, ${bg.card}) padding-box, ${gradients.accentBorder} border-box`,
  borderTop: "4px solid transparent",
  borderRadius: "12px",
  padding: "32px",
  boxShadow: shadows.card,
  marginBottom: "24px",
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: `1px solid ${earth[300]}`,
  borderRadius: "8px",
  fontSize: "14px",
  fontFamily: fonts.body,
  outline: "none",
  boxSizing: "border-box",
  background: bg.card,
}

const btnPrimary: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 20px",
  background: primary[500],
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 200ms",
}

const btnOutline: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 16px",
  background: "transparent",
  color: primary[500],
  border: `1px solid ${primary[500]}`,
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 200ms",
}

const paymentIcons: Record<string, React.ElementType> = {
  smartphone: Smartphone,
  "credit-card": CreditCard,
  landmark: Landmark,
  wallet: Wallet,
  banknote: Banknote,
}

type ShowKeys = {
  razorpayKeyId: boolean
  razorpaySecret: boolean
  stripePublishable: boolean
  stripeSecret: boolean
}

type TestResult = { connected: boolean; error?: string }

// ─── Sub-component: single gateway key field row ──────────────────────────────

interface GatewaySectionProps {
  title: string
  isConnected: boolean
  testResult?: TestResult
  isTesting: boolean
  fields: Array<{
    label: string
    value: string
    showKeyProp: keyof ShowKeys
    onChange: (v: string) => void
  }>
  showKeys: ShowKeys
  onToggleShow: (key: keyof ShowKeys) => void
  onTest: () => void
}

function GatewaySection({
  title,
  isConnected,
  testResult,
  isTesting,
  fields,
  showKeys,
  onToggleShow,
  onTest,
}: GatewaySectionProps) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            fontFamily: fonts.heading,
            fontSize: "18px",
            fontWeight: 600,
            color: earth[700],
            margin: 0,
          }}
        >
          {title}
        </h3>
        {isConnected && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: semantic.successLight,
              color: semantic.success,
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <CheckCircle size={14} />
            Connected
          </span>
        )}
      </div>

      <div
        style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr 1fr" }}
      >
        {fields.map((field) => (
          <div key={field.label}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 600,
                color: earth[700],
                marginBottom: "8px",
              }}
            >
              {field.label}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showKeys[field.showKeyProp] ? "text" : "password"}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder="Enter key..."
                autoComplete="new-password"
                style={{
                  ...inputStyle,
                  paddingRight: "40px",
                  fontFamily: fonts.mono,
                }}
                onFocus={(e) => (e.target.style.borderColor = primary[400])}
                onBlur={(e) => (e.target.style.borderColor = earth[300])}
              />
              <button
                type="button"
                onClick={() => onToggleShow(field.showKeyProp)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: earth[400],
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                }}
              >
                {showKeys[field.showKeyProp] ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginTop: "12px",
        }}
      >
        <button
          type="button"
          onClick={onTest}
          disabled={isTesting}
          style={{ ...btnOutline, opacity: isTesting ? 0.7 : 1 }}
        >
          {isTesting && (
            <Loader2 size={16} className="animate-spin" />
          )}
          {isTesting ? "Testing..." : "Test Connection"}
        </button>

        {testResult && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600,
              color: testResult.connected ? semantic.success : semantic.error,
            }}
          >
            {testResult.connected ? (
              <CheckCircle size={16} />
            ) : (
              <XCircle size={16} />
            )}
            {testResult.connected
              ? "Connection successful"
              : testResult.error || "Connection failed"}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function AdminPaymentsTax({
  mode,
  gateways: initialGateways,
  paymentMethods,
  gstConfig: initialGST,
  internationalTax: initialIntlTax,
  productOverrides: initialOverrides,
  activeTaxTab,
  onToggleMode,
  onSaveGateways,
  onTestConnection,
  onTogglePaymentMethod,
  onChangeTaxTab,
  onSaveGST,
  onSaveInternationalTax,
  onSaveProductOverride,
}: AdminPaymentsTaxProps) {
  const [gateways, setGateways] = useState<GatewayConfig>(initialGateways)
  const [gstConfig, setGstConfig] = useState<GSTConfig>(initialGST)
  const [intlTax, setIntlTax] = useState<InternationalTaxConfig>(initialIntlTax)
  const [productRows, setProductRows] =
    useState<ProductTaxOverride[]>(initialOverrides)

  const [showKeys, setShowKeys] = useState<ShowKeys>({
    razorpayKeyId: false,
    razorpaySecret: false,
    stripePublishable: false,
    stripeSecret: false,
  })

  const [isSavingGateway, setIsSavingGateway] = useState(false)
  const [isSavingGST, setIsSavingGST] = useState(false)
  const [isSavingIntl, setIsSavingIntl] = useState(false)
  const [savingProductId, setSavingProductId] = useState<string | null>(null)
  const [testingGateway, setTestingGateway] = useState<
    "razorpay" | "stripe" | null
  >(null)
  const [testResults, setTestResults] = useState<{
    razorpay?: TestResult
    stripe?: TestResult
  }>({})

  const handleTestConnection = async (gateway: "razorpay" | "stripe") => {
    if (!onTestConnection) return
    setTestingGateway(gateway)
    try {
      const result = await onTestConnection(gateway, gateways)
      setTestResults((prev) => ({ ...prev, [gateway]: result }))
      if (result.connected) {
        setGateways((prev) => ({
          ...prev,
          razorpay:
            gateway === "razorpay"
              ? { ...prev.razorpay, isConnected: true }
              : prev.razorpay,
          stripe:
            gateway === "stripe"
              ? { ...prev.stripe, isConnected: true }
              : prev.stripe,
        }))
      }
    } finally {
      setTestingGateway(null)
    }
  }

  const handleSaveGateway = async () => {
    if (!onSaveGateways) return
    setIsSavingGateway(true)
    try {
      await onSaveGateways(gateways)
    } finally {
      setIsSavingGateway(false)
    }
  }

  const handleSaveGST = async () => {
    if (!onSaveGST) return
    setIsSavingGST(true)
    try {
      await onSaveGST(gstConfig)
    } finally {
      setIsSavingGST(false)
    }
  }

  const handleSaveIntl = async () => {
    if (!onSaveInternationalTax) return
    setIsSavingIntl(true)
    try {
      await onSaveInternationalTax(intlTax)
    } finally {
      setIsSavingIntl(false)
    }
  }

  const handleSaveProductRow = async (idx: number) => {
    if (!onSaveProductOverride) return
    const row = productRows[idx]
    setSavingProductId(row.productId)
    try {
      await onSaveProductOverride(row)
    } finally {
      setSavingProductId(null)
    }
  }

  const updateProductRow = (
    idx: number,
    field: "gstRate" | "hsnCode",
    value: string
  ) => {
    setProductRows((prev) =>
      prev.map((r, i) =>
        i === idx
          ? { ...r, [field]: field === "gstRate" ? Number(value) : value }
          : r
      )
    )
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        fontFamily: fonts.body,
      }}
    >
      {/* ── Payment Gateways ── */}
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <DollarSign size={24} style={{ color: primary[500] }} />
            <h2
              style={{
                fontFamily: fonts.heading,
                fontSize: "20px",
                fontWeight: 600,
                color: earth[700],
                margin: 0,
              }}
            >
              Payment Gateways
            </h2>
          </div>

          {/* Test / Live toggle */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              background: bg.subtle,
              borderRadius: "8px",
              padding: "4px",
            }}
          >
            {(["test", "live"] as const).map((m) => (
              <button
                key={m}
                onClick={() => onToggleMode?.(m)}
                style={{
                  padding: "8px 16px",
                  background: mode === m ? bg.card : "transparent",
                  color: mode === m ? earth[700] : earth[500],
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: mode === m ? shadows.card : "none",
                  transition: "all 200ms",
                  textTransform: "capitalize",
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <GatewaySection
          title="Razorpay"
          isConnected={gateways.razorpay.isConnected}
          testResult={testResults.razorpay}
          isTesting={testingGateway === "razorpay"}
          fields={[
            {
              label: "Key ID",
              value: gateways.razorpay.keyId,
              showKeyProp: "razorpayKeyId",
              onChange: (v) =>
                setGateways({
                  ...gateways,
                  razorpay: { ...gateways.razorpay, keyId: v, isConnected: false },
                }),
            },
            {
              label: "Key Secret",
              value: gateways.razorpay.keySecret,
              showKeyProp: "razorpaySecret",
              onChange: (v) =>
                setGateways({
                  ...gateways,
                  razorpay: {
                    ...gateways.razorpay,
                    keySecret: v,
                    isConnected: false,
                  },
                }),
            },
          ]}
          showKeys={showKeys}
          onToggleShow={(key) =>
            setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }))
          }
          onTest={() => handleTestConnection("razorpay")}
        />

        <GatewaySection
          title="Stripe"
          isConnected={gateways.stripe.isConnected}
          testResult={testResults.stripe}
          isTesting={testingGateway === "stripe"}
          fields={[
            {
              label: "Publishable Key",
              value: gateways.stripe.publishableKey,
              showKeyProp: "stripePublishable",
              onChange: (v) =>
                setGateways({
                  ...gateways,
                  stripe: {
                    ...gateways.stripe,
                    publishableKey: v,
                    isConnected: false,
                  },
                }),
            },
            {
              label: "Secret Key",
              value: gateways.stripe.secretKey,
              showKeyProp: "stripeSecret",
              onChange: (v) =>
                setGateways({
                  ...gateways,
                  stripe: {
                    ...gateways.stripe,
                    secretKey: v,
                    isConnected: false,
                  },
                }),
            },
          ]}
          showKeys={showKeys}
          onToggleShow={(key) =>
            setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }))
          }
          onTest={() => handleTestConnection("stripe")}
        />

        <button
          onClick={handleSaveGateway}
          disabled={isSavingGateway}
          style={{ ...btnPrimary, opacity: isSavingGateway ? 0.7 : 1 }}
          onMouseEnter={(e) => {
            if (!isSavingGateway)
              e.currentTarget.style.background = primary[400]
          }}
          onMouseLeave={(e) => {
            if (!isSavingGateway)
              e.currentTarget.style.background = primary[500]
          }}
        >
          {isSavingGateway ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Save Gateway Settings
        </button>
      </div>

      {/* ── Payment Methods ── */}
      <div style={cardStyle}>
        <h2
          style={{
            fontFamily: fonts.heading,
            fontSize: "20px",
            fontWeight: 600,
            color: earth[700],
            margin: "0 0 24px 0",
          }}
        >
          Payment Methods
        </h2>
        <div style={{ display: "grid", gap: "16px" }}>
          {paymentMethods.map((method) => {
            const Icon = paymentIcons[method.icon]
            return (
              <div
                key={method.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px",
                  background: bg.subtle,
                  borderRadius: "8px",
                  border: method.enabled
                    ? `2px solid ${primary[200]}`
                    : `2px solid transparent`,
                  transition: "border-color 200ms",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "16px" }}
                >
                  {Icon && (
                    <Icon
                      size={28}
                      style={{
                        color: method.enabled ? primary[500] : earth[400],
                      }}
                    />
                  )}
                  <div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: earth[700],
                        marginBottom: "4px",
                      }}
                    >
                      {method.name}
                    </div>
                    <div style={{ fontSize: "13px", color: earth[500] }}>
                      {method.description}
                    </div>
                  </div>
                </div>

                <label
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: "52px",
                    height: "28px",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={method.enabled}
                    onChange={() => onTogglePaymentMethod?.(method.id)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: method.enabled ? primary[500] : earth[300],
                      borderRadius: "28px",
                      transition: "all 200ms",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        height: "22px",
                        width: "22px",
                        left: method.enabled ? "27px" : "3px",
                        bottom: "3px",
                        background: "#ffffff",
                        borderRadius: "50%",
                        transition: "all 200ms",
                      }}
                    />
                  </span>
                </label>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Tax Settings ── */}
      <div style={{ ...cardStyle, marginBottom: 0 }}>
        <h2
          style={{
            fontFamily: fonts.heading,
            fontSize: "20px",
            fontWeight: 600,
            color: earth[700],
            margin: "0 0 24px 0",
          }}
        >
          Tax Settings
        </h2>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            marginBottom: "32px",
            borderBottom: `2px solid ${bg.subtle}`,
          }}
        >
          {(
            [
              { key: "gst", label: "GST" },
              { key: "international", label: "International" },
              { key: "per-product", label: "Per-Product" },
            ] as { key: TaxTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => onChangeTaxTab?.(tab.key)}
              style={{
                padding: "12px 24px",
                background:
                  activeTaxTab === tab.key ? primary[50] : "transparent",
                color:
                  activeTaxTab === tab.key ? primary[500] : earth[600],
                border: "none",
                borderBottom:
                  activeTaxTab === tab.key
                    ? `3px solid ${primary[500]}`
                    : "3px solid transparent",
                fontSize: "15px",
                fontWeight: 600,
                fontFamily: fonts.body,
                cursor: "pointer",
                transition: "all 200ms",
                marginBottom: "-2px",
              }}
              onMouseEnter={(e) => {
                if (activeTaxTab !== tab.key)
                  e.currentTarget.style.background = bg.subtle
              }}
              onMouseLeave={(e) => {
                if (activeTaxTab !== tab.key)
                  e.currentTarget.style.background = "transparent"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* GST Tab */}
        {activeTaxTab === "gst" && (
          <div>
            <div
              style={{
                display: "grid",
                gap: "20px",
                gridTemplateColumns: "1fr 1fr 1fr",
                marginBottom: "24px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: earth[700],
                    marginBottom: "8px",
                  }}
                >
                  GSTIN
                </label>
                <input
                  type="text"
                  value={gstConfig.gstin}
                  onChange={(e) =>
                    setGstConfig({ ...gstConfig, gstin: e.target.value })
                  }
                  placeholder="29AABCV1234F1Z5"
                  style={{ ...inputStyle, fontFamily: fonts.mono }}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: earth[700],
                    marginBottom: "8px",
                  }}
                >
                  Default GST Rate (%)
                </label>
                <input
                  type="number"
                  value={gstConfig.defaultRate}
                  onChange={(e) =>
                    setGstConfig({
                      ...gstConfig,
                      defaultRate: Number(e.target.value),
                    })
                  }
                  min={0}
                  max={100}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: earth[700],
                    marginBottom: "8px",
                  }}
                >
                  Default HSN Code
                </label>
                <input
                  type="text"
                  value={gstConfig.defaultHSN}
                  onChange={(e) =>
                    setGstConfig({ ...gstConfig, defaultHSN: e.target.value })
                  }
                  placeholder="8306"
                  style={{ ...inputStyle, fontFamily: fonts.mono }}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
            </div>

            {/* Legal entity block — these values appear on every invoice
                AND in legal page boilerplate ("VastuCart is operated by…")
                via the {{legalName}} / {{registeredAddress}} / {{gstin}}
                template variables. Single source of truth. */}
            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                background: "rgba(1,63,71,0.04)",
                borderRadius: "8px",
                fontSize: "12px",
                color: primary[400],
              }}
            >
              📍 Editing the fields below updates: every invoice header · all 9
              legal pages (refund, terms, privacy, etc.) · invoice GSTIN line.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: earth[700],
                    marginBottom: "8px",
                  }}
                >
                  Legal Entity Name
                </label>
                <input
                  type="text"
                  value={gstConfig.legalName ?? ""}
                  onChange={(e) =>
                    setGstConfig({ ...gstConfig, legalName: e.target.value })
                  }
                  placeholder="Prashant Kumar, Sole Proprietor"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: earth[700],
                    marginBottom: "8px",
                  }}
                >
                  Registered State
                </label>
                <input
                  type="text"
                  value={gstConfig.sellerState ?? ""}
                  onChange={(e) =>
                    setGstConfig({ ...gstConfig, sellerState: e.target.value })
                  }
                  placeholder="Rajasthan"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: earth[700],
                  marginBottom: "8px",
                }}
              >
                Registered Address (per GSTIN)
              </label>
              <input
                type="text"
                value={gstConfig.registeredAddress ?? ""}
                onChange={(e) =>
                  setGstConfig({ ...gstConfig, registeredAddress: e.target.value })
                }
                placeholder="VastuCart Premiere Enc, HN 2, Via Udaipurwati, Jhunjhunu, Rajasthan – 333307"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = primary[400])}
                onBlur={(e) => (e.target.style.borderColor = earth[300])}
              />
            </div>
            <button
              onClick={handleSaveGST}
              disabled={isSavingGST}
              style={{ ...btnPrimary, opacity: isSavingGST ? 0.7 : 1 }}
              onMouseEnter={(e) => {
                if (!isSavingGST)
                  e.currentTarget.style.background = primary[400]
              }}
              onMouseLeave={(e) => {
                if (!isSavingGST)
                  e.currentTarget.style.background = primary[500]
              }}
            >
              {isSavingGST ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save GST Settings
            </button>
          </div>
        )}

        {/* International Tab */}
        {activeTaxTab === "international" && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={intlTax.taxExempt}
                  onChange={(e) =>
                    setIntlTax({ ...intlTax, taxExempt: e.target.checked })
                  }
                  style={{
                    width: "20px",
                    height: "20px",
                    cursor: "pointer",
                  }}
                />
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: earth[700],
                  }}
                >
                  Tax Exempt (Export under LUT)
                </span>
              </label>
              <p
                style={{
                  margin: "8px 0 0 32px",
                  fontSize: "13px",
                  color: earth[500],
                }}
              >
                Enable if you export goods under a Letter of Undertaking (LUT)
                — zero-rated supply under GST.
              </p>
            </div>

            {intlTax.taxExempt && (
              <div style={{ marginBottom: "24px", maxWidth: "400px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: earth[700],
                    marginBottom: "8px",
                  }}
                >
                  LUT Number
                </label>
                <input
                  type="text"
                  value={intlTax.lutNumber}
                  onChange={(e) =>
                    setIntlTax({ ...intlTax, lutNumber: e.target.value })
                  }
                  placeholder="AD290225000012345"
                  style={{ ...inputStyle, fontFamily: fonts.mono }}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
            )}

            <button
              onClick={handleSaveIntl}
              disabled={isSavingIntl}
              style={{ ...btnPrimary, opacity: isSavingIntl ? 0.7 : 1 }}
              onMouseEnter={(e) => {
                if (!isSavingIntl)
                  e.currentTarget.style.background = primary[400]
              }}
              onMouseLeave={(e) => {
                if (!isSavingIntl)
                  e.currentTarget.style.background = primary[500]
              }}
            >
              {isSavingIntl ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save International Tax Settings
            </button>
          </div>
        )}

        {/* Per-Product Tab */}
        {activeTaxTab === "per-product" && (
          <div>
            {productRows.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 24px",
                  color: earth[500],
                  fontSize: "14px",
                }}
              >
                No products found. Add products first to configure per-product
                tax overrides.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: bg.subtle }}>
                      {[
                        "Product",
                        "SKU",
                        "GST Rate (%)",
                        "HSN Code",
                        "Action",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "14px 16px",
                            textAlign: "left",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: earth[700],
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {productRows.map((row, idx) => (
                      <tr
                        key={row.productId}
                        style={{
                          borderTop:
                            idx === 0 ? "none" : `1px solid ${bg.subtle}`,
                          background: bg.card,
                        }}
                      >
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: earth[700],
                            maxWidth: "220px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.productName}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: "13px",
                            color: earth[500],
                            fontFamily: fonts.mono,
                          }}
                        >
                          {row.sku}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <input
                            type="number"
                            value={row.gstRate}
                            onChange={(e) =>
                              updateProductRow(idx, "gstRate", e.target.value)
                            }
                            min={0}
                            max={100}
                            style={{
                              ...inputStyle,
                              width: "90px",
                              padding: "6px 10px",
                              fontSize: "13px",
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderColor = primary[400])
                            }
                            onBlur={(e) =>
                              (e.target.style.borderColor = earth[300])
                            }
                          />
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <input
                            type="text"
                            value={row.hsnCode}
                            onChange={(e) =>
                              updateProductRow(idx, "hsnCode", e.target.value)
                            }
                            style={{
                              ...inputStyle,
                              width: "120px",
                              padding: "6px 10px",
                              fontSize: "13px",
                              fontFamily: fonts.mono,
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderColor = primary[400])
                            }
                            onBlur={(e) =>
                              (e.target.style.borderColor = earth[300])
                            }
                          />
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <button
                            onClick={() => handleSaveProductRow(idx)}
                            disabled={savingProductId === row.productId}
                            style={{
                              ...btnPrimary,
                              padding: "6px 14px",
                              fontSize: "13px",
                              opacity:
                                savingProductId === row.productId ? 0.7 : 1,
                            }}
                          >
                            {savingProductId === row.productId ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Save size={14} />
                            )}
                            Save
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
