import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"

// India region created via admin panel — used for region-scoped shipping prices.
const INDIA_REGION_ID = "reg_01KHP9J32H1H104VBXD87P00ET"
const FULFILLMENT_SET_NAME = "India Warehouse delivery"

/**
 * GET /admin/shipping-setup
 *
 * Returns the current Medusa shipping option configuration so the admin UI
 * can show what is already set up and whether setup is required.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const fulfillmentSvc = req.scope.resolve(Modules.FULFILLMENT)

    const fulfillmentSets = await fulfillmentSvc.listFulfillmentSets({
      name: FULFILLMENT_SET_NAME,
    })

    const [shippingOptions] = await fulfillmentSvc.listAndCountShippingOptions(
      {},
      { relations: ["prices", "rules", "service_zone"] }
    )

    res.json({
      setup_required: fulfillmentSets.length === 0,
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
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: msg })
  }
}

/**
 * POST /admin/shipping-setup
 *
 * Idempotent: if India fulfillment set already exists, returns 200 with
 * already_exists=true without modifying anything.
 *
 * Creates:
 *   - Stock location: "India Warehouse"
 *   - FulfillmentSet: "India Warehouse delivery"
 *   - ServiceZone: "India" with geo_zone country_code=in
 *   - Link: stock_location ↔ fulfillment_set
 *   - Link: default sales channel ↔ stock_location
 *   - ShippingOption: "Standard Shipping" (FREE, INR 0)
 *   - ShippingOption: "Express Shipping" (INR 99 = 9900 paise)
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const fulfillmentSvc = req.scope.resolve(Modules.FULFILLMENT)
    const salesChannelSvc = req.scope.resolve(Modules.SALES_CHANNEL)
    const link = req.scope.resolve(ContainerRegistrationKeys.LINK)

    // ── Idempotency check ───────────────────────────────────────────────────
    const existing = await fulfillmentSvc.listFulfillmentSets({
      name: FULFILLMENT_SET_NAME,
    })
    if (existing.length > 0) {
      const [options] = await fulfillmentSvc.listAndCountShippingOptions({})
      return res.json({
        success: true,
        already_exists: true,
        message: "India shipping options are already configured.",
        shipping_options: options.map((o) => ({ id: o.id, name: o.name })),
      })
    }

    // ── Shipping profile (reuse default) ────────────────────────────────────
    const profiles = await fulfillmentSvc.listShippingProfiles({ type: "default" })
    let shippingProfile = profiles[0]
    if (!shippingProfile) {
      const { result } = await createShippingProfilesWorkflow(req.scope).run({
        input: {
          data: [{ name: "Default Shipping Profile", type: "default" }],
        },
      })
      shippingProfile = result[0]
    }

    // ── Stock location ───────────────────────────────────────────────────────
    const { result: locations } = await createStockLocationsWorkflow(req.scope).run({
      input: {
        locations: [
          {
            name: "India Warehouse",
            address: { city: "Mumbai", country_code: "IN", address_1: "" },
          },
        ],
      },
    })
    const stockLocation = locations[0]

    // ── Fulfillment set + service zone ───────────────────────────────────────
    const fulfillmentSet = await fulfillmentSvc.createFulfillmentSets({
      name: FULFILLMENT_SET_NAME,
      type: "shipping",
      service_zones: [
        {
          name: "India",
          geo_zones: [{ country_code: "in", type: "country" }],
        },
      ],
    })
    const serviceZoneId = fulfillmentSet.service_zones[0].id

    // ── Links ────────────────────────────────────────────────────────────────
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    })

    const defaultChannels = await salesChannelSvc.listSalesChannels({
      name: "Default Sales Channel",
    })
    if (defaultChannels.length > 0) {
      await linkSalesChannelsToStockLocationWorkflow(req.scope).run({
        input: { id: stockLocation.id, add: [defaultChannels[0].id] },
      })
    }

    // ── Shipping options ─────────────────────────────────────────────────────
    // Prices are in minor units (paise). ₹0 = 0, ₹99 = 9900.
    // Both currency_code and region_id prices are provided so that Medusa
    // resolves the correct price for the India region at checkout.
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
          type: {
            label: "Standard",
            description: "Delivery in 5–7 business days.",
            code: "standard",
          },
          prices: [
            { currency_code: "inr", amount: 0 },
            { region_id: INDIA_REGION_ID, amount: 0 },
          ],
          rules: STORE_RULES,
        },
        {
          name: "Express Shipping",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: serviceZoneId,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Express",
            description: "Delivery in 1–3 business days.",
            code: "express",
          },
          prices: [
            { currency_code: "inr", amount: 9900 },
            { region_id: INDIA_REGION_ID, amount: 9900 },
          ],
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
        stock_location: stockLocation.name,
        fulfillment_set: fulfillmentSet.name,
        service_zone: "India (country: in)",
        shipping_options: createdOptions.map((o) => o.name),
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    res.status(500).json({ error: msg, stack })
  }
}
