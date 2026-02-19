"use client"

import { useState } from "react"
import {
  Save,
  Package,
  DollarSign,
  Truck,
  FileText,
  MapPin,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react"
import { primary, secondary, earth, bg, fonts, shadows, semantic, gradients } from "@/lib/theme"
import type { AdminShippingProps, DeliveryEstimate } from "@/types/admin-shipping"

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

export function AdminShipping({
  config,
  isLoading,
  onSaveZones,
  onSaveFreeShipping,
  onSaveCOD,
  onSaveDeliveryEstimates,
  onSaveShippingPolicy,
}: AdminShippingProps) {
  // --- Zones ---
  const [domesticRate, setDomesticRate] = useState(
    config.zones.find((z) => z.currency === "INR")?.rate ?? 49
  )
  const [internationalRate, setInternationalRate] = useState(
    config.zones.find((z) => z.currency === "USD")?.rate ?? 15
  )
  const [savingZones, setSavingZones] = useState(false)

  // --- Free Shipping ---
  const [freeShipping, setFreeShipping] = useState(config.freeShipping)
  const [savingFree, setSavingFree] = useState(false)

  // --- COD ---
  const [cod, setCod] = useState(config.cod)
  const [savingCod, setSavingCod] = useState(false)

  // --- Delivery Estimates ---
  const [estimates, setEstimates] = useState<DeliveryEstimate[]>(config.deliveryEstimates)
  const [savingEstimates, setSavingEstimates] = useState(false)

  // --- Policy ---
  const [policy, setPolicy] = useState(config.shippingPolicy)
  const [savingPolicy, setSavingPolicy] = useState(false)

  const handleSaveZones = async () => {
    setSavingZones(true)
    try {
      await onSaveZones([
        {
          id: "zone-domestic",
          name: "Domestic (India)",
          rate: domesticRate,
          currency: "INR",
          isEnabled: true,
        },
        {
          id: "zone-international",
          name: "International",
          rate: internationalRate,
          currency: "USD",
          isEnabled: true,
        },
      ])
    } finally {
      setSavingZones(false)
    }
  }

  const addEstimateRow = () => {
    setEstimates((prev) => [
      ...prev,
      { id: `de-${Date.now()}`, region: "", pincodePrefix: "", minDays: 5, maxDays: 10 },
    ])
  }

  const updateEstimate = (
    idx: number,
    field: keyof DeliveryEstimate,
    value: string | number
  ) => {
    setEstimates((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)))
  }

  const deleteEstimate = (idx: number) => {
    setEstimates((prev) => prev.filter((_, i) => i !== idx))
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "300px",
        }}
      >
        <Loader2
          size={32}
          style={{ color: primary[500], animation: "spin 1s linear infinite" }}
        />
      </div>
    )
  }

  return (
    <div style={{ fontFamily: fonts.body, maxWidth: "1200px" }}>
      {/* Shipping Zones */}
      <div style={cardStyle}>
        <div
          style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}
        >
          <Package size={24} style={{ color: primary[500] }} />
          <h2
            style={{
              fontFamily: fonts.heading,
              fontSize: "20px",
              fontWeight: 600,
              color: earth[700],
              margin: 0,
            }}
          >
            Shipping Zones
          </h2>
        </div>

        <div style={{ display: "grid", gap: "20px" }}>
          {/* Domestic */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 200px 120px",
              gap: "16px",
              alignItems: "center",
              padding: "20px",
              background: bg.subtle,
              borderRadius: "8px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: earth[700],
                  marginBottom: "4px",
                }}
              >
                Domestic (India)
              </div>
              <div style={{ fontSize: "13px", color: earth[500] }}>All India shipping</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: earth[600] }}>₹</span>
              <input
                type="number"
                value={domesticRate}
                onChange={(e) => setDomesticRate(Number(e.target.value))}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = primary[400])}
                onBlur={(e) => (e.target.style.borderColor = earth[300])}
              />
            </div>
            <span
              style={{
                background: semantic.successLight,
                color: semantic.success,
                padding: "6px 12px",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              Enabled
            </span>
          </div>

          {/* International */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 200px 120px",
              gap: "16px",
              alignItems: "center",
              padding: "20px",
              background: bg.subtle,
              borderRadius: "8px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: earth[700],
                  marginBottom: "4px",
                }}
              >
                International
              </div>
              <div style={{ fontSize: "13px", color: earth[500] }}>Worldwide shipping</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: earth[600] }}>$</span>
              <input
                type="number"
                value={internationalRate}
                onChange={(e) => setInternationalRate(Number(e.target.value))}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = primary[400])}
                onBlur={(e) => (e.target.style.borderColor = earth[300])}
              />
            </div>
            <span
              style={{
                background: semantic.successLight,
                color: semantic.success,
                padding: "6px 12px",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              Enabled
            </span>
          </div>
        </div>

        <button
          onClick={handleSaveZones}
          disabled={savingZones}
          style={{ ...btnPrimary, marginTop: "24px", opacity: savingZones ? 0.7 : 1 }}
          onMouseEnter={(e) => {
            if (!savingZones) e.currentTarget.style.background = primary[400]
          }}
          onMouseLeave={(e) => (e.currentTarget.style.background = primary[500])}
        >
          {savingZones ? (
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Save size={16} />
          )}
          {savingZones ? "Saving..." : "Save Zones"}
        </button>
      </div>

      {/* Free Shipping */}
      <div style={cardStyle}>
        <div
          style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}
        >
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
            Free Shipping
          </h2>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={freeShipping.enabled}
              onChange={(e) => setFreeShipping({ ...freeShipping, enabled: e.target.checked })}
              style={{
                width: "20px",
                height: "20px",
                cursor: "pointer",
                accentColor: primary[500],
              }}
            />
            <span style={{ fontSize: "15px", fontWeight: 600, color: earth[700] }}>
              Enable Free Shipping
            </span>
          </label>
        </div>

        {freeShipping.enabled && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "20px",
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
                Domestic Threshold (INR)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px", color: earth[600] }}>₹</span>
                <input
                  type="number"
                  value={freeShipping.thresholdINR}
                  onChange={(e) =>
                    setFreeShipping({ ...freeShipping, thresholdINR: Number(e.target.value) })
                  }
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
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
                International Threshold (USD)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px", color: earth[600] }}>$</span>
                <input
                  type="number"
                  value={freeShipping.thresholdUSD}
                  onChange={(e) =>
                    setFreeShipping({ ...freeShipping, thresholdUSD: Number(e.target.value) })
                  }
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={async () => {
            setSavingFree(true)
            try {
              await onSaveFreeShipping(freeShipping)
            } finally {
              setSavingFree(false)
            }
          }}
          disabled={savingFree}
          style={{ ...btnPrimary, opacity: savingFree ? 0.7 : 1 }}
          onMouseEnter={(e) => {
            if (!savingFree) e.currentTarget.style.background = primary[400]
          }}
          onMouseLeave={(e) => (e.currentTarget.style.background = primary[500])}
        >
          {savingFree ? (
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Save size={16} />
          )}
          {savingFree ? "Saving..." : "Save Free Shipping"}
        </button>
      </div>

      {/* COD Settings */}
      <div style={cardStyle}>
        <div
          style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}
        >
          <Truck size={24} style={{ color: primary[500] }} />
          <h2
            style={{
              fontFamily: fonts.heading,
              fontSize: "20px",
              fontWeight: 600,
              color: earth[700],
              margin: 0,
            }}
          >
            Cash on Delivery (COD)
          </h2>
          <span
            style={{
              background: secondary[50],
              color: secondary[500],
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            India Only
          </span>
        </div>
        <p style={{ fontSize: "13px", color: earth[500], margin: "0 0 24px 0" }}>
          COD is available only for domestic orders within India
        </p>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={cod.enabled}
              onChange={(e) => setCod({ ...cod, enabled: e.target.checked })}
              style={{
                width: "20px",
                height: "20px",
                cursor: "pointer",
                accentColor: primary[500],
              }}
            />
            <span style={{ fontSize: "15px", fontWeight: 600, color: earth[700] }}>
              Enable COD
            </span>
          </label>
        </div>

        {cod.enabled && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "20px",
              marginBottom: "20px",
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
                COD Fee (₹)
              </label>
              <input
                type="number"
                value={cod.fee}
                onChange={(e) => setCod({ ...cod, fee: Number(e.target.value) })}
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
                Minimum Order (₹)
              </label>
              <input
                type="number"
                value={cod.minOrder}
                onChange={(e) => setCod({ ...cod, minOrder: Number(e.target.value) })}
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
                Maximum Order (₹)
              </label>
              <input
                type="number"
                value={cod.maxOrder}
                onChange={(e) => setCod({ ...cod, maxOrder: Number(e.target.value) })}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = primary[400])}
                onBlur={(e) => (e.target.style.borderColor = earth[300])}
              />
            </div>
          </div>
        )}

        <button
          onClick={async () => {
            setSavingCod(true)
            try {
              await onSaveCOD(cod)
            } finally {
              setSavingCod(false)
            }
          }}
          disabled={savingCod}
          style={{ ...btnPrimary, opacity: savingCod ? 0.7 : 1 }}
          onMouseEnter={(e) => {
            if (!savingCod) e.currentTarget.style.background = primary[400]
          }}
          onMouseLeave={(e) => (e.currentTarget.style.background = primary[500])}
        >
          {savingCod ? (
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Save size={16} />
          )}
          {savingCod ? "Saving..." : "Save COD Settings"}
        </button>
      </div>

      {/* Delivery Estimates — CRUD */}
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <MapPin size={24} style={{ color: primary[500] }} />
            <h2
              style={{
                fontFamily: fonts.heading,
                fontSize: "20px",
                fontWeight: 600,
                color: earth[700],
                margin: 0,
              }}
            >
              Delivery Estimates
            </h2>
          </div>
          <button
            onClick={addEstimateRow}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: primary[50],
              color: primary[500],
              border: `1px solid ${primary[200]}`,
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={14} />
            Add Row
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: bg.subtle }}>
                {["Region", "Pincode Prefix", "Min Days", "Max Days", ""].map((h) => (
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
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {estimates.map((est, idx) => (
                <tr
                  key={est.id}
                  style={{
                    borderTop: idx === 0 ? "none" : `1px solid ${bg.subtle}`,
                    background: bg.card,
                  }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <input
                      value={est.region}
                      onChange={(e) => updateEstimate(idx, "region", e.target.value)}
                      placeholder="e.g. Metro Cities"
                      style={{ ...inputStyle, padding: "8px 10px" }}
                      onFocus={(e) => (e.target.style.borderColor = primary[400])}
                      onBlur={(e) => (e.target.style.borderColor = earth[300])}
                    />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <input
                      value={est.pincodePrefix}
                      onChange={(e) => updateEstimate(idx, "pincodePrefix", e.target.value)}
                      placeholder="e.g. 1,2,4 (blank = all)"
                      style={{
                        ...inputStyle,
                        padding: "8px 10px",
                        fontFamily: fonts.mono,
                      }}
                      onFocus={(e) => (e.target.style.borderColor = primary[400])}
                      onBlur={(e) => (e.target.style.borderColor = earth[300])}
                    />
                  </td>
                  <td style={{ padding: "12px 16px", width: "110px" }}>
                    <input
                      type="number"
                      value={est.minDays}
                      onChange={(e) =>
                        updateEstimate(idx, "minDays", Number(e.target.value))
                      }
                      style={{ ...inputStyle, padding: "8px 10px" }}
                      onFocus={(e) => (e.target.style.borderColor = primary[400])}
                      onBlur={(e) => (e.target.style.borderColor = earth[300])}
                    />
                  </td>
                  <td style={{ padding: "12px 16px", width: "110px" }}>
                    <input
                      type="number"
                      value={est.maxDays}
                      onChange={(e) =>
                        updateEstimate(idx, "maxDays", Number(e.target.value))
                      }
                      style={{ ...inputStyle, padding: "8px 10px" }}
                      onFocus={(e) => (e.target.style.borderColor = primary[400])}
                      onBlur={(e) => (e.target.style.borderColor = earth[300])}
                    />
                  </td>
                  <td style={{ padding: "12px 16px", width: "50px" }}>
                    <button
                      onClick={() => deleteEstimate(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: semantic.error,
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Delete row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {estimates.length === 0 && (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: earth[400],
                fontSize: "14px",
              }}
            >
              No delivery estimate rules. Click &quot;Add Row&quot; to add one.
            </div>
          )}
        </div>

        <button
          onClick={async () => {
            setSavingEstimates(true)
            try {
              await onSaveDeliveryEstimates(estimates)
            } finally {
              setSavingEstimates(false)
            }
          }}
          disabled={savingEstimates}
          style={{ ...btnPrimary, marginTop: "24px", opacity: savingEstimates ? 0.7 : 1 }}
          onMouseEnter={(e) => {
            if (!savingEstimates) e.currentTarget.style.background = primary[400]
          }}
          onMouseLeave={(e) => (e.currentTarget.style.background = primary[500])}
        >
          {savingEstimates ? (
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Save size={16} />
          )}
          {savingEstimates ? "Saving..." : "Save Delivery Estimates"}
        </button>
      </div>

      {/* Shipping Policy */}
      <div style={{ ...cardStyle, marginBottom: 0 }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}
        >
          <FileText size={24} style={{ color: primary[500] }} />
          <h2
            style={{
              fontFamily: fonts.heading,
              fontSize: "20px",
              fontWeight: 600,
              color: earth[700],
              margin: 0,
            }}
          >
            Shipping Policy
          </h2>
        </div>
        <p style={{ fontSize: "13px", color: earth[500], margin: "0 0 16px 0" }}>
          This content is displayed on the public{" "}
          <strong>/shipping-policy</strong> page. Markdown is supported.
        </p>

        <textarea
          value={policy}
          onChange={(e) => setPolicy(e.target.value)}
          placeholder="Enter your shipping policy content (markdown supported)..."
          style={{
            width: "100%",
            minHeight: "300px",
            padding: "16px",
            border: `1px solid ${earth[300]}`,
            borderRadius: "8px",
            fontSize: "14px",
            fontFamily: fonts.mono,
            lineHeight: 1.6,
            resize: "vertical",
            outline: "none",
            marginBottom: "20px",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = primary[400])}
          onBlur={(e) => (e.target.style.borderColor = earth[300])}
        />

        <button
          onClick={async () => {
            setSavingPolicy(true)
            try {
              await onSaveShippingPolicy(policy)
            } finally {
              setSavingPolicy(false)
            }
          }}
          disabled={savingPolicy}
          style={{ ...btnPrimary, opacity: savingPolicy ? 0.7 : 1 }}
          onMouseEnter={(e) => {
            if (!savingPolicy) e.currentTarget.style.background = primary[400]
          }}
          onMouseLeave={(e) => (e.currentTarget.style.background = primary[500])}
        >
          {savingPolicy ? (
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Save size={16} />
          )}
          {savingPolicy ? "Saving..." : "Save Shipping Policy"}
        </button>
      </div>
    </div>
  )
}
