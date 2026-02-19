"use client"

import { useState, useEffect, useCallback } from "react"
import type { AdminProductManagementProps, WizardStep, ProductDetail } from "@/types/admin-product"
import { ProductList } from "./ProductList"
import { ProductWizard } from "./ProductWizard"

type ViewMode = "list" | "wizard"

export function AdminProductManagement(props: AdminProductManagementProps) {
  const [view, setView] = useState<ViewMode>("list")
  const [wizardStep, setWizardStep] = useState<WizardStep>("basic")
  const [isEditing, setIsEditing] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  // When product data arrives while waiting (edit/duplicate), keep wizard open
  useEffect(() => {
    if (isDuplicating && props.editingProduct !== null) {
      setIsDuplicating(false)
    }
  }, [props.editingProduct, isDuplicating])

  const handleAddProduct = useCallback(() => {
    setIsEditing(false)
    setIsDuplicating(false)
    setWizardStep("basic")
    setView("wizard")
    props.onAddProduct?.()
  }, [props.onAddProduct])

  const handleEditProduct = useCallback(
    (productId: string) => {
      setIsEditing(true)
      setIsDuplicating(false)
      setWizardStep("basic")
      setView("wizard")
      props.onEditProduct?.(productId)
    },
    [props.onEditProduct]
  )

  const handleDuplicateProduct = useCallback(
    (productId: string) => {
      setIsEditing(false)
      setIsDuplicating(true)
      setWizardStep("basic")
      setView("wizard")
      props.onDuplicateProduct?.(productId)
    },
    [props.onDuplicateProduct]
  )

  const handleCancelWizard = useCallback(() => {
    setView("list")
    setIsEditing(false)
    setIsDuplicating(false)
    props.onCancelEdit?.()
  }, [props.onCancelEdit])

  // Wrap save/publish to return to list view after completion
  const wrappedSaveDraft = useCallback(
    async (data: Partial<ProductDetail>) => {
      await props.onSaveDraft?.(data)
      setView("list")
      setIsEditing(false)
      setIsDuplicating(false)
    },
    [props.onSaveDraft]
  )

  const wrappedPublish = useCallback(
    async (data: Partial<ProductDetail>) => {
      await props.onPublish?.(data)
      setView("list")
      setIsEditing(false)
      setIsDuplicating(false)
    },
    [props.onPublish]
  )

  if (view === "wizard") {
    // Show loading when in edit or duplicate mode and product hasn't loaded yet
    const isWaitingForProduct =
      (isEditing && !props.editingProduct) || (isDuplicating && !props.editingProduct)

    if (isWaitingForProduct) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div
              className="animate-spin h-10 w-10 border-2 border-t-transparent rounded-full mx-auto mb-3"
              style={{ borderColor: "#013f47", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "#75615a" }}>
              {isEditing ? "Loading product…" : "Loading for duplicate…"}
            </p>
          </div>
        </div>
      )
    }

    return (
      <ProductWizard
        key={props.editingProduct?.id || "new"}
        product={props.editingProduct}
        categories={props.categories}
        currentStep={wizardStep}
        isEditing={isEditing && !!props.editingProduct}
        onStepChange={setWizardStep}
        onSaveDraft={wrappedSaveDraft}
        onPublish={wrappedPublish}
        onCancel={handleCancelWizard}
        onBack={handleCancelWizard}
        onUploadFile={props.onUploadFile}
      />
    )
  }

  return (
    <ProductList
      products={props.products}
      categories={props.categories}
      filters={props.filters}
      viewMode={props.viewMode}
      totalCount={props.totalCount}
      isLoading={props.isLoading}
      onChangeViewMode={props.onChangeViewMode}
      onChangeFilters={props.onChangeFilters}
      onSearch={props.onSearch}
      onAddProduct={handleAddProduct}
      onEditProduct={handleEditProduct}
      onDuplicateProduct={handleDuplicateProduct}
      onDeleteProduct={props.onDeleteProduct}
      onBulkAction={props.onBulkAction}
      onImportCSV={props.onImportCSV}
      onExportCSV={props.onExportCSV}
    />
  )
}
