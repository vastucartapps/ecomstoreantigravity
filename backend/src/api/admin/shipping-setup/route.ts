import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

// India region — created via admin panel. Must match the deployed region ID.
const INDIA_REGION_ID = "reg_01KHP9J32H1H104VBXD87P00ET"
const FULFILLMENT_SET_NAME = "India Warehouse delivery"

function serializeError(err: unknown): { error: string; detail?: string } {
  if (err instanceof Error) return { error: err.message, detail: err.stack }
  try {
    return { error: JSON.stringify(err) }
  } catch {
    return { error: String(err) }
  }
}

/**
 * GET /admin/shipping-setup
 *
 * Returns the current state so the admin UI can show whether setup is needed.
 * setup_required = true when no shipping options exist yet.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const fulfillmentSvc = req.scope.resolve(Modules.FULFILLMENT)

    const fulfillmentSets = await fulfillmentSvc.listFulfillmentSets({
      name: FULFILLMENT_SET_NAME,
    })

    const [shippingOptions] = await fulfillmentSvc.listAndCountShippingOptions(
      {},
      { relations: ["rules", "service_zone"] }
    )

    res.json({
      setup_required: shippingOptions.length === 0,
      fulfillment_sets: fulfillmentSets.map((fs) => ({
        id: fs.id,
        name: fs.name,
        type: fs.type,
      })),
      shipping_options: shippingOptions.map((o) => ({
        id: o.id,
        name: o.name,
        price_type: o.price_type,
      })),
    })
  } catch (err: unknown) {
    res.status(500).json(serializeError(err))
  }
}

/**
 * POST /admin/shipping-setup
 *
 * Fully idempotent — safe to call multiple times. Skips already-created
 * resources and only creates what's missing.
 *
 * Creates (in order):
 *   1. Ensures INR is a supported store currency
 *   2. Stock location: "India Warehouse" (if missing)
 *   3. FulfillmentSet + ServiceZone for India (if missing)
 *   4. Links: stock_location ↔ fulfillment_set, sales_channel ↔ stock_location
 *   5. ShippingOptions: Standard (FREE) + Express (₹99)
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const fulfillmentSvc = req.scope.resolve(Modules.FULFILLMENT)
    const salesChannelSvc = req.scope.resolve(Modules.SALES_CHANNEL)
    const storeModuleSvc = req.scope.resolve(Modules.STORE)
    const link = req.scope.resolve(ContainerRegistrationKeys.LINK)

    // ── 1. Ensure INR is a supported store currency ──────────────────────────
    // Without this, shipping option prices with currency_code "inr" are rejected
    // by the pricing module.
    const [store] = await storeModuleSvc.listStores(
      {},
      { relations: ["supported_currencies"] }
    )
    const existingCurrencies: { currency_code: string; is_default?: boolean }[] =
      (store as any).supported_currencies || []
    const hasInr = existingCurrencies.some(
      (c: { currency_code: string }) => c.currency_code === "inr"
    )
    if (!hasInr) {
      const currentCodes = existingCurrencies.map((c) => ({
        currency_code: c.currency_code,
        is_default: c.is_default ?? false,
      }))
      await updateStoresWorkflow(req.scope).run({
        input: {
          selector: { id: store.id },
          update: {
            supported_currencies: [
              ...currentCodes,
              { currency_code: "inr", is_default: false },
            ],
          },
        },
      })
    }

    // ── 2. Shipping profile ──────────────────────────────────────────────────
    const profiles = await fulfillmentSvc.listShippingProfiles({ type: "default" })
    let shippingProfile = profiles[0]
    if (!shippingProfile) {
      const { result } = await createShippingProfilesWorkflow(req.scope).run({
        input: { data: [{ name: "Default Shipping Profile", type: "default" }] },
      })
      shippingProfile = result[0]
    }

    // ── 3. Stock location ────────────────────────────────────────────────────
    let stockLocationId: string
    const existingLocations = await (
      req.scope.resolve(Modules.STOCK_LOCATION) as {
        listStockLocations: (f: object) => Promise<Array<{ id: string; name: string }>>
      }
    ).listStockLocations({ name: "India Warehouse" })

    if (existingLocations.length > 0) {
      stockLocationId = existingLocations[0].id
    } else {
      const { result: locations } = await createStockLocationsWorkflow(req.scope).run({
        input: {
          locations: [
            { name: "India Warehouse", address: { city: "Mumbai", country_code: "IN", address_1: "" } },
          ],
        },
      })
      stockLocationId = locations[0].id

      // Link new stock location to fulfillment set (if set exists)
      // and to default sales channel.
      const defaultChannels = await salesChannelSvc.listSalesChannels({
        name: "Default Sales Channel",
      })
      if (defaultChannels.length > 0) {
        await linkSalesChannelsToStockLocationWorkflow(req.scope).run({
          input: { id: stockLocationId, add: [defaultChannels[0].id] },
        })
      }
    }

    // ── 4. Fulfillment set + service zone ────────────────────────────────────
    let serviceZoneId: string
    const existingSets = await fulfillmentSvc.listFulfillmentSets({
      name: FULFILLMENT_SET_NAME,
    })

    if (existingSets.length > 0) {
      // Fetch with relations to get service_zones
      const fullSet = await fulfillmentSvc.retrieveFulfillmentSet(existingSets[0].id, {
        relations: ["service_zones"],
      })
      serviceZoneId = fullSet.service_zones[0].id
    } else {
      const fulfillmentSet = await fulfillmentSvc.createFulfillmentSets({
        name: FULFILLMENT_SET_NAME,
        type: "shipping",
        service_zones: [
          { name: "India", geo_zones: [{ country_code: "in", type: "country" }] },
        ],
      })
      serviceZoneId = fulfillmentSet.service_zones[0].id

      // Link: stock location ↔ fulfillment set (required for checkout)
      await link.create({
        [Modules.STOCK_LOCATION]: { stock_location_id: stockLocationId },
        [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
      })

      // Link: stock location ↔ fulfillment provider (required for createShippingOptionsWorkflow)
      // Without this link, the workflow throws "Providers not enabled for service location".
      await link.create({
        [Modules.STOCK_LOCATION]: { stock_location_id: stockLocationId },
        [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
      })
    }

    // ── 5. Shipping options ──────────────────────────────────────────────────
    const [existingOptions] = await fulfillmentSvc.listAndCountShippingOptions({})
    if (existingOptions.length > 0) {
      return res.json({
        success: true,
        already_exists: true,
        message: `India shipping is already configured (${existingOptions.length} options).`,
        shipping_options: existingOptions.map((o) => ({ id: o.id, name: o.name })),
      })
    }

    const STORE_RULES = [
      { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
      { attribute: "is_return", value: "false", operator: "eq" as const },
    ]

    await createShippingOptionsWorkflow(req.scope).run({
      input: [
        {
          name: "Standard Shipping",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: serviceZoneId,
          shipping_profile_id: shippingProfile.id,
          type: { label: "Standard", description: "5–7 business days.", code: "standard" },
          // Only region_id price — avoids currency support issues.
          // The pricing module resolves this price for India region checkouts.
          prices: [{ region_id: INDIA_REGION_ID, amount: 0 }],
          rules: STORE_RULES,
        },
        {
          name: "Express Shipping",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: serviceZoneId,
          shipping_profile_id: shippingProfile.id,
          type: { label: "Express", description: "1–3 business days.", code: "express" },
          prices: [{ region_id: INDIA_REGION_ID, amount: 9900 }],
          rules: STORE_RULES,
        },
      ],
    })

    const [createdOptions] = await fulfillmentSvc.listAndCountShippingOptions({})

    res.json({
      success: true,
      already_exists: false,
      message: "India shipping setup complete.",
      details: {
        fulfillment_set: FULFILLMENT_SET_NAME,
        service_zone: "India (country: in)",
        shipping_options: createdOptions.map((o) => o.name),
      },
    })
  } catch (err: unknown) {
    res.status(500).json(serializeError(err))
  }
}
