import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { SUPPORT_TICKETS_MODULE } from "../../../../../modules/support-tickets"

// All three of these are env-driven so a new deploy never leaks production
// addresses. SUPPORT_EMAIL + STORE_URL are required in production by
// env-validation; the dev fallback only matters locally.
const ADMIN_EMAIL = process.env.SUPPORT_EMAIL || "support@vastucart.in"
const STORE_URL = process.env.STORE_URL || "http://localhost:3000"

/** GET /store/customers/me/support-tickets — list current customer's tickets */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Not authenticated" })

  const service = req.scope.resolve(SUPPORT_TICKETS_MODULE) as any
  const [tickets] = await service.listAndCountSupportTickets(
    { customer_id: customerId },
    { order: { created_at: "DESC" }, take: 50 }
  )
  res.json({ tickets })
}

/** POST /store/customers/me/support-tickets — create new ticket */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Not authenticated" })

  const { category, message, customer_email, customer_name } = req.body as any

  if (!category || !message?.trim()) {
    return res.status(400).json({ message: "category and message are required" })
  }

  const service = req.scope.resolve(SUPPORT_TICKETS_MODULE) as any

  const ticket = await service.createSupportTickets({
    customer_id: customerId,
    customer_email: customer_email || "",
    customer_name: customer_name || "Customer",
    category,
    message: message.trim(),
    status: "open",
  })

  // Notify admin via email (fail-open — never block ticket creation)
  try {
    const notifService = req.scope.resolve(Modules.NOTIFICATION) as any
    await notifService.createNotifications({
      to: ADMIN_EMAIL,
      channel: "email",
      template: "support-ticket-created",
      data: {
        ticket_id: ticket.id,
        customer_name: ticket.customer_name,
        customer_email: ticket.customer_email,
        category: ticket.category,
        message: ticket.message,
        created_at: new Date().toISOString().slice(0, 10),
        admin_url: `${STORE_URL}/admin/support`,
      },
    })
  } catch { /* notification failure must never fail ticket creation */ }

  res.status(201).json({ ticket })
}
