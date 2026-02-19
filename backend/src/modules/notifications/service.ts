import { MedusaService } from "@medusajs/framework/utils"
import Notification from "./models/notification"

class NotificationsModuleService extends MedusaService({ Notification }) {
  async createNotification(data: {
    customer_id: string
    type: "order" | "promotion" | "stock" | "loyalty"
    title: string
    message: string
    link?: string
  }): Promise<any> {
    return (this as any).createNotifications({
      customer_id: data.customer_id,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link || "",
      is_read: false,
    })
  }

  async listByCustomer(
    customerId: string,
    filters: { type?: string; limit?: number; offset?: number } = {}
  ): Promise<{ notifications: any[]; unread_count: number }> {
    const query: any = { customer_id: customerId }
    if (filters.type) query.type = filters.type

    const [notifications] = await (this as any).listAndCountNotifications(query, {
      order: { created_at: "DESC" },
      take: filters.limit || 20,
      skip: filters.offset || 0,
    })

    const [unread] = await (this as any).listAndCountNotifications(
      { customer_id: customerId, is_read: false },
      {}
    )

    return { notifications, unread_count: unread.length }
  }

  async getUnreadCount(customerId: string): Promise<number> {
    const [unread] = await (this as any).listAndCountNotifications(
      { customer_id: customerId, is_read: false },
      {}
    )
    return unread.length
  }

  async markAsRead(id: string, customerId: string): Promise<void> {
    const [existing] = await (this as any).listAndCountNotifications(
      { id, customer_id: customerId },
      {}
    )
    if (existing.length > 0) {
      await (this as any).updateNotifications({ id, is_read: true })
    }
  }

  async markAllAsRead(customerId: string): Promise<void> {
    const [unread] = await (this as any).listAndCountNotifications(
      { customer_id: customerId, is_read: false },
      {}
    )
    for (const n of unread) {
      await (this as any).updateNotifications({ id: n.id, is_read: true })
    }
  }
}

export default NotificationsModuleService
