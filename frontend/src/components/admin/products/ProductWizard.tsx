"use client"

import { useState, useRef, useEffect } from "react"
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Upload,
  GripVertical,
} from "lucide-react"
import type { ProductDetail, CategoryOption, ProductWizardProps } from "@/types/admin-product"
import { normalizeImageUrl } from "@/lib/image-url"

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

type WizardStep = "basic" | "variants" | "images" | "rich-content" | "specs" | "faqs" | "seo" | "merchant"

const STEPS: Array<{ id: WizardStep; label: string; number: number }> = [
  { id: "basic", label: "Basic Info", number: 1 },
  { id: "variants", label: "Variants", number: 2 },
  { id: "images", label: "Images", number: 3 },
  { id: "rich-content", label: "Content", number: 4 },
  { id: "specs", label: "Specs", number: 5 },
  { id: "faqs", label: "FAQs", number: 6 },
  { id: "seo", label: "SEO", number: 7 },
  { id: "merchant", label: "Merchant", number: 8 },
]

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  help,
  maxLength,
  rows,
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  required?: boolean
  help?: string
  maxLength?: number
  rows?: number
}) {
  const isTextarea = rows !== undefined
  const charCount = maxLength ? String(value).length : 0

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1" style={{ color: c.earth700, fontFamily: fonts.body }}>
        {label}
        {required && <span style={{ color: c.error }}> *</span>}
      </label>
      {isTextarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all"
          style={{ borderColor: c.earth300, fontFamily: fonts.body, resize: "vertical" }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all"
          style={{ borderColor: c.earth300, fontFamily: fonts.body }}
        />
      )}
      {help && (
        <p className="text-xs mt-1" style={{ color: c.earth400, fontFamily: fonts.body }}>{help}</p>
      )}
      {maxLength && (
        <p className="text-xs mt-1 text-right" style={{ color: c.earth400, fontFamily: fonts.body }}>
          {charCount}/{maxLength}
        </p>
      )}
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  required?: boolean
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1" style={{ color: c.earth700, fontFamily: fonts.body }}>
        {label}
        {required && <span style={{ color: c.error }}> *</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all"
        style={{ borderColor: c.earth300, fontFamily: fonts.body }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

export function ProductWizard({
  product,
  categories,
  currentStep,
  isEditing,
  onStepChange,
  onSaveDraft,
  onPublish,
  onCancel,
  onBack,
  onUploadFile,
}: ProductWizardProps) {
  const [formData, setFormData] = useState<Partial<ProductDetail>>(
    product || {
      name: "",
      sku: "",
      description: "",
      shortDescription: "",
      categoryId: "",
      category: "",
      price: 0,
      mrp: 0,
      currency: "INR",
      status: "draft",
      tags: [],
      hsnCode: "",
      gstRate: 0,
      variants: [],
      images: [],
      richContent: [],
      specs: [],
      faqs: [],
      seo: { metaTitle: "", metaDescription: "", urlSlug: "", canonicalUrl: "" },
      merchantCentre: { gtin: "", mpn: "", brand: "", condition: "new", ageGroup: "", gender: "", googleCategory: "" },
    }
  )

  // Sync formData when product prop loads (edit/duplicate mode)
  useEffect(() => {
    if (product) {
      setFormData(product)
    }
  }, [product])

  const [previewCollapsed, setPreviewCollapsed] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set())
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingRcImage, setUploadingRcImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const rcFileInputRef = useRef<HTMLInputElement>(null)
  const rcUploadTargetIdx = useRef<number>(-1)

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)
  const currentStepData = STEPS[currentStepIndex]

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const updateNestedField = (parent: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...(prev[parent as keyof typeof prev] as any), [field]: value },
    }))
  }

  const handleNext = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    if (currentStepIndex < STEPS.length - 1) {
      onStepChange?.(STEPS[currentStepIndex + 1].id)
    }
  }

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      onStepChange?.(STEPS[currentStepIndex - 1].id)
    }
  }

  const handleStepClick = (step: WizardStep) => {
    const stepIndex = STEPS.findIndex((s) => s.id === step)
    if (stepIndex <= currentStepIndex || completedSteps.has(step)) {
      onStepChange?.(step)
    }
  }

  const handleImageFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || !onUploadFile) return
    setUploadingImage(true)
    try {
      for (const file of Array.from(files)) {
        const rawUrl = await onUploadFile(file)
        const url = normalizeImageUrl(rawUrl) || rawUrl
        if (url) {
          updateField("images", [
            ...(formData.images || []),
            {
              id: `img-${Date.now()}-${Math.random()}`,
              url,
              alt: file.name.replace(/\.[^/.]+$/, ""),
              isPrimary: (formData.images?.length || 0) === 0,
              sortOrder: (formData.images?.length || 0) + 1,
            },
          ])
        }
      }
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRcImageUpload = async (files: FileList | null, blockIdx: number) => {
    const file = files?.[0]
    if (!file || !onUploadFile) return
    const blockId = formData.richContent?.[blockIdx]?.id || ""
    setUploadingRcImage(blockId)
    try {
      const rawUrl = await onUploadFile(file)
      const url = normalizeImageUrl(rawUrl) || rawUrl
      if (url) {
        const updated = [...(formData.richContent || [])]
        updated[blockIdx] = { ...updated[blockIdx], imageUrl: url }
        updateField("richContent", updated)
      }
    } finally {
      setUploadingRcImage(null)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case "basic":
        return (
          <div>
            <InputField
              label="Product Name"
              value={formData.name || ""}
              onChange={(v) => updateField("name", v)}
              placeholder="Enter product name"
              required
            />
            <InputField
              label="Short Description"
              value={formData.shortDescription || ""}
              onChange={(v) => updateField("shortDescription", v)}
              placeholder="Brief one-line description"
              maxLength={120}
              help="Shown in product listings and cards"
            />
            <InputField
              label="Full Description"
              value={formData.description || ""}
              onChange={(v) => updateField("description", v)}
              placeholder="Detailed product description"
              rows={6}
            />
            <SelectField
              label="Category"
              value={formData.categoryId || ""}
              onChange={(v) => {
                const cat = categories.find((c) => c.id === v)
                updateField("categoryId", v)
                updateField("category", cat?.name || "")
              }}
              options={[
                { value: "", label: "Select a category" },
                ...categories.map((c) => ({ value: c.id, label: c.parentName ? `${c.parentName} > ${c.name}` : c.name })),
              ]}
              required
            />
            <InputField
              label="Tags"
              value={formData.tags?.join(", ") || ""}
              onChange={(v) => updateField("tags", v.split(",").map((t) => t.trim()).filter(Boolean))}
              placeholder="e.g., organic, handmade, eco-friendly"
              help="Comma-separated keywords for search and filtering"
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="HSN Code"
                value={formData.hsnCode || ""}
                onChange={(v) => updateField("hsnCode", v)}
                placeholder="e.g., 8306"
                help="For GST compliance"
              />
              <InputField
                label="GST Rate (%)"
                value={formData.gstRate || ""}
                onChange={(v) => updateField("gstRate", parseFloat(v) || 0)}
                type="number"
                placeholder="e.g., 12"
              />
            </div>
            <SelectField
              label="Status"
              value={formData.status || "draft"}
              onChange={(v) => updateField("status", v)}
              options={[
                { value: "draft", label: "Draft — not visible to customers" },
                { value: "active", label: "Active — visible in storefront" },
                { value: "inactive", label: "Inactive — hidden from storefront" },
              ]}
            />
          </div>
        )

      case "variants":
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: c.earth700, fontFamily: fonts.heading }}>
                Product Variants
              </h3>
              <button
                onClick={() =>
                  updateField("variants", [
                    ...(formData.variants || []),
                    { id: `var-${Date.now()}`, label: "", sku: "", price: 0, mrp: 0, priceUSD: 0, mrpUSD: 0, stock: 0, currency: "INR", stockLevel: "in_stock" },
                  ])
                }
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: c.gradient, color: c.card, fontFamily: fonts.body }}
              >
                <Plus size={16} />
                Add Variant
              </button>
            </div>

            {formData.variants && formData.variants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${c.earth300}` }}>
                      {["Label", "SKU", "Price ₹", "MRP ₹", "Price $", "MRP $", "Stock", ""].map((h) => (
                        <th key={h} className="text-left py-2 px-2 font-semibold text-xs" style={{ color: c.earth700, fontFamily: fonts.body }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.variants.map((variant, idx) => (
                      <tr key={variant.id} style={{ borderBottom: `1px solid ${c.subtle}` }}>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={variant.label}
                            onChange={(e) => {
                              const updated = [...(formData.variants || [])]
                              updated[idx] = { ...updated[idx], label: e.target.value }
                              updateField("variants", updated)
                            }}
                            className="w-full px-2 py-1 border rounded text-sm"
                            style={{ borderColor: c.earth300, fontFamily: fonts.body, minWidth: "90px" }}
                            placeholder="e.g., 500ml"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={variant.sku}
                            onChange={(e) => {
                              const updated = [...(formData.variants || [])]
                              updated[idx] = { ...updated[idx], sku: e.target.value }
                              updateField("variants", updated)
                            }}
                            className="w-full px-2 py-1 border rounded text-sm"
                            style={{ borderColor: c.earth300, fontFamily: fonts.mono, minWidth: "80px" }}
                            placeholder="SKU-001"
                          />
                        </td>
                        {/* Price INR */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={variant.price || ""}
                            onChange={(e) => {
                              const updated = [...(formData.variants || [])]
                              updated[idx] = { ...updated[idx], price: parseFloat(e.target.value) || 0 }
                              updateField("variants", updated)
                            }}
                            className="w-full px-2 py-1 border rounded text-sm"
                            style={{ borderColor: c.earth300, fontFamily: fonts.body, minWidth: "70px" }}
                            min={0}
                          />
                        </td>
                        {/* MRP INR */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={variant.mrp || ""}
                            onChange={(e) => {
                              const updated = [...(formData.variants || [])]
                              updated[idx] = { ...updated[idx], mrp: parseFloat(e.target.value) || 0 }
                              updateField("variants", updated)
                            }}
                            className="w-full px-2 py-1 border rounded text-sm"
                            style={{ borderColor: c.earth300, fontFamily: fonts.body, minWidth: "70px" }}
                            min={0}
                          />
                        </td>
                        {/* Price USD */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={(variant as any).priceUSD || ""}
                            onChange={(e) => {
                              const updated = [...(formData.variants || [])]
                              updated[idx] = { ...updated[idx], priceUSD: parseFloat(e.target.value) || 0 }
                              updateField("variants", updated)
                            }}
                            className="w-full px-2 py-1 border rounded text-sm"
                            style={{ borderColor: c.earth300, fontFamily: fonts.body, minWidth: "70px" }}
                            min={0}
                            placeholder="0.00"
                          />
                        </td>
                        {/* MRP USD */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={(variant as any).mrpUSD || ""}
                            onChange={(e) => {
                              const updated = [...(formData.variants || [])]
                              updated[idx] = { ...updated[idx], mrpUSD: parseFloat(e.target.value) || 0 }
                              updateField("variants", updated)
                            }}
                            className="w-full px-2 py-1 border rounded text-sm"
                            style={{ borderColor: c.earth300, fontFamily: fonts.body, minWidth: "70px" }}
                            min={0}
                            placeholder="0.00"
                          />
                        </td>
                        {/* Stock */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={variant.stock || ""}
                            onChange={(e) => {
                              const updated = [...(formData.variants || [])]
                              updated[idx] = { ...updated[idx], stock: parseInt(e.target.value) || 0 }
                              updateField("variants", updated)
                            }}
                            className="w-full px-2 py-1 border rounded text-sm"
                            style={{ borderColor: c.earth300, fontFamily: fonts.body, minWidth: "60px" }}
                            min={0}
                          />
                        </td>
                        <td className="py-2 px-2">
                          <button
                            onClick={() => {
                              const updated = formData.variants?.filter((_, i) => i !== idx)
                              updateField("variants", updated)
                            }}
                            className="p-1 rounded transition-all hover:bg-red-50"
                            style={{ color: c.error }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: c.earth400, fontFamily: fonts.body }}>
                <p>No variants added. Add a variant to define different options (size, color, etc.)</p>
                <p className="text-sm mt-2">Or skip this step for single-variant products.</p>
              </div>
            )}

            {(!formData.variants || formData.variants.length === 0) && (
              <div className="mt-6 p-4 rounded-lg" style={{ background: c.primary50 }}>
                <h4 className="font-semibold mb-2" style={{ color: c.primary500, fontFamily: fonts.heading }}>
                  Single Product Pricing
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Price (₹)"
                    value={formData.price || ""}
                    onChange={(v) => updateField("price", parseFloat(v) || 0)}
                    type="number"
                    placeholder="e.g., 499"
                  />
                  <InputField
                    label="MRP (₹)"
                    value={formData.mrp || ""}
                    onChange={(v) => updateField("mrp", parseFloat(v) || 0)}
                    type="number"
                    placeholder="e.g., 599"
                  />
                </div>
              </div>
            )}
          </div>
        )

      case "images":
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: c.earth700, fontFamily: fonts.heading }}>
                Product Images
              </h3>
            </div>

            {/* Upload Zone */}
            <div
              className="border-2 border-dashed rounded-lg p-8 mb-6 text-center cursor-pointer transition-all hover:bg-opacity-90"
              style={{ borderColor: c.primary400, background: c.primary50 }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={(e) => handleImageFileSelect(e.target.files)}
              />
              {uploadingImage ? (
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-full border-2 border-current animate-spin"
                    style={{ borderColor: c.primary400, borderTopColor: "transparent" }}
                  />
                  <p className="text-sm" style={{ color: c.primary500, fontFamily: fonts.body }}>Uploading...</p>
                </div>
              ) : (
                <>
                  <Upload size={32} className="mx-auto mb-2" style={{ color: c.primary400 }} />
                  <p className="font-medium mb-1" style={{ color: c.primary500, fontFamily: fonts.body }}>
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm" style={{ color: c.earth400, fontFamily: fonts.body }}>
                    PNG, JPG, WebP — up to 5MB each
                  </p>
                </>
              )}
            </div>

            {formData.images && formData.images.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative border rounded-lg overflow-hidden" style={{ borderColor: c.earth300 }}>
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      {img.url ? (
                        <img src={normalizeImageUrl(img.url) || img.url} alt={img.alt} className="w-full h-full object-cover" />
                      ) : (
                        <span style={{ color: c.earth400 }}>No Image</span>
                      )}
                    </div>
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: c.primary500, color: c.card, fontFamily: fonts.mono }}>
                        {idx + 1}
                      </span>
                      {img.isPrimary && (
                        <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: c.secondary500, color: c.card }}>
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      <button
                        className="p-1 rounded shadow"
                        style={{ background: c.card, color: c.error }}
                        onClick={() => updateField("images", formData.images?.filter((_, i) => i !== idx))}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="p-2" style={{ background: c.card }}>
                      <input
                        type="text"
                        value={img.alt}
                        onChange={(e) => {
                          const updated = [...(formData.images || [])]
                          updated[idx] = { ...updated[idx], alt: e.target.value }
                          updateField("images", updated)
                        }}
                        placeholder="Alt text"
                        className="w-full px-2 py-1 text-xs border rounded"
                        style={{ borderColor: c.earth300, fontFamily: fonts.body }}
                      />
                      <label className="flex items-center gap-2 mt-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={img.isPrimary}
                          onChange={(e) => {
                            const updated = (formData.images || []).map((image, i) => ({
                              ...image,
                              isPrimary: i === idx ? e.target.checked : false,
                            }))
                            updateField("images", updated)
                          }}
                          style={{ accentColor: c.primary500 }}
                        />
                        <span style={{ color: c.earth600, fontFamily: fonts.body }}>Set as primary</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: c.earth400, fontFamily: fonts.body }}>
                <p>No images uploaded yet. Upload at least one product image.</p>
              </div>
            )}
          </div>
        )

      case "rich-content":
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: c.earth700, fontFamily: fonts.heading }}>
                Rich Content (A+ Content)
              </h3>
              <button
                onClick={() =>
                  updateField("richContent", [
                    ...(formData.richContent || []),
                    { id: `rc-${Date.now()}`, type: "text", title: "", content: "", imageUrl: "" },
                  ])
                }
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ background: c.gradient, color: c.card, fontFamily: fonts.body }}
              >
                <Plus size={16} />
                Add Block
              </button>
            </div>

            {formData.richContent && formData.richContent.length > 0 ? (
              <div className="space-y-4">
                {formData.richContent.map((block, idx) => (
                  <div key={block.id} className="p-4 border rounded-lg" style={{ borderColor: c.earth300, background: c.card }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <GripVertical size={16} style={{ color: c.earth400 }} />
                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: c.subtle, color: c.earth700, fontFamily: fonts.mono }}>
                          Block {idx + 1}
                        </span>
                      </div>
                      <button
                        onClick={() => updateField("richContent", formData.richContent?.filter((_, i) => i !== idx))}
                        className="p-1 rounded hover:bg-red-50 transition-all"
                        style={{ color: c.error }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <SelectField
                      label="Block Type"
                      value={block.type}
                      onChange={(v) => {
                        const updated = [...(formData.richContent || [])]
                        updated[idx] = { ...updated[idx], type: v as any }
                        updateField("richContent", updated)
                      }}
                      options={[
                        { value: "text", label: "Text Only" },
                        { value: "image", label: "Image Only" },
                        { value: "image_text", label: "Image + Text" },
                        { value: "comparison", label: "Comparison Table" },
                        { value: "banner", label: "Banner" },
                      ]}
                    />

                    <InputField
                      label="Title"
                      value={block.title}
                      onChange={(v) => {
                        const updated = [...(formData.richContent || [])]
                        updated[idx] = { ...updated[idx], title: v }
                        updateField("richContent", updated)
                      }}
                      placeholder="Block title"
                    />

                    {(block.type === "text" || block.type === "image_text" || block.type === "comparison") && (
                      <InputField
                        label="Content"
                        value={block.content}
                        onChange={(v) => {
                          const updated = [...(formData.richContent || [])]
                          updated[idx] = { ...updated[idx], content: v }
                          updateField("richContent", updated)
                        }}
                        placeholder="Block content or markdown"
                        rows={4}
                      />
                    )}

                    {(block.type === "image" || block.type === "image_text" || block.type === "banner") && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium mb-1.5" style={{ color: c.earth600, fontFamily: fonts.body }}>
                          Block Image
                        </label>
                        {block.imageUrl ? (
                          <div className="relative inline-block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={block.imageUrl}
                              alt={block.title || "Block image"}
                              className="w-full max-w-sm aspect-video object-cover rounded-lg border"
                              style={{ borderColor: c.earth300 }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...(formData.richContent || [])]
                                updated[idx] = { ...updated[idx], imageUrl: "" }
                                updateField("richContent", updated)
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full shadow"
                              style={{ background: c.card, color: c.error }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <div
                            className="flex flex-col items-center justify-center w-full max-w-sm aspect-video rounded-lg cursor-pointer transition-colors"
                            style={{
                              border: `2px dashed ${c.primary200}`,
                              backgroundColor: uploadingRcImage === block.id ? c.primary100 : c.primary50,
                            }}
                            onClick={() => {
                              rcUploadTargetIdx.current = idx
                              rcFileInputRef.current?.click()
                            }}
                          >
                            {uploadingRcImage === block.id ? (
                              <div className="flex flex-col items-center gap-2">
                                <div
                                  className="h-6 w-6 rounded-full border-2 animate-spin"
                                  style={{ borderColor: c.primary400, borderTopColor: "transparent" }}
                                />
                                <p className="text-xs" style={{ color: c.primary500, fontFamily: fonts.body }}>Uploading...</p>
                              </div>
                            ) : (
                              <>
                                <Upload size={24} style={{ color: c.primary400 }} className="mb-1" />
                                <p className="text-xs font-medium" style={{ color: c.primary500, fontFamily: fonts.body }}>
                                  Click to upload image
                                </p>
                                <p className="text-[10px] mt-0.5" style={{ color: c.earth400, fontFamily: fonts.body }}>
                                  PNG, JPG, WebP — up to 5MB
                                </p>
                              </>
                            )}
                          </div>
                        )}
                        <input
                          type="text"
                          value={block.imageUrl || ""}
                          onChange={(v) => {
                            const updated = [...(formData.richContent || [])]
                            updated[idx] = { ...updated[idx], imageUrl: v.target.value }
                            updateField("richContent", updated)
                          }}
                          placeholder="Or paste image URL here"
                          className="w-full max-w-sm mt-2 px-3 py-1.5 text-xs border rounded-lg"
                          style={{ borderColor: c.earth300, fontFamily: fonts.body, color: c.earth700 }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: c.earth400, fontFamily: fonts.body }}>
                <p>No rich content blocks added. Add blocks to enhance your product page.</p>
              </div>
            )}
          </div>
        )

      case "specs":
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: c.earth700, fontFamily: fonts.heading }}>Product Specifications</h3>
              <button
                onClick={() =>
                  updateField("specs", [
                    ...(formData.specs || []),
                    { id: `spec-${Date.now()}`, group: "General", label: "", value: "" },
                  ])
                }
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ background: c.gradient, color: c.card, fontFamily: fonts.body }}
              >
                <Plus size={16} />
                Add Spec
              </button>
            </div>

            {formData.specs && formData.specs.length > 0 ? (
              <div className="space-y-2">
                {(formData.specs || []).map((spec, globalIdx) => (
                  <div
                    key={spec.id}
                    className="flex items-center gap-3 p-2 rounded"
                    style={{ background: c.card, border: `1px solid ${c.earth300}` }}
                  >
                    <input
                      type="text"
                      value={spec.group}
                      onChange={(e) => {
                        const updated = [...(formData.specs || [])]
                        updated[globalIdx] = { ...updated[globalIdx], group: e.target.value }
                        updateField("specs", updated)
                      }}
                      placeholder="Group"
                      className="w-1/4 px-2 py-1 border rounded text-sm"
                      style={{ borderColor: c.earth300, fontFamily: fonts.body }}
                    />
                    <input
                      type="text"
                      value={spec.label}
                      onChange={(e) => {
                        const updated = [...(formData.specs || [])]
                        updated[globalIdx] = { ...updated[globalIdx], label: e.target.value }
                        updateField("specs", updated)
                      }}
                      placeholder="Label (e.g., Weight)"
                      className="flex-1 px-2 py-1 border rounded text-sm"
                      style={{ borderColor: c.earth300, fontFamily: fonts.body }}
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => {
                        const updated = [...(formData.specs || [])]
                        updated[globalIdx] = { ...updated[globalIdx], value: e.target.value }
                        updateField("specs", updated)
                      }}
                      placeholder="Value (e.g., 500g)"
                      className="flex-1 px-2 py-1 border rounded text-sm"
                      style={{ borderColor: c.earth300, fontFamily: fonts.body }}
                    />
                    <button
                      onClick={() => updateField("specs", formData.specs?.filter((s) => s.id !== spec.id))}
                      className="p-1 rounded hover:bg-red-50 transition-all"
                      style={{ color: c.error }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: c.earth400, fontFamily: fonts.body }}>
                <p>No specifications added. Add technical specs for your product.</p>
              </div>
            )}
          </div>
        )

      case "faqs":
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: c.earth700, fontFamily: fonts.heading }}>Frequently Asked Questions</h3>
              <button
                onClick={() =>
                  updateField("faqs", [
                    ...(formData.faqs || []),
                    { id: `faq-${Date.now()}`, question: "", answer: "" },
                  ])
                }
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ background: c.gradient, color: c.card, fontFamily: fonts.body }}
              >
                <Plus size={16} />
                Add FAQ
              </button>
            </div>

            {formData.faqs && formData.faqs.length > 0 ? (
              <div className="space-y-4">
                {formData.faqs.map((faq, idx) => (
                  <div key={faq.id} className="p-4 border rounded-lg" style={{ borderColor: c.earth300, background: c.card }}>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: c.subtle, color: c.earth700, fontFamily: fonts.mono }}>
                        FAQ {idx + 1}
                      </span>
                      <button
                        onClick={() => updateField("faqs", formData.faqs?.filter((_, i) => i !== idx))}
                        className="p-1 rounded hover:bg-red-50 transition-all"
                        style={{ color: c.error }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <InputField
                      label="Question"
                      value={faq.question}
                      onChange={(v) => {
                        const updated = [...(formData.faqs || [])]
                        updated[idx] = { ...updated[idx], question: v }
                        updateField("faqs", updated)
                      }}
                      placeholder="What customers commonly ask..."
                    />
                    <InputField
                      label="Answer"
                      value={faq.answer}
                      onChange={(v) => {
                        const updated = [...(formData.faqs || [])]
                        updated[idx] = { ...updated[idx], answer: v }
                        updateField("faqs", updated)
                      }}
                      placeholder="Clear, helpful answer..."
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: c.earth400, fontFamily: fonts.body }}>
                <p>No FAQs added. Add common questions to help customers.</p>
              </div>
            )}
          </div>
        )

      case "seo":
        return (
          <div>
            <h3 className="font-semibold mb-4" style={{ color: c.earth700, fontFamily: fonts.heading }}>SEO Settings</h3>

            <InputField
              label="Meta Title"
              value={formData.seo?.metaTitle || ""}
              onChange={(v) => updateNestedField("seo", "metaTitle", v)}
              placeholder={formData.name || "Product name"}
              maxLength={60}
              help="Shown in search engine results (recommended: 50–60 characters)"
            />
            <InputField
              label="Meta Description"
              value={formData.seo?.metaDescription || ""}
              onChange={(v) => updateNestedField("seo", "metaDescription", v)}
              placeholder="Brief description for search engines"
              rows={3}
              maxLength={160}
              help="Shown in search engine results (recommended: 150–160 characters)"
            />
            <InputField
              label="URL Slug"
              value={formData.seo?.urlSlug || ""}
              onChange={(v) => updateNestedField("seo", "urlSlug", v)}
              placeholder="product-name"
              help={`Preview: /products/${formData.seo?.urlSlug || "product-name"}`}
            />
            <InputField
              label="Canonical URL"
              value={formData.seo?.canonicalUrl || ""}
              onChange={(v) => updateNestedField("seo", "canonicalUrl", v)}
              placeholder="https://store.vastucart.in/products/..."
              help="Optional: Specify the preferred URL if this product has duplicates"
            />
          </div>
        )

      case "merchant":
        return (
          <div>
            <h3 className="font-semibold mb-1" style={{ color: c.earth700, fontFamily: fonts.heading }}>Google Merchant Centre</h3>
            <p className="text-xs mb-4" style={{ color: c.earth400, fontFamily: fonts.body }}>
              These fields help Google Shopping show your products to the right buyers. Only GTIN or MPN is required — fill what applies.
            </p>

            <InputField
              label="GTIN (Barcode)"
              value={formData.merchantCentre?.gtin || ""}
              onChange={(v) => updateNestedField("merchantCentre", "gtin", v)}
              placeholder="e.g., 00012345600012"
              help="Leave blank if your product has no barcode. Google will use MPN + Brand instead."
            />
            <InputField
              label="MPN (Manufacturer Part Number)"
              value={formData.merchantCentre?.mpn || ""}
              onChange={(v) => updateNestedField("merchantCentre", "mpn", v)}
              placeholder="e.g., VC-IDOL-GAN-M"
              help="Your internal SKU or model number. Use if no GTIN."
            />
            <InputField
              label="Brand"
              value={formData.merchantCentre?.brand || ""}
              onChange={(v) => updateNestedField("merchantCentre", "brand", v)}
              placeholder="e.g., VastuCart"
              help="Your brand name. Required when GTIN or MPN is provided."
            />
            <SelectField
              label="Condition"
              value={formData.merchantCentre?.condition || "new"}
              onChange={(v) => updateNestedField("merchantCentre", "condition", v)}
              options={[
                { value: "new", label: "New" },
                { value: "refurbished", label: "Refurbished" },
                { value: "used", label: "Used" },
              ]}
            />
            <SelectField
              label="Age Group"
              value={formData.merchantCentre?.ageGroup || "adult"}
              onChange={(v) => updateNestedField("merchantCentre", "ageGroup", v)}
              options={[
                { value: "adult", label: "Adult (18+)" },
                { value: "all ages", label: "All Ages" },
                { value: "teen", label: "Teen (13–17)" },
                { value: "kids", label: "Kids (5–12)" },
                { value: "toddler", label: "Toddler (1–5)" },
                { value: "infant", label: "Infant (0–12 months)" },
                { value: "newborn", label: "Newborn (0–3 months)" },
              ]}
            />
            <SelectField
              label="Gender"
              value={formData.merchantCentre?.gender || "unisex"}
              onChange={(v) => updateNestedField("merchantCentre", "gender", v)}
              options={[
                { value: "unisex", label: "Unisex" },
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ]}
            />

            {/* Google Product Category — searchable with VastuCart presets */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: c.earth700, fontFamily: fonts.body }}>
                Google Product Category
              </label>
              <input
                type="text"
                value={formData.merchantCentre?.googleCategory || ""}
                onChange={(e) => updateNestedField("merchantCentre", "googleCategory", e.target.value)}
                placeholder="Click a category below or type a custom path"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{ borderColor: c.earth300, fontFamily: fonts.body }}
              />
              <p className="text-xs mt-1 mb-2" style={{ color: c.earth400, fontFamily: fonts.body }}>
                Select the most relevant category for your product — this determines which Google Shopping searches it appears in.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  { value: "Religious & Ceremonial > Religious Items", hint: "Idols, yantras, puja items, spiritual artifacts" },
                  { value: "Religious & Ceremonial > Religious Items > Prayer Beads", hint: "Rudraksha malas, crystal malas, prayer beads" },
                  { value: "Home & Garden > Decor > Decorative Accents > Figurines & Sculptures", hint: "Decorative idols, figurines, statues" },
                  { value: "Home & Garden > Decor > Wall Décor", hint: "Wall yantras, copper plates, wall hangings" },
                  { value: "Home & Garden > Decor > Candles & Home Fragrance", hint: "Incense sticks, dhoop, agarbatti, aromatherapy" },
                  { value: "Health & Beauty > Health Care > Alternative & Natural Medicine", hint: "Healing crystals, energy stones, reiki items" },
                  { value: "Jewelry > Gemstone Jewelry", hint: "Crystal/gemstone pendants, bracelets, necklaces" },
                  { value: "Jewelry > Beaded Jewelry", hint: "Bead jewelry, mala necklaces, gemstone malas" },
                  { value: "Arts & Entertainment > Hobby & Collectible Items", hint: "Collectible spiritual items, rare artifacts" },
                  { value: "Media > Books", hint: "Vastu guides, spiritual books, astrology" },
                ].map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => updateNestedField("merchantCentre", "googleCategory", cat.value)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "8px 12px",
                      background: formData.merchantCentre?.googleCategory === cat.value ? c.primary50 : "#f9f6f1",
                      border: `1px solid ${formData.merchantCentre?.googleCategory === cat.value ? c.primary400 : "#e8ddd4"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      transition: "all 150ms",
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: 600, color: c.primary500, fontFamily: fonts.body, flexShrink: 0, marginTop: "1px" }}>
                      {formData.merchantCentre?.googleCategory === cat.value ? "✓ " : ""}
                    </span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", fontSize: "12px", fontWeight: 600, color: c.earth700, fontFamily: fonts.body }}>{cat.value}</span>
                      <span style={{ display: "block", fontSize: "11px", color: c.earth400, fontFamily: fonts.body }}>{cat.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderPreview = () => {
    const primaryImage = formData.images?.find((img) => img.isPrimary)?.url || formData.images?.[0]?.url
    const displayPrice = formData.variants?.[0]?.price || formData.price || 0
    const displayMrp = formData.variants?.[0]?.mrp || formData.mrp || 0
    const discount = displayMrp > displayPrice ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : 0

    return (
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: c.earth300, background: c.card, boxShadow: c.shadow }}>
        {primaryImage ? (
          <div className="aspect-square bg-gray-100">
            <img src={primaryImage} alt={formData.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-square flex items-center justify-center" style={{ background: c.subtle }}>
            <span style={{ color: c.earth400, fontFamily: fonts.body, fontSize: "0.875rem" }}>No Image Yet</span>
          </div>
        )}

        <div className="p-4">
          <h4 className="font-semibold text-lg mb-2" style={{ color: c.earth700, fontFamily: fonts.heading }}>
            {formData.name || "Product Name"}
          </h4>
          <p className="text-sm mb-3" style={{ color: c.earth500, fontFamily: fonts.body }}>
            {formData.shortDescription || "Short description will appear here"}
          </p>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl font-bold" style={{ color: c.primary500, fontFamily: fonts.heading }}>
              ₹{displayPrice.toLocaleString("en-IN")}
            </span>
            {displayMrp > displayPrice && (
              <>
                <span className="text-sm line-through" style={{ color: c.earth400 }}>₹{displayMrp.toLocaleString("en-IN")}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: c.successLight, color: c.success }}>
                  {discount}% OFF
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} style={{ color: c.warning }}>★</span>
            ))}
            <span className="text-sm ml-1" style={{ color: c.earth400, fontFamily: fonts.body }}>(New)</span>
          </div>

          {formData.status === "active" && (
            <span className="inline-block text-xs font-semibold px-2 py-1 rounded" style={{ background: c.successLight, color: c.success }}>In Stock</span>
          )}
          {formData.status === "draft" && (
            <span className="inline-block text-xs font-semibold px-2 py-1 rounded" style={{ background: c.warningLight, color: c.warning }}>Draft</span>
          )}
          {formData.status === "inactive" && (
            <span className="inline-block text-xs font-semibold px-2 py-1 rounded" style={{ background: c.errorLight, color: c.error }}>Inactive</span>
          )}
        </div>

        {/* Step-specific preview info */}
        <div className="px-4 pb-4 border-t pt-3" style={{ borderColor: c.earth300 }}>
          <p className="text-xs font-semibold mb-2" style={{ color: c.earth500, fontFamily: fonts.heading }}>Current Step Data</p>

          {currentStep === "variants" && formData.variants && formData.variants.length > 0 && (
            <div className="space-y-1">
              {formData.variants.map((v) => (
                <div key={v.id} className="text-xs px-2 py-1 rounded" style={{ background: c.primary50, color: c.primary500 }}>
                  {v.label || "Variant"} — ₹{v.price}
                </div>
              ))}
            </div>
          )}

          {currentStep === "specs" && formData.specs && formData.specs.length > 0 && (
            <div className="space-y-1">
              {formData.specs.slice(0, 3).map((spec) => (
                <div key={spec.id} className="flex justify-between text-xs">
                  <span style={{ color: c.earth500 }}>{spec.label}:</span>
                  <span className="font-medium" style={{ color: c.earth700 }}>{spec.value}</span>
                </div>
              ))}
            </div>
          )}

          {currentStep === "faqs" && formData.faqs && formData.faqs.length > 0 && (
            <div className="space-y-2">
              {formData.faqs.slice(0, 2).map((faq) => (
                <div key={faq.id}>
                  <p className="text-xs font-medium" style={{ color: c.earth700 }}>Q: {faq.question}</p>
                  <p className="text-xs mt-0.5" style={{ color: c.earth500 }}>A: {faq.answer}</p>
                </div>
              ))}
            </div>
          )}

          {currentStep === "seo" && formData.seo?.urlSlug && (
            <p className="text-xs" style={{ color: c.earth500, fontFamily: fonts.mono }}>/products/{formData.seo.urlSlug}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: c.bg, fontFamily: fonts.body }} className="min-h-screen">
      {/* Hidden file input for rich content image uploads */}
      <input
        ref={rcFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          handleRcImageUpload(e.target.files, rcUploadTargetIdx.current)
          e.target.value = ""
        }}
      />
      {/* Header */}
      <div className="border-b sticky top-0 z-10" style={{ borderColor: c.earth300, background: c.card }}>
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-stone-100 rounded-lg transition-all"
                style={{ color: c.primary500 }}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold" style={{ color: c.earth700, fontFamily: fonts.heading }}>
                {isEditing ? `Edit: ${product?.name || "Product"}` : "Add Product"}
              </h1>
            </div>
          </div>

          {/* Step Indicator — Desktop */}
          <div className="hidden md:flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            {STEPS.map((step, idx) => {
              const isCompleted = completedSteps.has(step.id)
              const isCurrent = step.id === currentStep
              const isClickable = idx <= currentStepIndex || isCompleted

              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <button
                    onClick={() => isClickable && handleStepClick(step.id)}
                    disabled={!isClickable}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                    style={{
                      background: isCurrent ? c.primary50 : "transparent",
                      color: isCurrent ? c.primary500 : c.earth600,
                      cursor: isClickable ? "pointer" : "not-allowed",
                      opacity: isClickable ? 1 : 0.5,
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: isCompleted ? c.success : isCurrent ? c.primary500 : c.earth300,
                        color: isCompleted || isCurrent ? c.card : c.earth600,
                      }}
                    >
                      {isCompleted ? <Check size={14} /> : step.number}
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap">{step.label}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className="w-6 h-0.5 mx-1 flex-shrink-0" style={{ background: isCompleted ? c.success : c.earth300 }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Step Indicator — Mobile */}
          <div className="md:hidden mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: c.earth600 }}>
                Step {currentStepData.number} of {STEPS.length}
              </span>
              <span className="text-sm font-semibold" style={{ color: c.primary500 }}>
                {currentStepData.label}
              </span>
            </div>
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: c.earth300 }}>
              <div
                className="h-full transition-all duration-300"
                style={{ background: c.primary500, width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left — Form */}
          <div className="lg:col-span-3">
            <div
              className="rounded-lg overflow-hidden"
              style={{ background: c.card, boxShadow: c.shadow, borderTop: `4px solid transparent`, borderImage: c.gradient, borderImageSlice: 1 }}
            >
              <div className="p-6">{renderStepContent()}</div>
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between mt-6 gap-4">
              <div className="flex gap-3">
                {currentStepIndex > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="px-4 py-2 rounded-lg font-medium transition-all border"
                    style={{ borderColor: c.primary500, color: c.primary500, fontFamily: fonts.body }}
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg font-medium transition-all"
                  style={{ color: c.earth500, fontFamily: fonts.body }}
                >
                  Cancel
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => onSaveDraft?.(formData)}
                  className="px-4 py-2 rounded-lg font-medium transition-all border"
                  style={{ borderColor: c.earth400, color: c.earth600, fontFamily: fonts.body }}
                >
                  Save Draft
                </button>

                {currentStepIndex < STEPS.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 rounded-lg font-medium transition-all"
                    style={{ background: c.gradient, color: c.card, fontFamily: fonts.body }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => onPublish?.(formData)}
                    className="px-6 py-2 rounded-lg font-medium transition-all"
                    style={{ background: c.gradient, color: c.card, fontFamily: fonts.body }}
                  >
                    Publish Product
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right — Live Preview */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-32">
              <div className="rounded-lg overflow-hidden" style={{ background: c.card, boxShadow: c.shadow }}>
                <div
                  className="px-4 py-3 border-b flex items-center justify-between cursor-pointer lg:cursor-default"
                  style={{ borderColor: c.earth300 }}
                  onClick={() => setPreviewCollapsed(!previewCollapsed)}
                >
                  <h3 className="font-semibold" style={{ color: c.earth700, fontFamily: fonts.heading }}>Live Preview</h3>
                  <button className="lg:hidden">
                    {previewCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  </button>
                </div>
                <div className={`p-4 ${previewCollapsed ? "hidden lg:block" : ""}`}>
                  {renderPreview()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
