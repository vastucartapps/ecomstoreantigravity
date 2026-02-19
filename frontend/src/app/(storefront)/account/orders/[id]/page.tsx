"use client"
import { useParams } from "next/navigation"
import { OrderDetail } from "@/components/account/OrderDetail"

export default function OrderDetailPage() {
  const params = useParams()
  return <OrderDetail orderId={params?.id as string} />
}
