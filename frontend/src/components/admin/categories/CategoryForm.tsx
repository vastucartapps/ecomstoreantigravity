"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Upload, X, ExternalLink } from "lucide-react"
import type { Category, CategoryFormProps, CategoryGoogleMerchant } from "@/types/admin-category"
import { normalizeImageUrl } from "@/lib/image-url"

const c = {
  primary500: "#013f47",
  primary400: "#2a7a72",
  primary200: "#71c1ae",
  primary100: "#c5e8e2",
  primary50: "#e8f5f3",
  secondary500: "#c85103",
  bg: "#fffbf5",
  card: "#ffffff",
  subtle: "#f5dfbb",
  earth300: "#a39585",
  earth400: "#75615a",
  earth500: "#71685b",
  earth600: "#5a4f47",
  earth700: "#433b35",
  warning: "#F59E0B",
  error: "#EF4444",
  shadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
  shadowHover: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)",
  gradient: "linear-gradient(90deg, #013f47, #2a7a72, #c85103)",
}

const fonts = {
  heading: "'Lora', serif",
  body: "'Open Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const EMPTY_MERCHANT: CategoryGoogleMerchant = {
  googleProductCategory: "",
  customLabel0: "",
  customLabel1: "",
  customLabel2: "",
  customLabel3: "",
  customLabel4: "",
}

interface FormState {
  name: string
  description: string
  parentId: string
  slug: string
  displayOrder: number
  status: "active" | "inactive"
  imageUrl: string
  metaTitle: string
  metaDescription: string
  googleMerchant: CategoryGoogleMerchant
}

export function CategoryForm({
  category,
  parentOptions,
  isEditing,
  onSave,
  onCancel,
  onImageUpload,
}: CategoryFormProps) {
  const [formData, setFormData] = useState<FormState>({
    name: "",
    description: "",
    parentId: "",
    slug: "",
    displayOrder: 0,
    status: "active",
    imageUrl: "",
    metaTitle: "",
    metaDescription: "",
    googleMerchant: { ...EMPTY_MERCHANT },
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [slugEdited, setSlugEdited] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Populate form when editing existing category
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        parentId: category.parentId || "",
        slug: category.slug,
        displayOrder: category.displayOrder,
        status: category.status,
        imageUrl: category.imageUrl || "",
        metaTitle: category.seo?.metaTitle || "",
        metaDescription: category.seo?.metaDescription || "",
        googleMerchant: category.googleMerchant
          ? { ...EMPTY_MERCHANT, ...category.googleMerchant }
          : { ...EMPTY_MERCHANT },
      })
      setImagePreview(normalizeImageUrl(category.imageUrl) || category.imageUrl || null)
      setSlugEdited(true) // Don't auto-generate slug for existing categories
    }
  }, [category])

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: slugEdited ? prev.slug : slugify(name),
    }))
  }

  const handleSlugChange = (slug: string) => {
    setSlugEdited(true)
    setFormData((prev) => ({ ...prev, slug }))
  }

  const handleImageFileSelect = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      if (onImageUpload) {
        const rawUrl = await onImageUpload(file)
        const url = normalizeImageUrl(rawUrl) || rawUrl
        setFormData((prev) => ({ ...prev, imageUrl: url }))
        setImagePreview(url)
      } else {
        // Fallback for development: local object URL
        const url = URL.createObjectURL(file)
        setFormData((prev) => ({ ...prev, imageUrl: url }))
        setImagePreview(url)
      }
    } catch (err) {
      console.error("Image upload failed:", err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: "" }))
    setImagePreview(null)
  }

  const updateMerchant = (field: keyof CategoryGoogleMerchant, value: string) => {
    setFormData((prev) => ({
      ...prev,
      googleMerchant: { ...prev.googleMerchant, [field]: value },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const saveData: Partial<Category> = {
        name: formData.name,
        description: formData.description,
        parentId: formData.parentId || null,
        slug: formData.slug,
        displayOrder: formData.displayOrder,
        status: formData.status,
        imageUrl: formData.imageUrl,
        seo: {
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
        },
        googleMerchant: formData.googleMerchant,
      }
      await onSave?.(saveData)
    } finally {
      setIsSaving(false)
    }
  }

  const inputStyle = {
    border: `1px solid ${c.primary200}`,
    backgroundColor: c.card,
    color: c.earth700,
    fontFamily: fonts.body,
    outline: "none",
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = c.primary500
  }
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = c.primary200
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 mb-4 text-sm font-medium transition-colors"
            style={{ color: c.primary500, fontFamily: fonts.body }}
            onMouseEnter={(e) => { e.currentTarget.style.color = c.primary400 }}
            onMouseLeave={(e) => { e.currentTarget.style.color = c.primary500 }}
          >
            <ArrowLeft size={16} />
            Back to Categories
          </button>
          <h1
            className="text-3xl font-semibold"
            style={{ color: c.earth700, fontFamily: fonts.heading }}
          >
            {isEditing ? `Edit: ${category?.name}` : "Add Category"}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Main Card */}
          <div
            className="rounded-lg overflow-hidden mb-6"
            style={{ backgroundColor: c.card, boxShadow: c.shadow }}
          >
            <div style={{ background: c.gradient, height: "4px" }} />
            <div className="p-6 space-y-6">

              {/* Image Upload */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: c.earth700, fontFamily: fonts.body }}
                >
                  Category Image
                </label>
                {imagePreview ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-w-md aspect-video object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-2 rounded-full transition-colors"
                      style={{ backgroundColor: c.card, color: c.error }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center w-full max-w-md aspect-video rounded-lg cursor-pointer transition-colors"
                    style={{
                      border: `2px dashed ${c.primary200}`,
                      backgroundColor: c.primary50,
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = c.primary400
                      e.currentTarget.style.backgroundColor = c.primary100
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = c.primary200
                      e.currentTarget.style.backgroundColor = c.primary50
                    }}
                  >
                    <Upload size={32} style={{ color: c.primary500 }} className="mb-2" />
                    <p
                      className="text-sm font-medium mb-1"
                      style={{ color: c.primary500, fontFamily: fonts.body }}
                    >
                      {isUploading ? "Uploading…" : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs" style={{ color: c.earth400, fontFamily: fonts.body }}>
                      PNG, JPG or WebP (max. 2 MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={(e) => handleImageFileSelect(e.target.files)}
                    />
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: c.earth700, fontFamily: fonts.body }}
                >
                  Category Name <span style={{ color: c.error }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  placeholder="e.g. Puja Essentials"
                  className="w-full px-4 py-2 rounded-lg transition-colors"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Description */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: c.earth700, fontFamily: fonts.body }}
                >
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={4}
                  placeholder="Describe this category…"
                  className="w-full px-4 py-2 rounded-lg transition-colors resize-none"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Parent Category */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: c.earth700, fontFamily: fonts.body }}
                >
                  Parent Category
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, parentId: e.target.value }))
                  }
                  className="w-full px-4 py-2 rounded-lg transition-colors"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                >
                  <option value="">None (Top Level)</option>
                  {parentOptions
                    .filter((opt) => opt.id !== category?.id) // prevent self-parenting
                    .map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {"— ".repeat(opt.depth)}
                        {opt.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* URL Slug */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: c.earth700, fontFamily: fonts.body }}
                >
                  URL Slug <span style={{ color: c.error }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  required
                  placeholder="puja-essentials"
                  className="w-full px-4 py-2 rounded-lg transition-colors"
                  style={{ ...inputStyle, fontFamily: fonts.mono }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <p className="text-xs mt-1" style={{ color: c.earth400, fontFamily: fonts.body }}>
                  Auto-generated from name. You can edit it manually.
                </p>
              </div>

              {/* Display Order & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: c.earth700, fontFamily: fonts.body }}
                  >
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        displayOrder: parseInt(e.target.value) || 0,
                      }))
                    }
                    min={0}
                    className="w-full px-4 py-2 rounded-lg transition-colors"
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: c.earth700, fontFamily: fonts.body }}
                  >
                    Status
                  </label>
                  <div className="flex items-center gap-3 h-10">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={formData.status === "active"}
                        onChange={() => setFormData((prev) => ({ ...prev, status: "active" }))}
                        className="w-4 h-4"
                        style={{ accentColor: c.primary500 }}
                      />
                      <span className="text-sm" style={{ color: c.earth700, fontFamily: fonts.body }}>
                        Active
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        checked={formData.status === "inactive"}
                        onChange={() => setFormData((prev) => ({ ...prev, status: "inactive" }))}
                        className="w-4 h-4"
                        style={{ accentColor: c.earth300 }}
                      />
                      <span className="text-sm" style={{ color: c.earth700, fontFamily: fonts.body }}>
                        Inactive
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* SEO Section */}
              <div
                className="p-4 rounded-lg space-y-4"
                style={{ backgroundColor: c.subtle, border: `1px solid ${c.primary100}` }}
              >
                <h3
                  className="text-lg font-semibold"
                  style={{ color: c.earth700, fontFamily: fonts.heading }}
                >
                  SEO Settings
                </h3>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      className="text-sm font-medium"
                      style={{ color: c.earth700, fontFamily: fonts.body }}
                    >
                      Meta Title
                    </label>
                    <span
                      className="text-xs"
                      style={{
                        color: formData.metaTitle.length > 60 ? c.warning : c.earth400,
                        fontFamily: fonts.mono,
                      }}
                    >
                      {formData.metaTitle.length}/60
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))
                    }
                    maxLength={60}
                    placeholder="Category meta title for search engines"
                    className="w-full px-4 py-2 rounded-lg transition-colors"
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      className="text-sm font-medium"
                      style={{ color: c.earth700, fontFamily: fonts.body }}
                    >
                      Meta Description
                    </label>
                    <span
                      className="text-xs"
                      style={{
                        color: formData.metaDescription.length > 160 ? c.warning : c.earth400,
                        fontFamily: fonts.mono,
                      }}
                    >
                      {formData.metaDescription.length}/160
                    </span>
                  </div>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))
                    }
                    maxLength={160}
                    rows={3}
                    placeholder="Brief description for search results (max 160 chars)"
                    className="w-full px-4 py-2 rounded-lg transition-colors resize-none"
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              </div>

              {/* Google Shopping Section */}
              <div
                className="p-4 rounded-lg space-y-4"
                style={{ backgroundColor: c.subtle, border: `1px solid ${c.primary100}` }}
              >
                <div className="flex items-center justify-between">
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: c.earth700, fontFamily: fonts.heading }}
                  >
                    Google Shopping
                  </h3>
                  <a
                    href="https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs transition-colors"
                    style={{ color: c.primary500, fontFamily: fonts.body }}
                  >
                    <ExternalLink size={12} />
                    Google Taxonomy
                  </a>
                </div>

                <p className="text-xs" style={{ color: c.earth400, fontFamily: fonts.body }}>
                  These fields are inherited by all products in this category when submitting to
                  Google Merchant Centre or generating product feeds.
                </p>

                {/* Google Product Category */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: c.earth700, fontFamily: fonts.body }}
                  >
                    Google Product Category
                  </label>
                  <input
                    type="text"
                    value={formData.googleMerchant.googleProductCategory}
                    onChange={(e) => updateMerchant("googleProductCategory", e.target.value)}
                    placeholder='e.g. "2271" or "Home & Garden > Décor > Seasonal & Holiday Decorations"'
                    className="w-full px-4 py-2 rounded-lg transition-colors"
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Custom Labels */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: c.earth700, fontFamily: fonts.body }}
                  >
                    Custom Labels (Google Ads Campaigns)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(["customLabel0", "customLabel1", "customLabel2", "customLabel3", "customLabel4"] as const).map(
                      (key, idx) => (
                        <div key={key}>
                          <label
                            className="block text-xs mb-1"
                            style={{ color: c.earth500, fontFamily: fonts.body }}
                          >
                            Custom Label {idx}
                          </label>
                          <input
                            type="text"
                            value={formData.googleMerchant[key]}
                            onChange={(e) => updateMerchant(key, e.target.value)}
                            placeholder={`Label ${idx} value`}
                            className="w-full px-3 py-2 rounded-lg text-sm transition-colors"
                            style={inputStyle}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="px-6 py-3 rounded-lg text-base font-medium transition-all disabled:opacity-60"
              style={{ backgroundColor: c.primary500, color: c.card, fontFamily: fonts.body }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.backgroundColor = c.primary400
                  e.currentTarget.style.boxShadow = c.shadowHover
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = c.primary500
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              {isSaving ? "Saving…" : "Save Category"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-lg text-base font-medium transition-colors"
              style={{ color: c.earth600, backgroundColor: "transparent", fontFamily: fonts.body }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.subtle }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
