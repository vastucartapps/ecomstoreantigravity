/**
 * Typed service interfaces for custom Medusa v2 modules.
 *
 * Medusa v2's container.resolve() returns untyped results for custom modules.
 * These interfaces define the public API of each custom module service,
 * keeping the type boundary at the resolution point rather than scattering
 * `as any` casts throughout route handlers and subscribers.
 *
 * Usage:
 *   const loyaltyService = container.resolve(LOYALTY_MODULE) as ILoyaltyService
 */

// ─── Loyalty ──────────────────────────────────────────────────────────────────

export interface ILoyaltyService {
  getBalance(customerId: string): Promise<number>
  getTransactions(customerId: string): Promise<LoyaltyTransaction[]>
  addPoints(
    customerId: string,
    points: number,
    description: string,
    type?: "earned" | "redeemed" | "adjusted",
    options?: { expires_at?: Date; order_id?: string }
  ): Promise<LoyaltyTransaction>
  redeemPoints(
    customerId: string,
    points: number
  ): Promise<{ success: boolean; newBalance: number }>
  getStats(): Promise<{
    totalPointsIssued: number
    totalPointsRedeemed: number
    totalPointsExpired: number
    activeMembers: number
  }>
  getRecentAdjustments(limit?: number): Promise<LoyaltyTransaction[]>
  expirePoints(): Promise<number>
}

export interface LoyaltyTransaction {
  id: string
  customer_id: string
  points: number
  type: "earned" | "redeemed" | "adjusted" | "expired"
  description: string
  balance_after: number
  expires_at?: string | null
  is_expired?: boolean
  order_id?: string | null
  created_at: string
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export interface IBookingsService {
  createBookings(data: Record<string, unknown>): Promise<Record<string, unknown>>
  listBookings(
    filters?: Record<string, unknown>,
    config?: { order?: Record<string, string>; take?: number }
  ): Promise<Array<Record<string, unknown>>>
  updateBookings(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>
  retrieveBooking(id: string): Promise<Record<string, unknown>>
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface INotificationsService {
  createNotification(data: {
    customer_id: string
    type: "order" | "promotion" | "stock" | "loyalty"
    title: string
    message: string
    link?: string
  }): Promise<Record<string, unknown>>
  listByCustomer(
    customerId: string,
    filters?: { type?: string; limit?: number; offset?: number }
  ): Promise<{ notifications: Array<Record<string, unknown>>; unread_count: number }>
  getUnreadCount(customerId: string): Promise<number>
  markAsRead(id: string, customerId: string): Promise<void>
  markAllAsRead(customerId: string): Promise<void>
}

// ─── Ecosystem Ads ────────────────────────────────────────────────────────────

export interface IEcosystemAdsService {
  createEcosystemBanners(data: Record<string, unknown>): Promise<Record<string, unknown>>
  retrieveEcosystemBanner(id: string): Promise<Record<string, unknown>>
  listEcosystemBanners(
    filters?: Record<string, unknown>,
    config?: Record<string, unknown>
  ): Promise<Array<Record<string, unknown>>>
  updateEcosystemBanners(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>
  deleteEcosystemBanners(id: string): Promise<void>
  updateBannerStatuses(): Promise<number>
  createEcosystemSites(data: Record<string, unknown>): Promise<Record<string, unknown>>
  listEcosystemSites(
    filters?: Record<string, unknown>,
    config?: Record<string, unknown>
  ): Promise<Array<Record<string, unknown>>>
  updateEcosystemSites(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>
  deleteEcosystemSites(id: string): Promise<void>
  createEcosystemSlots(data: Record<string, unknown>): Promise<Record<string, unknown>>
  listEcosystemSlots(
    filters?: Record<string, unknown>,
    config?: Record<string, unknown>
  ): Promise<Array<Record<string, unknown>>>
  updateEcosystemSlots(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>
  deleteEcosystemSlots(id: string): Promise<void>
  createSocialPosts(data: Record<string, unknown>): Promise<Record<string, unknown> & { id: string }>
  listSocialPosts(
    filters?: Record<string, unknown>,
    config?: Record<string, unknown>
  ): Promise<Array<Record<string, unknown>>>
  updateSocialPosts(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>
  createBannerEvents(data: Record<string, unknown>): Promise<Record<string, unknown>>
  listBannerEvents(
    filters?: Record<string, unknown>,
    config?: Record<string, unknown>
  ): Promise<Array<Record<string, unknown>>>
}
