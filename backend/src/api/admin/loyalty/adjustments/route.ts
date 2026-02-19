import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { LOYALTY_MODULE } from "../../../../modules/loyalty"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const loyaltyService = req.scope.resolve(LOYALTY_MODULE) as any
    const adjustments = await loyaltyService.getRecentAdjustments(10)
    res.json({ adjustments })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to fetch adjustments" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const {
      customer_id,
      customer_name,
      customer_email,
      type,
      points,
      reason,
    } = req.body as {
      customer_id: string
      customer_name: string
      customer_email: string
      type: "credit" | "debit"
      points: number
      reason: string
    }

    if (!customer_id || !points || !reason) {
      res.status(400).json({ message: "customer_id, points, and reason are required" })
      return
    }

    // Get admin author
    let adjustedBy = "Admin"
    try {
      const userService = req.scope.resolve("userModuleService") as any
      const authId = (req as any).auth_context?.actor_id
      if (authId) {
        const user = await userService.retrieveUser(authId)
        if (user) {
          adjustedBy = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "Admin"
        }
      }
    } catch {
      // Fallback to "Admin"
    }

    const loyaltyService = req.scope.resolve(LOYALTY_MODULE) as any
    const actualPoints = type === "debit" ? -Math.abs(points) : Math.abs(points)

    const desc = `Manual ${type}: ${reason} (by ${adjustedBy} for ${customer_name || customer_email})`

    const transaction = await loyaltyService.addPoints(
      customer_id,
      actualPoints,
      desc,
      "adjusted"
    )

    res.status(201).json({ adjustment: transaction })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to create adjustment" })
  }
}
