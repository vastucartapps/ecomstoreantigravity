import { adminFetch } from "@/lib/medusa"
import type {
  LoyaltyConfig,
  LoyaltyTier,
  PointsConfig,
  PointsAdjustment,
  LoyaltyStats,
  AdjustmentType,
} from "@/types/admin-loyalty"

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_TIERS: LoyaltyTier[] = [
  {
    id: "tier-1",
    name: "Bronze",
    minPoints: 0,
    multiplier: 1,
    benefits: ["Earn 1x points on all purchases", "Birthday bonus 50 points"],
    color: "#CD7F32",
  },
  {
    id: "tier-2",
    name: "Silver",
    minPoints: 500,
    multiplier: 1.5,
    benefits: [
      "Earn 1.5x points",
      "Free shipping on orders above ₹499",
      "Birthday bonus 100 points",
    ],
    color: "#C0C0C0",
  },
  {
    id: "tier-3",
    name: "Gold",
    minPoints: 2000,
    multiplier: 2,
    benefits: [
      "Earn 2x points",
      "Free shipping on all orders",
      "Early access to sales",
      "Birthday bonus 200 points",
    ],
    color: "#FFD700",
  },
  {
    id: "tier-4",
    name: "Platinum",
    minPoints: 5000,
    multiplier: 3,
    benefits: [
      "Earn 3x points",
      "Free express shipping",
      "Early access to new products",
      "Dedicated support",
      "Birthday bonus 500 points",
    ],
    color: "#E5E4E2",
  },
]

const DEFAULT_POINTS_CONFIG: PointsConfig = {
  pointsPerRupee: 1,
  pointsPerDollar: 10,
  minRedemptionPoints: 100,
  pointsExpiryDays: 30,
  pointsValueINR: 0.25,
  pointsValueUSD: 0.01,
}

const DEFAULT_CONFIG: LoyaltyConfig = {
  programEnabled: false,
  config: DEFAULT_POINTS_CONFIG,
  tiers: DEFAULT_TIERS,
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdminLoyalty() {
  // ── Config CRUD ──────────────────────────────────────────────────────────

  async function fetchConfig(): Promise<LoyaltyConfig> {
    const data = await adminFetch(
      "/admin/loyalty/config",
      { method: "GET" }
    )
    const saved = data?.config as LoyaltyConfig | null
    if (!saved) return { ...DEFAULT_CONFIG }

    // Merge tiers: saved overrides defaults, new defaults always present
    const savedTierMap = new Map(
      (saved.tiers || []).map((t) => [t.id, t])
    )
    const mergedTiers = DEFAULT_TIERS.map((def) =>
      savedTierMap.has(def.id) ? (savedTierMap.get(def.id) as LoyaltyTier) : def
    )
    // Also include any custom tiers not in defaults
    for (const t of saved.tiers || []) {
      if (!DEFAULT_TIERS.some((d) => d.id === t.id)) {
        mergedTiers.push(t)
      }
    }

    return {
      programEnabled: saved.programEnabled ?? false,
      config: { ...DEFAULT_POINTS_CONFIG, ...(saved.config || {}) },
      tiers: mergedTiers,
    }
  }

  async function saveConfig(config: LoyaltyConfig): Promise<void> {
    await adminFetch("/admin/loyalty/config", {
      method: "POST",
      body: config,
    })
  }

  async function toggleProgram(
    enabled: boolean,
    currentConfig: LoyaltyConfig
  ): Promise<LoyaltyConfig> {
    const updated = { ...currentConfig, programEnabled: enabled }
    await saveConfig(updated)
    return updated
  }

  async function savePointsConfig(
    pointsConfig: PointsConfig,
    currentConfig: LoyaltyConfig
  ): Promise<LoyaltyConfig> {
    const updated = { ...currentConfig, config: pointsConfig }
    await saveConfig(updated)
    return updated
  }

  async function saveTier(
    tier: LoyaltyTier,
    currentConfig: LoyaltyConfig
  ): Promise<LoyaltyConfig> {
    const exists = currentConfig.tiers.some((t) => t.id === tier.id)
    const updatedTiers = exists
      ? currentConfig.tiers.map((t) => (t.id === tier.id ? tier : t))
      : [...currentConfig.tiers, tier]
    const updated = { ...currentConfig, tiers: updatedTiers }
    await saveConfig(updated)
    return updated
  }

  // ── Stats ────────────────────────────────────────────────────────────────

  async function fetchStats(): Promise<LoyaltyStats> {
    const data = await adminFetch(
      "/admin/loyalty/stats",
      { method: "GET" }
    )
    return {
      totalPointsIssued: data?.totalPointsIssued ?? 0,
      totalPointsRedeemed: data?.totalPointsRedeemed ?? 0,
      totalPointsExpired: data?.totalPointsExpired ?? 0,
      activeMembers: data?.activeMembers ?? 0,
    }
  }

  // ── Adjustments ──────────────────────────────────────────────────────────

  async function fetchRecentAdjustments(): Promise<PointsAdjustment[]> {
    const data = await adminFetch(
      "/admin/loyalty/adjustments",
      { method: "GET" }
    )
    const adjustments = data?.adjustments || []
    return adjustments.map((tx: any) => {
      // Parse customer info from description
      const desc = tx.description || ""
      const forMatch = desc.match(/for (.+)\)$/)
      const byMatch = desc.match(/by (.+?) for/)
      return {
        id: tx.id,
        customerName: forMatch?.[1] || "",
        customerEmail: "",
        type: tx.points >= 0 ? ("credit" as AdjustmentType) : ("debit" as AdjustmentType),
        points: Math.abs(tx.points),
        reason: desc.replace(/^Manual (credit|debit): /, "").replace(/ \(by .+\)$/, ""),
        adjustedBy: byMatch?.[1] || "Admin",
        date: tx.created_at,
      }
    })
  }

  // ── Customer lookup ──────────────────────────────────────────────────────

  async function lookupCustomer(
    email: string
  ): Promise<{ id: string; name: string; email: string } | null> {
    const data = await adminFetch(
      `/admin/customers?q=${encodeURIComponent(email)}&limit=5`,
      { method: "GET" }
    )
    const customers = data?.customers || []
    // Find exact email match
    const match = customers.find(
      (c: any) => c.email?.toLowerCase() === email.toLowerCase()
    )
    if (!match) return null
    return {
      id: match.id,
      name: [match.first_name, match.last_name].filter(Boolean).join(" ") || match.email,
      email: match.email,
    }
  }

  async function submitAdjustment(data: {
    customerEmail: string
    type: AdjustmentType
    points: number
    reason: string
  }): Promise<void> {
    // Validate customer
    const customer = await lookupCustomer(data.customerEmail)
    if (!customer) {
      throw new Error("Customer not found. Please verify the email address.")
    }

    await adminFetch("/admin/loyalty/adjustments", {
      method: "POST",
      body: {
        customer_id: customer.id,
        customer_name: customer.name,
        customer_email: customer.email,
        type: data.type,
        points: data.points,
        reason: data.reason,
      },
    })
  }

  return {
    fetchConfig,
    toggleProgram,
    savePointsConfig,
    saveTier,
    fetchStats,
    fetchRecentAdjustments,
    lookupCustomer,
    submitAdjustment,
  }
}
