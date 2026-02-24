/**
 * VastuCart — International (USD) Region Setup
 *
 * Finds or creates the International (USD) region, then creates shipping
 * options and enables the Stripe payment provider for it.
 *
 * Usage (run inside the backend container):
 *   npx medusa exec src/scripts/seed-international.ts
 *
 * Safe to run multiple times — skips steps that are already complete.
 * Works in any environment (local dev, staging, production).
 */

import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  createRegionsWorkflow,
  createShippingOptionsWorkflow,
  updateRegionsWorkflow,
} from "@medusajs/medusa/core-flows"

// ─── Constants ────────────────────────────────────────────────────────────────

// Stripe payment provider ID = pp_{identifier}_{module-id}
// service.ts: static identifier = "stripe-db"
// medusa-config.ts: id: "stripe"
const STRIPE_PROVIDER_ID = "pp_stripe-db_stripe"

// Major international countries (excludes IN — handled by the India region)
const INTERNATIONAL_COUNTRIES = [
  "us", "gb", "ca", "au", "nz", "sg", "ae", "de", "fr", "nl",
  "se", "no", "dk", "fi", "ch", "at", "be", "pt", "es", "it", "gr",
  "pl", "cz", "sk", "hu", "ro", "bg", "hr", "rs", "jp", "kr", "my",
  "th", "ph", "id", "vn", "bd", "pk", "lk", "np", "za", "ke", "ng",
  "gh", "tz", "ug", "et", "mx", "br", "ar", "cl", "co", "pe", "ec",
  "sa", "kw", "qa", "bh", "om", "jo", "lb", "eg", "ma",
]

// ─── Script ───────────────────────────────────────────────────────────────────

export default async function seedInternational({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const regionModuleService = container.resolve(Modules.REGION)
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  logger.info("=== VastuCart: International (USD) region setup ===")

  // ── 1. Find or create the International (USD) region ──────────────────────
  logger.info("Looking up International (USD) region...")
  const allRegions = await regionModuleService.listRegions(
    {},
    { relations: ["payment_providers"] }
  )
  let intlRegion = allRegions.find(
    (r: any) => r.currency_code === "usd"
  )

  if (intlRegion) {
    logger.info(`Found existing region: "${intlRegion.name}" (${intlRegion.id})`)
  } else {
    logger.info("No USD region found — creating International region...")
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "International",
            currency_code: "usd",
            // No countries list — region is selected via the vc-region cookie at cart
            // creation time, not by Medusa's country geo-zone matching. Omitting this
            // avoids conflicts when dev seed data has already claimed some country codes.
            payment_providers: [STRIPE_PROVIDER_ID],
          },
        ],
      },
    })
    intlRegion = result[0]
    logger.info(`✓ Created region: "${intlRegion.name}" (${intlRegion.id})`)
    logger.info(`  Stripe provider already added at creation — skip step 2.`)
  }

  // ── 2. Add Stripe payment provider to the region (if not already present) ─
  const existingProviders: string[] = ((intlRegion as any).payment_providers || []).map(
    (p: any) => p.id || p
  )

  if (existingProviders.includes(STRIPE_PROVIDER_ID)) {
    logger.info(`${STRIPE_PROVIDER_ID} already enabled. Skipping.`)
  } else {
    logger.info(`Adding ${STRIPE_PROVIDER_ID} to International region...`)
    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: intlRegion.id },
        update: {
          payment_providers: [...existingProviders, STRIPE_PROVIDER_ID],
        },
      },
    })
    logger.info(`✓ ${STRIPE_PROVIDER_ID} added.`)
  }

  // ── 3. Get default shipping profile ───────────────────────────────────────
  logger.info("Looking up default shipping profile...")
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  })
  const shippingProfile = shippingProfiles?.[0]
  if (!shippingProfile) {
    logger.error("No default shipping profile found. Please run the base seed first.")
    return
  }
  logger.info(`Found shipping profile: "${shippingProfile.name}"`)

  // ── 4. Create or reuse Global fulfillment set ──────────────────────────────
  logger.info("Looking for existing Global International fulfillment set...")
  const existingFulfillmentSets = await fulfillmentModuleService.listFulfillmentSets(
    { name: "Global International Delivery" },
    { relations: ["service_zones"] }
  )

  let fulfillmentSet: any
  let serviceZoneId: string

  if (existingFulfillmentSets.length > 0) {
    fulfillmentSet = existingFulfillmentSets[0]
    serviceZoneId = fulfillmentSet.service_zones?.[0]?.id
    logger.info(`Reusing existing fulfillment set (service_zone: ${serviceZoneId})`)
  } else {
    logger.info("Creating Global International fulfillment set...")
    const uniqueCountries = [...new Set(INTERNATIONAL_COUNTRIES)]
    fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "Global International Delivery",
      type: "shipping",
      service_zones: [
        {
          name: "Worldwide (excl. India)",
          geo_zones: uniqueCountries.map((country_code) => ({
            country_code,
            type: "country" as const,
          })),
        },
      ],
    })
    serviceZoneId = fulfillmentSet.service_zones?.[0]?.id
    logger.info(`✓ Created fulfillment set (service_zone: ${serviceZoneId})`)
  }

  if (!serviceZoneId) {
    logger.error("Could not obtain a service zone ID. Aborting.")
    return
  }

  // ── 4.5. Link stock location → International fulfillment set ───────────────
  // Required so that manual_manual is recognised as an enabled provider for
  // this fulfillment set (same pattern as seed.ts for the EU set).
  logger.info("Linking stock location to International fulfillment set...")
  const stockLocations = await stockLocationService.listStockLocations({})
  const stockLocation = stockLocations?.[0]

  if (!stockLocation) {
    logger.error("No stock location found. Please run the base seed first.")
    return
  }

  try {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    })
    logger.info(`✓ Linked stock location "${stockLocation.name}" to International fulfillment set.`)
  } catch (e: any) {
    // Link may already exist (idempotent re-runs) — that's fine
    logger.info(`Stock location link already exists or skipped: ${e?.message}`)
  }

  // ── 5. Check for existing shipping options ─────────────────────────────────
  logger.info("Checking for existing shipping options in this zone...")
  const existingOptions = await fulfillmentModuleService.listShippingOptions({
    service_zone: { id: serviceZoneId },
  })
  const existingNames = existingOptions.map((o: any) => o.name)
  logger.info(`Existing: [${existingNames.join(", ") || "none"}]`)

  // ── 6. Create shipping options ─────────────────────────────────────────────
  const optionsToCreate: any[] = []

  if (!existingNames.includes("International Standard Shipping")) {
    optionsToCreate.push({
      name: "International Standard Shipping",
      price_type: "flat",
      provider_id: "manual_manual",
      service_zone_id: serviceZoneId,
      shipping_profile_id: shippingProfile.id,
      type: {
        label: "Standard",
        description: "Delivered in 7–14 business days via courier.",
        code: "standard-international",
      },
      prices: [
        { currency_code: "usd", amount: 15 },
        { region_id: intlRegion.id, amount: 15 },
      ],
      rules: [
        { attribute: "enabled_in_store", value: "true", operator: "eq" },
        { attribute: "is_return", value: "false", operator: "eq" },
      ],
    })
  }

  if (!existingNames.includes("International Express Shipping")) {
    optionsToCreate.push({
      name: "International Express Shipping",
      price_type: "flat",
      provider_id: "manual_manual",
      service_zone_id: serviceZoneId,
      shipping_profile_id: shippingProfile.id,
      type: {
        label: "Express",
        description: "Delivered in 3–5 business days via priority courier.",
        code: "express-international",
      },
      prices: [
        { currency_code: "usd", amount: 35 },
        { region_id: intlRegion.id, amount: 35 },
      ],
      rules: [
        { attribute: "enabled_in_store", value: "true", operator: "eq" },
        { attribute: "is_return", value: "false", operator: "eq" },
      ],
    })
  }

  if (optionsToCreate.length === 0) {
    logger.info("All shipping options already exist. Nothing to create.")
  } else {
    logger.info(`Creating: ${optionsToCreate.map((o) => o.name).join(", ")}`)
    await createShippingOptionsWorkflow(container).run({
      input: optionsToCreate,
    })
    logger.info("✓ Shipping options created.")
  }

  // ── 7. Summary ─────────────────────────────────────────────────────────────
  logger.info("")
  logger.info("=== Setup complete ===")
  logger.info(`Region:   "${intlRegion.name}" (${intlRegion.id})`)
  logger.info(`Stripe:    ${STRIPE_PROVIDER_ID} enabled`)
  logger.info(`Shipping:  Standard ($15) + Express ($35) — adjust in Admin → Shipping`)
}
