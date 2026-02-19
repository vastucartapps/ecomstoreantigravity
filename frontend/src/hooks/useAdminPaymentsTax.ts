import { medusa, adminFetch } from "@/lib/medusa"
import type {
  PaymentsTaxConfig,
  GatewayConfig,
  PaymentMethodToggle,
  GSTConfig,
  InternationalTaxConfig,
  ProductTaxOverride,
  PaymentMode,
} from "@/types/admin-payments-tax"

const DEFAULT_PAYMENT_METHODS: PaymentMethodToggle[] = [
  {
    id: "razorpay",
    name: "Razorpay",
    icon: "smartphone",
    enabled: true,
    description: "Accept UPI, cards, net banking & wallets via Razorpay",
  },
  {
    id: "stripe",
    name: "Stripe",
    icon: "credit-card",
    enabled: true,
    description: "Accept international credit/debit cards via Stripe",
  },
  {
    id: "bank-transfer",
    name: "Bank Transfer",
    icon: "landmark",
    enabled: false,
    description: "NEFT/RTGS/IMPS bank transfers",
  },
  {
    id: "wallet",
    name: "Digital Wallets",
    icon: "wallet",
    enabled: true,
    description: "Paytm, PhonePe, Google Pay and other wallets",
  },
  {
    id: "cod",
    name: "Cash on Delivery",
    icon: "banknote",
    enabled: true,
    description: "Pay on delivery at your doorstep",
  },
]

const DEFAULT_CONFIG: PaymentsTaxConfig = {
  mode: "test",
  gateways: {
    razorpay: { keyId: "", keySecret: "", isConnected: false },
    stripe: { publishableKey: "", secretKey: "", isConnected: false },
  },
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  gstConfig: { gstin: "", defaultRate: 18, defaultHSN: "8306" },
  internationalTax: { taxExempt: false, lutNumber: "" },
}

async function readStore(): Promise<{ id: string; config: PaymentsTaxConfig }> {
  const res = await adminFetch<{ stores: Array<{ id: string; metadata?: Record<string, unknown> }> }>("/admin/stores")
  const store = res.stores?.[0]
  const saved = (store?.metadata?.payments_tax_config ?? undefined) as PaymentsTaxConfig | undefined
  const config: PaymentsTaxConfig = saved
    ? {
        ...DEFAULT_CONFIG,
        ...saved,
        paymentMethods: saved.paymentMethods?.length
          ? saved.paymentMethods
          : DEFAULT_PAYMENT_METHODS,
      }
    : DEFAULT_CONFIG
  return { id: store?.id || "", config }
}

async function writeConfig(storeId: string, config: PaymentsTaxConfig): Promise<void> {
  await medusa.client.fetch(`/admin/stores/${storeId}`, {
    method: "POST",
    body: { metadata: { payments_tax_config: config } },
  })
}

export function useAdminPaymentsTax() {
  async function fetchConfig(): Promise<{
    config: PaymentsTaxConfig
    productOverrides: ProductTaxOverride[]
  }> {
    const { config } = await readStore()

    const prodRes = await adminFetch<{ products: Array<{ id: string; title: string; handle: string; metadata?: Record<string, unknown>; variants?: Array<{ sku?: string }> }> }>(
      "/admin/products?limit=100&fields=id,title,handle,metadata,*variants"
    )
    const products = prodRes.products || []

    const productOverrides: ProductTaxOverride[] = products.map((p) => {
      const meta = p.metadata || {}
      return {
        productId: p.id,
        productName: p.title,
        sku: p.variants?.[0]?.sku || p.handle || p.id,
        gstRate:
          meta.gst_rate !== undefined
            ? Number(meta.gst_rate)
            : config.gstConfig.defaultRate,
        hsnCode: (meta.hsn_code as string) || config.gstConfig.defaultHSN,
      }
    })

    return { config, productOverrides }
  }

  async function toggleMode(mode: PaymentMode): Promise<void> {
    const { id, config } = await readStore()
    await writeConfig(id, { ...config, mode })
  }

  async function saveGateways(gateways: GatewayConfig): Promise<void> {
    const { id, config } = await readStore()
    await writeConfig(id, { ...config, gateways })
  }

  async function testConnection(
    gateway: "razorpay" | "stripe",
    gateways: GatewayConfig
  ): Promise<{ connected: boolean; error?: string }> {
    const body =
      gateway === "razorpay"
        ? { gateway, keyId: gateways.razorpay.keyId, keySecret: gateways.razorpay.keySecret }
        : { gateway, secretKey: gateways.stripe.secretKey }

    const res = await adminFetch<{ connected?: boolean; error?: string }>("/admin/gateways/test", {
      method: "POST",
      body,
    })

    return { connected: !!res.connected, error: res.error }
  }

  async function togglePaymentMethod(methodId: string): Promise<void> {
    const { id, config } = await readStore()
    const paymentMethods = config.paymentMethods.map((m) =>
      m.id === methodId ? { ...m, enabled: !m.enabled } : m
    )
    await writeConfig(id, { ...config, paymentMethods })
  }

  async function saveGST(gstConfig: GSTConfig): Promise<void> {
    const { id, config } = await readStore()
    await writeConfig(id, { ...config, gstConfig })
  }

  async function saveInternationalTax(
    internationalTax: InternationalTaxConfig
  ): Promise<void> {
    const { id, config } = await readStore()
    await writeConfig(id, { ...config, internationalTax })
  }

  async function saveProductOverride(override: ProductTaxOverride): Promise<void> {
    await medusa.client.fetch(`/admin/products/${override.productId}`, {
      method: "POST",
      body: {
        metadata: {
          gst_rate: override.gstRate,
          hsn_code: override.hsnCode,
        },
      },
    })
  }

  return {
    fetchConfig,
    toggleMode,
    saveGateways,
    testConnection,
    togglePaymentMethod,
    saveGST,
    saveInternationalTax,
    saveProductOverride,
  }
}
