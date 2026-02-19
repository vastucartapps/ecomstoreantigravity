/** Adjustment type */
export type AdjustmentType = "credit" | "debit"

/** Loyalty tier definition */
export interface LoyaltyTier {
  id: string
  name: string
  minPoints: number
  multiplier: number
  benefits: string[]
  color: string
}

/** Points configuration */
export interface PointsConfig {
  pointsPerRupee: number
  pointsPerDollar: number
  minRedemptionPoints: number
  pointsExpiryDays: number
  pointsValueINR: number
  pointsValueUSD: number
}

/** Recent points adjustment record */
export interface PointsAdjustment {
  id: string
  customerName: string
  customerEmail: string
  type: AdjustmentType
  points: number
  reason: string
  adjustedBy: string
  date: string
}

/** Program statistics */
export interface LoyaltyStats {
  totalPointsIssued: number
  totalPointsRedeemed: number
  totalPointsExpired: number
  activeMembers: number
}

/** Full loyalty config stored in store.metadata.loyalty_config */
export interface LoyaltyConfig {
  programEnabled: boolean
  config: PointsConfig
  tiers: LoyaltyTier[]
}

/** Top-level props for AdminLoyalty component */
export interface AdminLoyaltyProps {
  programEnabled: boolean
  config: PointsConfig
  tiers: LoyaltyTier[]
  recentAdjustments: PointsAdjustment[]
  stats: LoyaltyStats
  isLoading?: boolean
  onToggleProgram: (enabled: boolean) => Promise<void> | void
  onSaveConfig: (config: PointsConfig) => Promise<void> | void
  onSaveTier: (tier: LoyaltyTier) => Promise<void> | void
  onSubmitAdjustment: (data: {
    customerEmail: string
    type: AdjustmentType
    points: number
    reason: string
  }) => Promise<void> | void
}
