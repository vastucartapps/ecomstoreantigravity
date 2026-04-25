import { MedusaService } from "@medusajs/framework/utils"
import Booking from "./models/booking"
import BlockedDate from "./models/blocked-date"
import SlotConfig from "./models/slot-config"
import BookingServiceType from "./models/booking-service-type"

/** Generate a URL-safe slug from a title string */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

const DEFAULT_SLOT_CONFIG = {
  enabledDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
  startTime: "10:00",
  endTime: "18:00",
  slotDuration: 45,
  bufferMinutes: 15,
  maxBookingsPerDay: 8,
}

class BookingsModuleService extends MedusaService({ Booking, BlockedDate, SlotConfig, BookingServiceType }) {

  // ---------------------------------------------------------------------------
  // Customer booking operations
  // ---------------------------------------------------------------------------

  async listByCustomer(customerId: string): Promise<any[]> {
    const [bookings] = await this.listAndCountBookings(
      { customer_id: customerId },
      { order: { created_at: "DESC" }, take: 50 }
    )
    return bookings
  }

  async createBookingForCustomer(customerId: string, data: {
    title: string
    consultant_name?: string
    date: string
    time: string
    notes?: string
    price?: number
    currency?: string
    service_type_id?: string
  }): Promise<any> {
    const payload: any = {
      customer_id: customerId,
      title: data.title,
      consultant_name: data.consultant_name || "",
      date: data.date,
      time: data.time,
      status: "pending",
      notes: data.notes || "",
      price: data.price || 0,
      currency: data.currency || "INR",
    }
    if (data.service_type_id) payload.service_type_id = data.service_type_id
    return this.createBookings(payload)
  }

  async updateBookingStatus(id: string, status: "pending" | "confirmed" | "completed" | "cancelled", meetingLink?: string): Promise<any> {
    const updateData: any = { id, status }
    if (meetingLink !== undefined) updateData.meeting_link = meetingLink
    return this.updateBookings(updateData)
  }

  async updateBookingFields(id: string, fields: { notes?: string; meeting_link?: string; status?: string }): Promise<any> {
    // Strip undefined values — Medusa's generated updateBookings rejects
    // payloads where partial fields are explicitly undefined. Only carry
    // through the keys the caller actually set.
    const updateData: Record<string, unknown> = { id }
    if (fields.status !== undefined) updateData.status = fields.status
    if (fields.meeting_link !== undefined) updateData.meeting_link = fields.meeting_link
    if (fields.notes !== undefined) updateData.notes = fields.notes
    return this.updateBookings(updateData as any)
  }

  // ---------------------------------------------------------------------------
  // Slot Config (singleton)
  // ---------------------------------------------------------------------------

  async getSlotConfig(): Promise<any> {
    const [configs] = await this.listAndCountSlotConfigs({}, { take: 1 })
    if (configs.length === 0) {
      return this.createSlotConfigs({ config: DEFAULT_SLOT_CONFIG })
    }
    return configs[0]
  }

  async saveSlotConfig(configData: any): Promise<any> {
    const existing = await this.getSlotConfig()
    return this.updateSlotConfigs({ id: existing.id, config: configData })
  }

  // ---------------------------------------------------------------------------
  // Blocked Dates
  // ---------------------------------------------------------------------------

  async listBlockedDatesAll(): Promise<any[]> {
    const [dates] = await this.listAndCountBlockedDates({}, { order: { date: "ASC" } })
    return dates
  }

  async addBlockedDate(date: string, reason: string): Promise<any> {
    return this.createBlockedDates({ date, reason })
  }

  async removeBlockedDate(id: string): Promise<void> {
    await this.deleteBlockedDates(id)
  }

  // ---------------------------------------------------------------------------
  // Service Types (admin-managed consultation packages)
  // ---------------------------------------------------------------------------

  async listServiceTypes(): Promise<any[]> {
    const [types] = await this.listAndCountBookingServiceTypes(
      {},
      { order: { display_order: "ASC" } }
    )
    return types
  }

  async listActiveServiceTypes(): Promise<any[]> {
    const [types] = await this.listAndCountBookingServiceTypes(
      { is_active: true },
      { order: { display_order: "ASC" } }
    )
    return types
  }

  /** Fetch a single active service type by its slug (for SEO detail pages) */
  async getServiceTypeBySlug(slug: string): Promise<any | null> {
    const [types] = await this.listAndCountBookingServiceTypes(
      { slug, is_active: true },
      { take: 1 }
    )
    return types[0] ?? null
  }

  /** Generate a unique slug — appends -2, -3 on collision */
  private async generateUniqueSlug(base: string, excludeId?: string): Promise<string> {
    let candidate = slugify(base)
    let suffix = 1
    while (true) {
      const [existing] = await this.listAndCountBookingServiceTypes(
        { slug: candidate },
        { take: 1 }
      )
      const collision = existing.filter((r: any) => r.id !== excludeId)
      if (collision.length === 0) return candidate
      suffix++
      candidate = `${slugify(base)}-${suffix}`
    }
  }

  async createServiceType(data: {
    title: string
    description?: string
    duration_minutes?: number
    price?: number
    currency?: string
    is_active?: boolean
    display_order?: number
    image_1?: string
    image_2?: string
    image_3?: string
    what_is_included?: string
    outcomes?: string
    mode?: string
    badge_text?: string
    slug?: string
  }): Promise<any> {
    const slug = data.slug?.trim()
      ? await this.generateUniqueSlug(data.slug.trim())
      : await this.generateUniqueSlug(data.title)

    return this.createBookingServiceTypes({
      title: data.title,
      description: data.description || "",
      duration_minutes: data.duration_minutes ?? 45,
      price: data.price ?? 0,
      currency: data.currency || "INR",
      is_active: data.is_active ?? true,
      display_order: data.display_order ?? 0,
      image_1: data.image_1 || "",
      image_2: data.image_2 || "",
      image_3: data.image_3 || "",
      what_is_included: data.what_is_included || "",
      outcomes: data.outcomes || "",
      mode: data.mode || "online",
      badge_text: data.badge_text || "",
      slug,
    })
  }

  async updateServiceType(id: string, data: Partial<{
    title: string
    description: string
    duration_minutes: number
    price: number
    currency: string
    is_active: boolean
    display_order: number
    image_1: string
    image_2: string
    image_3: string
    what_is_included: string
    outcomes: string
    mode: string
    badge_text: string
    slug: string
  }>): Promise<any> {
    if (data.slug !== undefined) {
      data.slug = await this.generateUniqueSlug(data.slug, id)
    }
    return this.updateBookingServiceTypes({ id, ...data } as any)
  }

  async deleteServiceType(id: string): Promise<void> {
    await this.deleteBookingServiceTypes(id)
  }

  // ---------------------------------------------------------------------------
  // Analytics / Stats
  // ---------------------------------------------------------------------------

  async getBookingStats(): Promise<{
    total: number
    pending: number
    confirmed: number
    completed: number
    cancelled: number
    totalRevenue: number
    todayCount: number
    thisWeekCount: number
    byServiceType: { title: string; count: number; revenue: number }[]
  }> {
    const [bookings] = await this.listAndCountBookings(
      {},
      { take: 1000, order: { created_at: "DESC" } }
    )

    const today = new Date().toISOString().split("T")[0]
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString().split("T")[0]

    let pending = 0, confirmed = 0, completed = 0, cancelled = 0
    let totalRevenue = 0, todayCount = 0, thisWeekCount = 0
    const byTitle: Record<string, { count: number; revenue: number }> = {}

    for (const b of bookings) {
      const status = b.status || "pending"
      if (status === "pending") pending++
      else if (status === "confirmed") confirmed++
      else if (status === "completed") completed++
      else if (status === "cancelled") cancelled++

      if (status === "confirmed" || status === "completed") {
        totalRevenue += b.price || 0
      }

      if (b.date === today) todayCount++
      if (b.date && b.date >= weekAgoStr) thisWeekCount++

      const title = b.title || "General Booking"
      if (!byTitle[title]) byTitle[title] = { count: 0, revenue: 0 }
      byTitle[title].count++
      if (status === "confirmed" || status === "completed") {
        byTitle[title].revenue += b.price || 0
      }
    }

    const byServiceType = Object.entries(byTitle)
      .map(([title, data]) => ({ title, ...data }))
      .sort((a, b) => b.count - a.count)

    return {
      total: bookings.length,
      pending,
      confirmed,
      completed,
      cancelled,
      totalRevenue,
      todayCount,
      thisWeekCount,
      byServiceType,
    }
  }
}

export default BookingsModuleService
