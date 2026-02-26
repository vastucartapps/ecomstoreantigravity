import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { SUPPORT_TICKETS_MODULE } from "../../../../../modules/support-tickets"

/**
 * POST /admin/support-tickets/:id/reply
 * Body: { reply: string, replied_by?: string }
 *
 * Saves the admin reply, marks the ticket closed, and emails the customer.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const { reply, replied_by = "VastuCart Support" } = req.body as any

    if (!reply?.trim()) {
      return res.status(400).json({ message: "reply is required" })
    }

    const service = req.scope.resolve(SUPPORT_TICKETS_MODULE) as any

    // Fetch ticket
    const [tickets] = await service.listAndCountSupportTickets({ id }, { take: 1 })
    const ticket = tickets[0]
    if (!ticket) return res.status(404).json({ message: "Ticket not found" })

    // Update ticket — reply + close
    const updated = await service.updateSupportTickets(
      { id },
      {
        admin_reply: reply.trim(),
        admin_reply_at: new Date(),
        admin_reply_by: replied_by,
        status: "closed",
      }
    )

    // Email customer (fail-open)
    try {
      if (ticket.customer_email) {
        const notifService = req.scope.resolve(Modules.NOTIFICATION) as any
        await notifService.createNotifications({
          to: ticket.customer_email,
          channel: "email",
          template: "support-ticket-reply",
          data: {
            customer_name: ticket.customer_name,
            category: ticket.category,
            original_message: ticket.message,
            admin_reply: reply.trim(),
            replied_by,
          },
        })
      }
    } catch { /* notification failure must never fail the reply */ }

    res.json({ ticket: Array.isArray(updated) ? updated[0] : updated })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to save reply" })
  }
}
