"use client"

import { useState } from "react"
import type { AdminReturnsRefundsProps } from "@/types/admin-return"
import { ReturnsKanban } from "./ReturnsKanban"
import { ReturnDetailPage } from "./ReturnDetailPage"

const c = {
  primary500: "#013f47",
  earth400: "#75615a",
}
const fonts = { body: "'Open Sans', sans-serif" }

export function AdminReturnsRefunds(props: AdminReturnsRefundsProps) {
  const [view, setView] = useState<"board" | "detail">("board")

  const handleViewReturn = (returnId: string) => {
    setView("detail")
    props.onViewReturn?.(returnId)
  }

  const handleBack = () => {
    setView("board")
    props.onBackToBoard?.()
  }

  // Loading state while detail is being fetched
  if (view === "detail" && props.isDetailLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div
            className="animate-spin h-10 w-10 border-2 border-t-transparent rounded-full mx-auto mb-3"
            style={{ borderColor: c.primary500, borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: c.earth400, fontFamily: fonts.body }}>
            Loading return…
          </p>
        </div>
      </div>
    )
  }

  if (view === "detail" && props.returnDetail) {
    return (
      <ReturnDetailPage
        returnRequest={props.returnDetail}
        onBack={handleBack}
        onApprove={props.onApprove}
        onReject={props.onReject}
        onProcessRefund={props.onProcessRefund}
        onInitiateExchange={props.onInitiateExchange}
      />
    )
  }

  return (
    <ReturnsKanban
      returns={props.returns}
      isLoading={props.isLoading}
      onViewReturn={handleViewReturn}
      onMoveReturn={props.onMoveReturn}
      onSearch={props.onSearch}
    />
  )
}
