"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Power,
  ChevronLeft,
  ArrowRight,
  Tag,
  CreditCard,
  Sparkles,
  Send,
  X,
} from "lucide-react"
import type {
  AdminCouponsGiftCardsProps,
  CouponRow,
  CouponDetail,
  CouponStatus,
  CustomerEligibility,
  DiscountType,
  GiftCardRow,
  GiftCardDetail,
  GiftCardStatus,
  GiftCardTransaction,
} from "@/types/admin-coupon"
import { ThemeSelect } from "@/components/ui/ThemeSelect"

const c = {
  primary500: "#013f47",
  primary400: "#2a7a72",
  primary200: "#71c1ae",
  primary100: "#c5e8e2",
  primary50: "#e8f5f3",
  secondary500: "#c85103",
  secondary300: "#fd8630",
  secondary50: "#fff5ed",
  bg: "#fffbf5",
  card: "#ffffff",
  subtle: "#f5dfbb",
  earth300: "#a39585",
  earth400: "#75615a",
  earth500: "#71685b",
  earth600: "#5a4f47",
  earth700: "#433b35",
  success: "#10B981",
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  gradient: "linear-gradient(90deg, #013f47, #2a7a72, #c85103)",
  shadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
}
const fonts = {
  heading: "'Lora', serif",
  body: "'Open Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
}

const CARD_STYLE: React.CSSProperties = {
  background: `linear-gradient(${c.card}, ${c.card}) padding-box, ${c.gradient} border-box`,
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "16px",
  boxShadow: c.shadow,
  borderTop: "3px solid transparent",
}

const formatCurrency = (amount: number, currency: "INR" | "USD"): string => {
  if (currency === "INR") {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

const formatDateTime = (date: string): string =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const generateCouponCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

const generateGiftCardCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = "GC-"
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-"
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// ===== Status Badge =====

function StatusBadge({
  status,
}: {
  status: CouponStatus | GiftCardStatus
}) {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: c.successLight, text: c.success, label: "Active" },
    expired: { bg: c.earth300 + "20", text: c.earth500, label: "Expired" },
    disabled: { bg: c.errorLight, text: c.error, label: "Disabled" },
    inactive: { bg: c.earth300 + "20", text: c.earth500, label: "Inactive" },
    depleted: { bg: c.errorLight, text: c.error, label: "Depleted" },
  }
  const badge = colors[status] || { bg: c.subtle, text: c.earth600, label: status }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: "6px",
        fontSize: "13px",
        fontWeight: 500,
        fontFamily: fonts.body,
        backgroundColor: badge.bg,
        color: badge.text,
      }}
    >
      {badge.label}
    </span>
  )
}

// ===== Coupon Row =====

interface CouponRowCompProps {
  coupon: CouponRow
  onEdit: (id: string) => void
  onRequestDelete: (id: string) => void
  onToggle: (id: string) => Promise<void>
}

function CouponRowComp({ coupon, onEdit, onRequestDelete, onToggle }: CouponRowCompProps) {
  const [isToggling, setIsToggling] = useState(false)

  const discountBadge =
    coupon.discountType === "percentage"
      ? `${coupon.discountValue}% OFF`
      : formatCurrency(coupon.discountValue, coupon.currency)

  const usageText = coupon.usageLimit
    ? `${coupon.usedCount}/${coupon.usageLimit}`
    : `${coupon.usedCount}/∞`

  const usagePercent = coupon.usageLimit
    ? Math.min((coupon.usedCount / coupon.usageLimit) * 100, 100)
    : Math.min((coupon.usedCount / 500) * 100, 100)

  const handleToggle = async () => {
    setIsToggling(true)
    try {
      await onToggle(coupon.id)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <tr style={{ borderBottom: `1px solid ${c.subtle}` }}>
      <td style={{ padding: "16px 12px" }}>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: "15px",
            fontWeight: 600,
            color: c.earth700,
          }}
        >
          {coupon.code}
        </div>
      </td>
      <td style={{ padding: "16px 12px" }}>
        <span
          style={{
            display: "inline-block",
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 600,
            fontFamily: fonts.body,
            background: c.gradient,
            color: c.card,
          }}
        >
          {discountBadge}
        </span>
      </td>
      <td
        style={{
          padding: "16px 12px",
          fontSize: "14px",
          color: c.earth600,
          fontFamily: fonts.body,
        }}
      >
        {coupon.minOrder ? formatCurrency(coupon.minOrder, coupon.currency) : "—"}
      </td>
      <td
        style={{
          padding: "16px 12px",
          fontSize: "14px",
          color: c.earth600,
          fontFamily: fonts.body,
        }}
      >
        {coupon.maxDiscount
          ? formatCurrency(coupon.maxDiscount, coupon.currency)
          : "—"}
      </td>
      <td
        style={{
          padding: "16px 12px",
          fontSize: "14px",
          color: c.earth600,
          fontFamily: fonts.body,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>{coupon.startDate ? formatDate(coupon.startDate) : "—"}</span>
          <ArrowRight size={14} color={c.earth400} />
          <span>{coupon.endDate ? formatDate(coupon.endDate) : "—"}</span>
        </div>
      </td>
      <td style={{ padding: "16px 12px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            minWidth: "100px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontFamily: fonts.mono,
              color: c.earth600,
            }}
          >
            {usageText}
          </div>
          <div
            style={{
              width: "100%",
              height: "4px",
              borderRadius: "2px",
              background: c.subtle,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${usagePercent}%`,
                height: "100%",
                background: c.gradient,
                transition: "width 0.2s",
              }}
            />
          </div>
        </div>
      </td>
      <td style={{ padding: "16px 12px" }}>
        <StatusBadge status={coupon.status} />
      </td>
      <td style={{ padding: "16px 12px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => onEdit(coupon.id)}
            title="Edit"
            style={{
              padding: "6px",
              border: "none",
              borderRadius: "6px",
              background: c.primary50,
              color: c.primary500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={handleToggle}
            disabled={isToggling}
            title={coupon.status === "active" ? "Disable" : "Enable"}
            style={{
              padding: "6px",
              border: "none",
              borderRadius: "6px",
              background:
                coupon.status === "active" ? c.warningLight : c.successLight,
              color: coupon.status === "active" ? c.warning : c.success,
              cursor: isToggling ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: isToggling ? 0.6 : 1,
            }}
          >
            <Power size={16} />
          </button>
          <button
            onClick={() => onRequestDelete(coupon.id)}
            title="Delete"
            style={{
              padding: "6px",
              border: "none",
              borderRadius: "6px",
              background: c.errorLight,
              color: c.error,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ===== Coupon Form =====

interface CouponFormProps {
  coupon: CouponDetail | null
  categories: { id: string; name: string }[]
  isSaving?: boolean
  onSave: (data: Partial<CouponDetail>) => Promise<void>
  onCancel: () => void
  onSearchProducts?: (query: string) => Promise<{ id: string; title: string }[]>
}

function CouponForm({
  coupon,
  categories,
  isSaving,
  onSave,
  onCancel,
  onSearchProducts,
}: CouponFormProps) {
  const isEditing = !!(coupon?.id)

  const [code, setCode] = useState(coupon?.code || "")
  const [description, setDescription] = useState(coupon?.description || "")
  const [discountType, setDiscountType] = useState<DiscountType>(
    coupon?.discountType || "percentage"
  )
  const [discountValue, setDiscountValue] = useState(coupon?.discountValue || 0)
  const [minOrder, setMinOrder] = useState<number | null>(coupon?.minOrder || null)
  const [maxDiscount, setMaxDiscount] = useState<number | null>(
    coupon?.maxDiscount || null
  )
  const [currency, setCurrency] = useState<"INR" | "USD">(
    coupon?.currency || "INR"
  )
  const [startDate, setStartDate] = useState(
    coupon?.startDate || new Date().toISOString().split("T")[0]
  )
  const [endDate, setEndDate] = useState(coupon?.endDate || "")
  const [usageLimit, setUsageLimit] = useState<number | null>(
    coupon?.usageLimit || null
  )
  const [usageLimitPerCustomer, setUsageLimitPerCustomer] = useState(
    coupon?.usageLimitPerCustomer || 1
  )
  const [targetType, setTargetType] = useState<"all" | "products" | "categories">(
    coupon?.targetType || "all"
  )
  const [customerEligibility, setCustomerEligibility] = useState<CustomerEligibility>(
    coupon?.customerEligibility || "all"
  )
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    coupon?.targetCategoryIds || []
  )
  // Products stored as { id, title } so we can show names
  const [selectedProducts, setSelectedProducts] = useState<
    { id: string; title: string }[]
  >(
    (coupon?.targetProductIds || []).map((id) => ({ id, title: id }))
  )
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [productSearchResults, setProductSearchResults] = useState<
    { id: string; title: string }[]
  >([])
  const [isSearchingProducts, setIsSearchingProducts] = useState(false)

  // Debounced product search
  useEffect(() => {
    if (!productSearchQuery.trim() || !onSearchProducts) {
      setProductSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearchingProducts(true)
      const results = await onSearchProducts(productSearchQuery)
      setProductSearchResults(results)
      setIsSearchingProducts(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [productSearchQuery, onSearchProducts])

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    )
  }

  const addProduct = (product: { id: string; title: string }) => {
    setSelectedProducts((prev) =>
      prev.find((p) => p.id === product.id) ? prev : [...prev, product]
    )
    setProductSearchQuery("")
    setProductSearchResults([])
  }

  const removeProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId))
  }

  const handleSubmit = async () => {
    const targetNames =
      targetType === "categories"
        ? selectedCategories
            .map((id) => categories.find((c) => c.id === id)?.name || id)
            .filter(Boolean)
        : targetType === "products"
        ? selectedProducts.map((p) => p.title)
        : []

    const data: Partial<CouponDetail> = {
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrder: minOrder || null,
      maxDiscount: maxDiscount || null,
      currency,
      startDate,
      endDate,
      usageLimit: usageLimit || null,
      usageLimitPerCustomer,
      targetType,
      targetCategoryIds: targetType === "categories" ? selectedCategories : [],
      targetProductIds:
        targetType === "products" ? selectedProducts.map((p) => p.id) : [],
      targetNames,
      customerEligibility,
    }
    await onSave(data)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${c.subtle}`,
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: fonts.body,
    color: c.earth700,
    background: c.card,
    boxSizing: "border-box",
    outline: "none",
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "14px",
    fontWeight: 500,
    color: c.earth600,
    marginBottom: "6px",
  }

  return (
    <div style={{ minHeight: "100vh", padding: "24px", background: c.bg, fontFamily: fonts.body }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={onCancel}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            background: c.card,
            color: c.earth600,
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            marginBottom: "16px",
          }}
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 600,
            fontFamily: fonts.heading,
            color: c.earth700,
            margin: 0,
          }}
        >
          {isEditing ? "Edit Coupon" : "Create Coupon"}
        </h1>
      </div>

      {/* Basic Info */}
      <div style={CARD_STYLE}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            fontFamily: fonts.heading,
            color: c.earth700,
            marginTop: 0,
            marginBottom: "16px",
          }}
        >
          Basic Information
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Coupon Code</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20"
                style={{ ...inputStyle, flex: 1, fontFamily: fonts.mono, fontWeight: 600 }}
              />
              <button
                onClick={() => setCode(generateCouponCode())}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: "6px",
                  background: c.primary50,
                  color: c.primary500,
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                <Sparkles size={16} />
                Auto-generate
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this coupon"
              rows={3}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </div>
        </div>
      </div>

      {/* Discount Rules */}
      <div style={CARD_STYLE}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            fontFamily: fonts.heading,
            color: c.earth700,
            marginTop: 0,
            marginBottom: "16px",
          }}
        >
          Discount Rules
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Discount Type</label>
            <div style={{ display: "flex", gap: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="radio"
                  checked={discountType === "percentage"}
                  onChange={() => setDiscountType("percentage")}
                  style={{ accentColor: c.primary500 }}
                />
                <span style={{ fontSize: "14px", color: c.earth700 }}>Percentage</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="radio"
                  checked={discountType === "fixed"}
                  onChange={() => setDiscountType("fixed")}
                  style={{ accentColor: c.primary500 }}
                />
                <span style={{ fontSize: "14px", color: c.earth700 }}>Flat Amount</span>
              </label>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>
                {discountType === "percentage" ? "Percentage Value" : "Discount Amount"}
              </label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) =>
                  setDiscountValue(parseFloat(e.target.value) || 0)
                }
                placeholder={discountType === "percentage" ? "20" : "500"}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Currency</label>
              <ThemeSelect
                value={currency}
                onChange={(v) => setCurrency(v as "INR" | "USD")}
                options={[
                  { value: "INR", label: "INR (₹)" },
                  { value: "USD", label: "USD ($)" },
                ]}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Minimum Order Value</label>
              <input
                type="number"
                value={minOrder ?? ""}
                onChange={(e) =>
                  setMinOrder(parseFloat(e.target.value) || null)
                }
                placeholder="0 = no minimum"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Maximum Discount Cap</label>
              <input
                type="number"
                value={maxDiscount ?? ""}
                onChange={(e) =>
                  setMaxDiscount(parseFloat(e.target.value) || null)
                }
                placeholder="0 = no cap"
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Validity */}
      <div style={CARD_STYLE}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            fontFamily: fonts.heading,
            color: c.earth700,
            marginTop: 0,
            marginBottom: "16px",
          }}
        >
          Validity Period
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Usage Limits */}
      <div style={CARD_STYLE}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            fontFamily: fonts.heading,
            color: c.earth700,
            marginTop: 0,
            marginBottom: "16px",
          }}
        >
          Usage Limits
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Total Usage Limit</label>
            <input
              type="number"
              value={usageLimit ?? ""}
              onChange={(e) => setUsageLimit(parseInt(e.target.value) || null)}
              placeholder="Leave empty for unlimited"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Per Customer Limit</label>
            <input
              type="number"
              value={usageLimitPerCustomer}
              onChange={(e) =>
                setUsageLimitPerCustomer(parseInt(e.target.value) || 1)
              }
              min="1"
              placeholder="1"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Targeting */}
      <div style={{ ...CARD_STYLE, marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            fontFamily: fonts.heading,
            color: c.earth700,
            marginTop: 0,
            marginBottom: "16px",
          }}
        >
          Target Products
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {(["all", "categories", "products"] as const).map((opt) => (
            <label
              key={opt}
              style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
            >
              <input
                type="radio"
                checked={targetType === opt}
                onChange={() => setTargetType(opt)}
                style={{ accentColor: c.primary500 }}
              />
              <span style={{ fontSize: "14px", color: c.earth700 }}>
                {opt === "all"
                  ? "All Products"
                  : opt === "categories"
                  ? "Specific Categories"
                  : "Specific Products"}
              </span>
            </label>
          ))}
        </div>

        {/* Category picker */}
        {targetType === "categories" && (
          <div
            style={{
              marginTop: "16px",
              padding: "16px",
              background: c.bg,
              borderRadius: "6px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "8px",
            }}
          >
            {categories.length > 0 ? (
              categories.map((cat) => (
                <label
                  key={cat.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    style={{ accentColor: c.primary500 }}
                  />
                  <span style={{ fontSize: "14px", color: c.earth700 }}>{cat.name}</span>
                </label>
              ))
            ) : (
              <p style={{ fontSize: "14px", color: c.earth400, margin: 0 }}>
                No categories found
              </p>
            )}
          </div>
        )}

        {/* Product picker */}
        {targetType === "products" && (
          <div style={{ marginTop: "16px" }}>
            {/* Selected products */}
            {selectedProducts.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                {selectedProducts.map((p) => (
                  <span
                    key={p.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      background: c.primary100,
                      color: c.primary500,
                      borderRadius: "16px",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    {p.title}
                    <button
                      onClick={() => removeProduct(p.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        color: c.primary500,
                      }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* Search box */}
            <div style={{ position: "relative" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: c.earth400,
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                placeholder="Search products to add…"
                style={{ ...inputStyle, paddingLeft: "38px" }}
              />
            </div>
            {/* Results */}
            {isSearchingProducts && (
              <p style={{ fontSize: "13px", color: c.earth400, marginTop: "8px" }}>
                Searching…
              </p>
            )}
            {productSearchResults.length > 0 && (
              <div
                style={{
                  marginTop: "4px",
                  border: `1px solid ${c.subtle}`,
                  borderRadius: "6px",
                  overflow: "hidden",
                  background: c.card,
                }}
              >
                {productSearchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 14px",
                      border: "none",
                      borderBottom: `1px solid ${c.subtle}`,
                      background: "transparent",
                      fontSize: "14px",
                      color: c.earth700,
                      cursor: "pointer",
                      fontFamily: fonts.body,
                    }}
                    onMouseEnter={(e) =>
                      ((e.target as HTMLElement).style.background = c.primary50)
                    }
                    onMouseLeave={(e) =>
                      ((e.target as HTMLElement).style.background = "transparent")
                    }
                  >
                    {product.title}
                  </button>
                ))}
              </div>
            )}
            {!onSearchProducts && (
              <p style={{ fontSize: "13px", color: c.earth400, marginTop: "8px" }}>
                Product search not available
              </p>
            )}
          </div>
        )}
      </div>

      {/* Customer Eligibility */}
      <div style={{ ...CARD_STYLE, marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            fontFamily: fonts.heading,
            color: c.earth700,
            marginTop: 0,
            marginBottom: "4px",
          }}
        >
          Customer Eligibility
        </h2>
        <p style={{ fontSize: "13px", color: c.earth400, marginBottom: "16px", marginTop: 0 }}>
          Who can use this coupon?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer" }}>
            <input
              type="radio"
              checked={customerEligibility === "all"}
              onChange={() => setCustomerEligibility("all")}
              style={{ accentColor: c.primary500, marginTop: "2px" }}
            />
            <span>
              <span style={{ fontSize: "14px", color: c.earth700, fontWeight: 500 }}>All Customers</span>
              <span style={{ display: "block", fontSize: "12px", color: c.earth400 }}>
                Any customer can apply this coupon
              </span>
            </span>
          </label>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer" }}>
            <input
              type="radio"
              checked={customerEligibility === "new_customers"}
              onChange={() => setCustomerEligibility("new_customers")}
              style={{ accentColor: c.primary500, marginTop: "2px" }}
            />
            <span>
              <span style={{ fontSize: "14px", color: c.earth700, fontWeight: 500 }}>
                New Customers Only
              </span>
              <span style={{ display: "block", fontSize: "12px", color: c.earth400 }}>
                Only customers placing their first order can use this coupon. Rejected automatically for returning customers.
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          style={{
            padding: "12px 24px",
            border: "none",
            borderRadius: "6px",
            background: "transparent",
            color: c.earth600,
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSaving || !code.trim()}
          style={{
            padding: "12px 24px",
            border: "none",
            borderRadius: "6px",
            background: code.trim() ? c.gradient : c.earth300,
            color: c.card,
            fontSize: "14px",
            fontWeight: 600,
            cursor: isSaving || !code.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Send size={16} />
          {isSaving ? "Saving…" : isEditing ? "Save Changes" : "Create Coupon"}
        </button>
      </div>
    </div>
  )
}

// ===== Gift Card Row =====

interface GiftCardRowCompProps {
  giftCard: GiftCardRow
  onView: (id: string) => void
  onToggle: (id: string) => Promise<void>
}

function GiftCardRowComp({ giftCard, onView, onToggle }: GiftCardRowCompProps) {
  const [isToggling, setIsToggling] = useState(false)

  const balancePercent =
    giftCard.initialBalance > 0
      ? (giftCard.currentBalance / giftCard.initialBalance) * 100
      : 0

  const handleToggle = async () => {
    setIsToggling(true)
    try {
      await onToggle(giftCard.id)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <tr style={{ borderBottom: `1px solid ${c.subtle}` }}>
      <td style={{ padding: "16px 12px" }}>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: "14px",
            fontWeight: 600,
            color: c.earth700,
          }}
        >
          {giftCard.code}
        </div>
      </td>
      <td
        style={{
          padding: "16px 12px",
          fontSize: "14px",
          color: c.earth600,
          fontFamily: fonts.body,
        }}
      >
        {formatCurrency(giftCard.initialBalance, giftCard.currency)}
      </td>
      <td style={{ padding: "16px 12px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            minWidth: "140px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: fonts.body,
              color: c.earth700,
            }}
          >
            {formatCurrency(giftCard.currentBalance, giftCard.currency)}
          </div>
          <div
            style={{
              width: "100%",
              height: "6px",
              borderRadius: "3px",
              background: c.subtle,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${balancePercent}%`,
                height: "100%",
                background: c.gradient,
                transition: "width 0.2s",
              }}
            />
          </div>
        </div>
      </td>
      <td style={{ padding: "16px 12px" }}>
        <StatusBadge status={giftCard.status} />
      </td>
      <td
        style={{
          padding: "16px 12px",
          fontSize: "14px",
          color: c.earth600,
          fontFamily: fonts.body,
        }}
      >
        {giftCard.expiresAt ? formatDate(giftCard.expiresAt) : "Never"}
      </td>
      <td
        style={{
          padding: "16px 12px",
          fontSize: "14px",
          color: c.earth600,
          fontFamily: fonts.body,
        }}
      >
        {formatDate(giftCard.createdAt)}
      </td>
      <td style={{ padding: "16px 12px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => onView(giftCard.id)}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "6px",
              background: c.primary50,
              color: c.primary500,
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            View
          </button>
          <button
            onClick={handleToggle}
            disabled={isToggling}
            title={giftCard.status === "active" ? "Deactivate" : "Activate"}
            style={{
              padding: "6px",
              border: "none",
              borderRadius: "6px",
              background:
                giftCard.status === "active" ? c.warningLight : c.successLight,
              color: giftCard.status === "active" ? c.warning : c.success,
              cursor: isToggling ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: isToggling ? 0.6 : 1,
            }}
          >
            <Power size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ===== Gift Card Detail =====

interface GiftCardDetailCompProps {
  giftCard: GiftCardDetail
  onBack: () => void
  onViewOrder?: (orderId: string) => void
}

function GiftCardDetailComp({ giftCard, onBack, onViewOrder }: GiftCardDetailCompProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px",
        background: c.bg,
        fontFamily: fonts.body,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            background: c.card,
            color: c.earth600,
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            marginBottom: "16px",
          }}
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 600,
            fontFamily: fonts.heading,
            color: c.earth700,
            margin: 0,
          }}
        >
          Gift Card: {giftCard.code}
        </h1>
      </div>

      {/* Summary */}
      <div style={CARD_STYLE}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "24px",
          }}
        >
          <div>
            <div style={{ fontSize: "13px", color: c.earth400, marginBottom: "4px" }}>Code</div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 600,
                fontFamily: fonts.mono,
                color: c.earth700,
              }}
            >
              {giftCard.code}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: c.earth400, marginBottom: "4px" }}>Status</div>
            <StatusBadge status={giftCard.status} />
          </div>
          <div>
            <div style={{ fontSize: "13px", color: c.earth400, marginBottom: "4px" }}>
              Initial Balance
            </div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: c.earth700 }}>
              {formatCurrency(giftCard.initialBalance, giftCard.currency)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: c.earth400, marginBottom: "4px" }}>
              Current Balance
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: c.primary500 }}>
              {formatCurrency(giftCard.currentBalance, giftCard.currency)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: c.earth400, marginBottom: "4px" }}>Customer</div>
            <div style={{ fontSize: "15px", fontWeight: 500, color: c.earth700 }}>
              {giftCard.customerName || "Not assigned"}
            </div>
            {giftCard.customerEmail && (
              <div style={{ fontSize: "13px", color: c.earth500 }}>
                {giftCard.customerEmail}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: "13px", color: c.earth400, marginBottom: "4px" }}>Expires</div>
            <div style={{ fontSize: "15px", color: c.earth700 }}>
              {giftCard.expiresAt ? formatDate(giftCard.expiresAt) : "Never"}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div
        style={{
          ...CARD_STYLE,
          marginBottom: 0,
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 600,
            fontFamily: fonts.heading,
            color: c.earth700,
            marginTop: 0,
            marginBottom: "16px",
          }}
        >
          Transaction History
        </h2>
        {giftCard.transactions.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: c.earth700, marginBottom: "6px" }}>
              This gift card hasn&apos;t been used yet
            </p>
            <p style={{ fontSize: "14px", color: c.earth400, margin: 0 }}>
              Transactions will appear here when the card is used.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${c.subtle}` }}>
                  {["Date", "Type", "Amount", "Description", "Order"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: c.earth500,
                        fontFamily: fonts.body,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {giftCard.transactions.map((tx: GiftCardTransaction) => (
                  <tr key={tx.id} style={{ borderBottom: `1px solid ${c.subtle}` }}>
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        color: c.earth600,
                      }}
                    >
                      {formatDateTime(tx.date)}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background:
                            tx.type === "credit" ? c.successLight : c.errorLight,
                          color: tx.type === "credit" ? c.success : c.error,
                        }}
                      >
                        {tx.type === "credit" ? "Credit" : "Debit"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: tx.type === "credit" ? c.success : c.error,
                      }}
                    >
                      {tx.type === "credit" ? "+" : "-"}
                      {formatCurrency(tx.amount, tx.currency)}
                    </td>
                    <td
                      style={{ padding: "12px", fontSize: "14px", color: c.earth600 }}
                    >
                      {tx.description}
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px" }}>
                      {tx.orderId ? (
                        <button
                          onClick={() => onViewOrder?.(tx.orderId!)}
                          style={{
                            background: "none",
                            border: "none",
                            color: c.primary500,
                            fontWeight: 500,
                            cursor: "pointer",
                            padding: 0,
                            fontSize: "14px",
                            fontFamily: fonts.mono,
                          }}
                        >
                          #{tx.orderId.slice(0, 8)}
                        </button>
                      ) : (
                        <span style={{ color: c.earth400 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ===== Create Gift Card Modal =====

interface CreateGiftCardModalProps {
  onClose: () => void
  onCreate: (
    balance: number,
    currency: "INR" | "USD",
    expiresAt?: string,
    code?: string
  ) => Promise<void>
}

function CreateGiftCardModal({ onClose, onCreate }: CreateGiftCardModalProps) {
  const [code, setCode] = useState(generateGiftCardCode())
  const [balance, setBalance] = useState(1000)
  const [currency, setCurrency] = useState<"INR" | "USD">("INR")
  const [expiresAt, setExpiresAt] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleCreate = async () => {
    setIsSaving(true)
    try {
      await onCreate(balance, currency, expiresAt || undefined, code)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${c.subtle}`,
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: fonts.body,
    color: c.earth700,
    background: c.card,
    boxSizing: "border-box",
    outline: "none",
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: c.card,
          borderRadius: "8px",
          padding: "24px",
          width: "100%",
          maxWidth: "500px",
          boxShadow: c.shadow,
          margin: "0 16px",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 600,
            fontFamily: fonts.heading,
            color: c.earth700,
            marginTop: 0,
            marginBottom: "20px",
          }}
        >
          Create Gift Card
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                color: c.earth600,
                marginBottom: "6px",
              }}
            >
              Gift Card Code
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                style={{
                  ...inputStyle,
                  flex: 1,
                  fontFamily: fonts.mono,
                  fontWeight: 600,
                }}
              />
              <button
                onClick={() => setCode(generateGiftCardCode())}
                style={{
                  padding: "10px 14px",
                  border: "none",
                  borderRadius: "6px",
                  background: c.primary50,
                  color: c.primary500,
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                <Sparkles size={16} />
                New
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: c.earth600,
                  marginBottom: "6px",
                }}
              >
                Initial Balance
              </label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                min="1"
                style={inputStyle}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: c.earth600,
                  marginBottom: "6px",
                }}
              >
                Currency
              </label>
              <ThemeSelect
                value={currency}
                onChange={(v) => setCurrency(v as "INR" | "USD")}
                options={[
                  { value: "INR", label: "INR (₹)" },
                  { value: "USD", label: "USD ($)" },
                ]}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                color: c.earth600,
                marginBottom: "6px",
              }}
            >
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "24px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              background: "transparent",
              color: c.earth600,
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isSaving || balance <= 0}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              background: balance > 0 ? c.gradient : c.earth300,
              color: c.card,
              fontSize: "14px",
              fontWeight: 600,
              cursor: isSaving || balance <= 0 ? "not-allowed" : "pointer",
            }}
          >
            {isSaving ? "Creating…" : "Create Gift Card"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== Confirm Delete Dialog =====

function ConfirmDeleteDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: c.card,
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "400px",
          width: "100%",
          margin: "0 16px",
          boxShadow: c.shadow,
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 600,
            fontFamily: fonts.heading,
            color: c.earth700,
            marginTop: 0,
            marginBottom: "12px",
          }}
        >
          Delete Coupon
        </h3>
        <p style={{ fontSize: "14px", color: c.earth500, marginBottom: "24px" }}>
          This will permanently delete the coupon. This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              background: "transparent",
              color: c.earth600,
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              background: c.error,
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== Main Component =====

export function AdminCouponsGiftCards(props: AdminCouponsGiftCardsProps) {
  const {
    coupons,
    giftCards,
    editingCoupon,
    giftCardDetail,
    activeTab,
    couponStatusFilter,
    searchQuery,
    isLoading,
    isSaving,
    categories = [],
    onChangeTab,
    onChangeCouponStatus,
    onSearch,
    onCreateCoupon,
    onEditCoupon,
    onDeleteCoupon,
    onToggleCoupon,
    onSaveCoupon,
    onCancelCouponEdit,
    onCreateGiftCard,
    onViewGiftCard,
    onToggleGiftCard,
    onBackFromGiftCard,
    onViewOrder,
    onSearchProducts,
  } = props

  const [showCreateGiftCardModal, setShowCreateGiftCardModal] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            className="animate-spin"
            style={{
              width: "40px",
              height: "40px",
              border: `2px solid ${c.primary500}`,
              borderTopColor: "transparent",
              borderRadius: "50%",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ color: c.earth400, fontSize: "14px", fontFamily: fonts.body }}>
            Loading…
          </p>
        </div>
      </div>
    )
  }

  // Coupon form (create / edit)
  if (editingCoupon !== null) {
    return (
      <CouponForm
        coupon={editingCoupon}
        categories={categories}
        isSaving={isSaving}
        onSave={async (data) => {
          await onSaveCoupon?.(data)
        }}
        onCancel={() => onCancelCouponEdit?.()}
        onSearchProducts={onSearchProducts}
      />
    )
  }

  // Gift card detail
  if (giftCardDetail !== null) {
    return (
      <GiftCardDetailComp
        giftCard={giftCardDetail}
        onBack={() => onBackFromGiftCard?.()}
        onViewOrder={onViewOrder}
      />
    )
  }

  // Filter coupons client-side
  const filteredCoupons = coupons.filter((coupon) => {
    const matchesStatus =
      couponStatusFilter === "all" || coupon.status === couponStatusFilter
    const matchesSearch =
      searchQuery === "" ||
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Filter gift cards client-side
  const filteredGiftCards = giftCards.filter(
    (gc) =>
      searchQuery === "" ||
      gc.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const thStyle: React.CSSProperties = {
    padding: "16px 12px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: 600,
    color: c.earth500,
    fontFamily: fonts.body,
  }

  return (
    <div style={{ fontFamily: fonts.body }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            fontFamily: fonts.heading,
            color: c.earth700,
            margin: 0,
            marginBottom: "8px",
          }}
        >
          Coupons &amp; Gift Cards
        </h1>
        <p style={{ fontSize: "16px", color: c.earth500, margin: 0 }}>
          Manage promotional coupons and gift card balances
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          borderBottom: `2px solid ${c.subtle}`,
          marginBottom: "24px",
        }}
      >
        {(["coupons", "gift-cards"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onChangeTab?.(tab)}
            style={{
              padding: "12px 0",
              border: "none",
              background: "transparent",
              fontSize: "16px",
              fontWeight: 600,
              fontFamily: fonts.body,
              color: activeTab === tab ? c.primary500 : c.earth500,
              borderBottom:
                activeTab === tab
                  ? `3px solid ${c.primary500}`
                  : "3px solid transparent",
              marginBottom: "-2px",
              cursor: "pointer",
            }}
          >
            {tab === "coupons" ? "Coupons" : "Gift Cards"}
          </button>
        ))}
      </div>

      {/* ===== Coupons Tab ===== */}
      {activeTab === "coupons" && (
        <>
          {/* Controls */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                gap: "16px",
                alignItems: "center",
                marginBottom: "16px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ position: "relative", flex: 1, minWidth: "200px", maxWidth: "400px" }}>
                <Search
                  size={18}
                  color={c.earth400}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearch?.(e.target.value)}
                  placeholder="Search coupons by code…"
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 40px",
                    border: `1px solid ${c.subtle}`,
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontFamily: fonts.body,
                    color: c.earth700,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <button
                onClick={() => onCreateCoupon?.()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "6px",
                  background: c.gradient,
                  color: c.card,
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <Plus size={18} />
                Create Coupon
              </button>
            </div>

            {/* Status filter pills */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {(["all", "active", "expired", "disabled"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeCouponStatus?.(s)}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    background:
                      couponStatusFilter === s ? c.primary500 : c.card,
                    color: couponStatusFilter === s ? c.card : c.earth600,
                    boxShadow:
                      couponStatusFilter !== s
                        ? `0 0 0 1px ${c.earth300}`
                        : "none",
                  }}
                >
                  {s === "all"
                    ? "All"
                    : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Coupons Table */}
          <div
            style={{
              background: c.card,
              borderRadius: "8px",
              boxShadow: c.shadow,
              borderTop: "3px solid transparent",
              borderImage: `${c.gradient} 1`,
              overflow: "hidden",
            }}
          >
            {filteredCoupons.length === 0 ? (
              <div style={{ padding: "64px 48px", textAlign: "center" }}>
                <Tag
                  size={48}
                  color={c.earth300}
                  style={{ margin: "0 auto 16px" }}
                />
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: c.earth700,
                    marginBottom: "8px",
                  }}
                >
                  {searchQuery || couponStatusFilter !== "all"
                    ? "No coupons match the current filter"
                    : "No coupons yet"}
                </p>
                <p style={{ fontSize: "14px", color: c.earth400, margin: 0 }}>
                  {!searchQuery && couponStatusFilter === "all"
                    ? "Create your first discount coupon to attract customers."
                    : "Try adjusting your search or filter."}
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "900px",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${c.subtle}` }}>
                      <th style={thStyle}>Code</th>
                      <th style={thStyle}>Discount</th>
                      <th style={thStyle}>Min Order</th>
                      <th style={thStyle}>Max Cap</th>
                      <th style={thStyle}>Valid Period</th>
                      <th style={thStyle}>Usage</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCoupons.map((coupon) => (
                      <CouponRowComp
                        key={coupon.id}
                        coupon={coupon}
                        onEdit={(id) => onEditCoupon?.(id)}
                        onRequestDelete={(id) => setConfirmDeleteId(id)}
                        onToggle={async (id) => {
                          await onToggleCoupon?.(id)
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== Gift Cards Tab ===== */}
      {activeTab === "gift-cards" && (
        <>
          <div
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
              marginBottom: "24px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: "200px", maxWidth: "400px" }}>
              <Search
                size={18}
                color={c.earth400}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearch?.(e.target.value)}
                placeholder="Search gift cards by code…"
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 40px",
                  border: `1px solid ${c.subtle}`,
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontFamily: fonts.body,
                  color: c.earth700,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <button
              onClick={() => setShowCreateGiftCardModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                border: "none",
                borderRadius: "6px",
                background: c.gradient,
                color: c.card,
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <Plus size={18} />
              Create Gift Card
            </button>
          </div>

          {/* Gift Cards Table */}
          <div
            style={{
              background: c.card,
              borderRadius: "8px",
              boxShadow: c.shadow,
              borderTop: "3px solid transparent",
              borderImage: `${c.gradient} 1`,
              overflow: "hidden",
            }}
          >
            {filteredGiftCards.length === 0 ? (
              <div style={{ padding: "64px 48px", textAlign: "center" }}>
                <CreditCard
                  size={48}
                  color={c.earth300}
                  style={{ margin: "0 auto 16px" }}
                />
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: c.earth700,
                    marginBottom: "8px",
                  }}
                >
                  {searchQuery
                    ? "No gift cards match your search"
                    : "No gift cards issued yet"}
                </p>
                <p style={{ fontSize: "14px", color: c.earth400, margin: 0 }}>
                  {!searchQuery ? "Create one to get started." : "Try adjusting your search."}
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "800px",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${c.subtle}` }}>
                      <th style={thStyle}>Code</th>
                      <th style={thStyle}>Initial Balance</th>
                      <th style={thStyle}>Current Balance</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Expires</th>
                      <th style={thStyle}>Created</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGiftCards.map((gc) => (
                      <GiftCardRowComp
                        key={gc.id}
                        giftCard={gc}
                        onView={(id) => onViewGiftCard?.(id)}
                        onToggle={async (id) => {
                          await onToggleGiftCard?.(id)
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Gift Card Modal */}
      {showCreateGiftCardModal && onCreateGiftCard && (
        <CreateGiftCardModal
          onClose={() => setShowCreateGiftCardModal(false)}
          onCreate={onCreateGiftCard}
        />
      )}

      {/* Confirm Delete Dialog */}
      {confirmDeleteId && (
        <ConfirmDeleteDialog
          onConfirm={async () => {
            const id = confirmDeleteId
            setConfirmDeleteId(null)
            await onDeleteCoupon?.(id)
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  )
}
