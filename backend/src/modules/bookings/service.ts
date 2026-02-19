import { MedusaService } from "@medusajs/framework/utils"
import Booking from "./models/booking"
import BlockedDate from "./models/blocked-date"
import SlotConfig from "./models/slot-config"

const DEFAULT_SLOT_CONFIG = {
  enabledDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
  startTime: "10:00",
  endTime: "18:00",
  slotDuration: 45,
  bufferMinutes: 15,
  maxBookingsPerDay: 8,
}

class BookingsModuleService extends MedusaService({ Booking, BlockedDate, SlotConfig }) {
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
  }): Promise<any> {
    return this.createBookings({
      customer_id: customerId,
      title: data.title,
      consultant_name: data.consultant_name || "",
      date: data.date,
      time: data.time,
      status: "pending",
      notes: data.notes || "",
      price: data.price || 0,
      currency: data.currency || "INR",
    })
  }

  async updateBookingStatus(id: string, status: "pending" | "confirmed" | "completed" | "cancelled", meetingLink?: string): Promise<any> {
    const updateData: any = { id, status }
    if (meetingLink !== undefined) updateData.meeting_link = meetingLink
    return this.updateBookings(updateData)
  }

  async updateBookingFields(id: string, fields: { notes?: string; meeting_link?: string; status?: string }): Promise<any> {
    return this.updateBookings({ id, ...fields } as any)
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
}

export default BookingsModuleService
