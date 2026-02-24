/**
 * VastuCart — International (USD) Region Setup
 *
 * Creates shipping options and enables the Stripe payment provider for the
 * International (USD) region.
 *
 * Usage (run inside the backend container after deploying):
 *   npx medusa exec src/scripts/seed-international.ts
 *
 * Safe to run multiple times — skips steps that are already complete.
 */

import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  createShippingOptionsWorkflow,
  updateRegionsWorkflow,
} from "@medusajs/medusa/core-flows"

// ─── Constants ────────────────────────────────────────────────────────────────

const INTERNATIONAL_REGION_ID = "reg_01KHTS4D79SRHK6SSJY1Q47R6P"

// Stripe payment provider ID = pp_{identifier}_{module-id}
// service.ts: static identifier = "stripe-db"
// medusa-config.ts: id: "stripe"
const STRIPE_PROVIDER_ID = "pp_stripe-db_stripe"

// Major international countries to cover (excludes IN — handled by India region)
// This list can be expanded — Medusa will route carts by region, not by this list
const INTERNATIONAL_COUNTRIES = [
  "us", "gb", "ca", "au", "nz", "sg", "ae", "us", "de", "fr", "nl",
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

  logger.info("=== VastuCart: International (USD) region setup ===")

  // ── 1. Verify International region exists ──────────────────────────────────
  logger.info(`Looking up International region (${INTERNATIONAL_REGION_ID})...`)
  let intlRegion: any
  try {
    const regions = await regionModuleService.listRegions({
      id: INTERNATIONAL_REGION_ID,
    })
    intlRegion = regions?.[0]
  } catch {}

  if (!intlRegion) {
    logger.error(`International region ${INTERNATIONAL_REGION_ID} not found. Aborting.`)
    return
  }
  logger.info(`Found region: "${intlRegion.name}" (${intlRegion.currency_code.toUpperCase()})`)

  // ── 2. Add Stripe payment provider to the International region ─────────────
  logger.info(`Adding ${STRIPE_PROVIDER_ID} to the International region...`)
  const existingProviders: string[] = (intlRegion.payment_providers || []).map(
    (p: any) => p.id || p
  )

  if (existingProviders.includes(STRIPE_PROVIDER_ID)) {
    logger.info(`${STRIPE_PROVIDER_ID} already enabled for International region. Skipping.`)
  } else {
    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: INTERNATIONAL_REGION_ID },
        update: {
          payment_providers: [...existingProviders, STRIPE_PROVIDER_ID],
        },
      },
    })
    logger.info(`✓ ${STRIPE_PROVIDER_ID} added to International region.`)
  }

  // ── 3. Get default shipping profile ───────────────────────────────────────
  logger.info("Looking up default shipping profile...")
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  })
  const shippingProfile = shippingProfiles?.[0]
  if (!shippingProfile) {
    logger.error("No default shipping profile found. Please create one first.")
    return
  }
  logger.info(`Found shipping profile: "${shippingProfile.name}"`)

  // ── 4. Create or reuse Global fulfillment set ──────────────────────────────
  logger.info("Looking for existing Global International fulfillment set...")
  const existingFulfillmentSets = await fulfillmentModuleService.listFulfillmentSets({
    name: "Global International Delivery",
  })

  let fulfillmentSet: any
  let serviceZoneId: string

  if (existingFulfillmentSets.length > 0) {
    fulfillmentSet = existingFulfillmentSets[0]
    serviceZoneId = fulfillmentSet.service_zones?.[0]?.id
    logger.info(`Reusing existing fulfillment set: "${fulfillmentSet.name}" (service_zone: ${serviceZoneId})`)
  } else {
    logger.info("Creating Global International fulfillment set...")
    // Deduplicate the country list
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
    logger.info(`✓ Created fulfillment set with service zone: ${serviceZoneId}`)
  }

  if (!serviceZoneId) {
    logger.error("Could not obtain a service zone ID. Aborting shipping options creation.")
    return
  }

  // ── 5. Check for existing International shipping options ───────────────────
  logger.info("Checking for existing International shipping options...")
  const existingOptions = await fulfillmentModuleService.listShippingOptions({
    fulfillment_set_id: fulfillmentSet.id,
  })
  const existingNames = existingOptions.map((o: any) => o.name)
  logger.info(`Existing options in this zone: [${existingNames.join(", ") || "none"}]`)

  // ── 6. Create International shipping options ───────────────────────────────
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
        {
          currency_code: "usd",
          amount: 15,  // $15.00 — adjust in Admin → Shipping after setup
        },
        {
          region_id: INTERNATIONAL_REGION_ID,
          amount: 15,
        },
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
        {
          currency_code: "usd",
          amount: 35,  // $35.00 — adjust in Admin → Shipping after setup
        },
        {
          region_id: INTERNATIONAL_REGION_ID,
          amount: 35,
        },
      ],
      rules: [
        { attribute: "enabled_in_store", value: "true", operator: "eq" },
        { attribute: "is_return", value: "false", operator: "eq" },
      ],
    })
  }

  if (optionsToCreate.length === 0) {
    logger.info("All shipping options already exist. Skipping creation.")
  } else {
    logger.info(`Creating ${optionsToCreate.length} shipping option(s): ${optionsToCreate.map((o) => o.name).join(", ")}`)
    await createShippingOptionsWorkflow(container).run({
      input: optionsToCreate,
    })
    logger.info(`✓ Shipping options created.`)
  }

  // ── 7. Summary ─────────────────────────────────────────────────────────────
  logger.info("")
  logger.info("=== Setup complete ===")
  logger.info(`Region:    International (USD) — ${INTERNATIONAL_REGION_ID}`)
  logger.info(`Stripe:    ${STRIPE_PROVIDER_ID} enabled`)
  logger.info(`Shipping:  International Standard Shipping ($15) + International Express Shipping ($35)`)
  logger.info("Tip: Adjust shipping prices in Admin → Shipping if needed.")
  logger.info("Tip: The fulfillment set uses 'manual_manual' — mark shipments manually in Admin → Orders.")
}
