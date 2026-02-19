import { ExecArgs } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"

export default async function seedProducts({ container }: ExecArgs) {
  const productService = container.resolve(Modules.PRODUCT)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const regionService = container.resolve(Modules.REGION)

  console.log("Starting product seed...")

  // Get sales channel
  const salesChannels = await salesChannelService.listSalesChannels({})
  const defaultChannel = salesChannels[0]
  if (!defaultChannel) {
    throw new Error("No sales channel found. Run medusa seed first.")
  }
  console.log(`  Sales channel: ${defaultChannel.id}`)

  // Ensure INR region exists
  let regions = await regionService.listRegions({})
  let inrRegion = regions.find((r: any) => r.currency_code === "inr")
  if (!inrRegion) {
    inrRegion = await regionService.createRegions({
      name: "India",
      currency_code: "inr",
    })
    console.log("  Created India region")
  }
  console.log(`  Region: ${inrRegion.id} (${inrRegion.currency_code})`)

  // Create categories
  const categoryData = [
    { name: "Crystals & Gemstones", handle: "crystals-gemstones", description: "Natural healing crystals and precious gemstones for spiritual wellness" },
    { name: "Brass & Copper Idols", handle: "brass-copper", description: "Artisan-crafted brass and copper religious idols and figurines" },
    { name: "Yantras & Sacred Geometry", handle: "yantras", description: "Powerful yantras for prosperity, protection and spiritual growth" },
    { name: "Rudraksha & Malas", handle: "rudraksha-malas", description: "Authentic rudraksha beads and meditation malas" },
    { name: "Vastu Remedies", handle: "vastu-remedies", description: "Vastu Shastra correction items for home and office" },
    { name: "Incense & Aromatherapy", handle: "incense-aromatherapy", description: "Premium incense sticks, dhoop, and essential oils" },
  ]

  const categories: any[] = []
  for (const cat of categoryData) {
    const existing = await productService.listProductCategories({ handle: cat.handle })
    if (existing.length > 0) {
      categories.push(existing[0])
    } else {
      const created = await productService.createProductCategories(cat)
      categories.push(created)
      console.log(`  Created category: ${cat.name}`)
    }
  }

  // Products to seed
  const products = [
    {
      title: "Natural Amethyst Crystal Cluster",
      handle: "natural-amethyst-crystal-cluster",
      description: "Beautiful natural amethyst crystal cluster sourced from Brazil. Known for its calming and protective properties. Each piece is unique with deep purple coloring and natural crystal formations. Perfect for meditation spaces or as a thoughtful gift.",
      thumbnail: "https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=600&h=600&fit=crop",
      images: [
        { url: "https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=800&h=800&fit=crop" },
        { url: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&h=800&fit=crop" },
      ],
      categoryIndex: 0,
      metadata: { rating: "4.8", review_count: "124", is_new: "true" },
      price: 249900,
      weight: 350,
    },
    {
      title: "Rose Quartz Heart Stone",
      handle: "rose-quartz-heart-stone",
      description: "Polished rose quartz carved into a perfect heart shape. The stone of unconditional love promotes self-love, deep inner healing, and feelings of peace. Ideal for placing in your bedroom or relationship corner as per Vastu.",
      thumbnail: "https://images.unsplash.com/photo-1603344204980-4edb0ea63148?w=600&h=600&fit=crop",
      images: [
        { url: "https://images.unsplash.com/photo-1603344204980-4edb0ea63148?w=800&h=800&fit=crop" },
      ],
      categoryIndex: 0,
      metadata: { rating: "4.6", review_count: "89" },
      price: 89900,
      weight: 150,
    },
    {
      title: "Seven Chakra Crystal Tree",
      handle: "seven-chakra-crystal-tree",
      description: "Handcrafted crystal tree featuring genuine gemstone chips representing all seven chakras. Golden wire branches make this a powerful and beautiful energy-balancing piece for any room.",
      thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=600&fit=crop",
      images: [
        { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=800&fit=crop" },
      ],
      categoryIndex: 0,
      metadata: { rating: "4.9", review_count: "203", is_new: "true" },
      price: 179900,
      weight: 280,
    },
    {
      title: "Brass Ganesha Idol - Large",
      handle: "brass-ganesha-idol-large",
      description: "Exquisitely detailed brass Ganesha idol, handcrafted by skilled artisans. Lord Ganesha, the remover of obstacles, brings prosperity and wisdom. Perfect for your pooja room or as a centerpiece.",
      thumbnail: "https://images.unsplash.com/photo-1567591370504-81e1642e8b18?w=600&h=600&fit=crop",
      images: [
        { url: "https://images.unsplash.com/photo-1567591370504-81e1642e8b18?w=800&h=800&fit=crop" },
      ],
      categoryIndex: 1,
      metadata: { rating: "4.9", review_count: "312", deal_expires_at: "2026-03-15T23:59:59Z", deal_discount_percent: "25" },
      price: 449900,
      weight: 1200,
    },
    {
      title: "Copper Kalash with Coconut",
      handle: "copper-kalash-coconut",
      description: "Pure copper kalash (sacred vessel) with decorative coconut top. Essential for pujas, housewarming ceremonies, and Vastu correction. Copper purifies water and the kalash symbolizes abundance.",
      thumbnail: "https://images.unsplash.com/photo-1606293926249-ed22e446d476?w=600&h=600&fit=crop",
      images: [
        { url: "https://images.unsplash.com/photo-1606293926249-ed22e446d476?w=800&h=800&fit=crop" },
      ],
      categoryIndex: 1,
      metadata: { rating: "4.7", review_count: "156" },
      price: 189900,
      weight: 800,
    },
    {
      title: "Sri Yantra in Pure Copper",
      handle: "sri-yantra-pure-copper",
      description: "Precision-engraved Sri Yantra on pure copper plate. The most powerful yantra for wealth, prosperity, and spiritual advancement. Energized and ready for worship.",
      thumbnail: "https://images.unsplash.com/photo-1609619385002-f40f1df9b5a4?w=600&h=600&fit=crop",
      images: [
        { url: "https://images.unsplash.com/photo-1609619385002-f40f1df9b5a4?w=800&h=800&fit=crop" },
      ],
      categoryIndex: 2,
      metadata: { rating: "4.8", review_count: "267", is_new: "true" },
      price: 149900,
      weight: 200,
    },
    {
      title: "5 Mukhi Rudraksha Mala (108 beads)",
      handle: "5-mukhi-rudraksha-mala-108",
      description: "Authentic 5 Mukhi Rudraksha mala with 108 hand-knotted beads on silk thread. Each bead is lab-certified. Represents Lord Shiva and is ideal for meditation and daily wear.",
      thumbnail: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=600&h=600&fit=crop",
      images: [
        { url: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=800&h=800&fit=crop" },
      ],
      categoryIndex: 3,
      metadata: { rating: "4.7", review_count: "198", deal_expires_at: "2026-03-20T23:59:59Z", deal_discount_percent: "20" },
      price: 299900,
      weight: 50,
    },
    {
      title: "Vastu Pyramid Set (9 pieces)",
      handle: "vastu-pyramid-set-9",
      description: "Complete set of 9 brass Vastu pyramids for comprehensive Vastu correction. Includes placement guide. Pyramids harness cosmic energy and correct Vastu doshas in homes and offices.",
      thumbnail: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop",
      images: [
        { url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop" },
      ],
      categoryIndex: 4,
      metadata: { rating: "4.5", review_count: "134" },
      price: 349900,
      weight: 600,
    },
    {
      title: "Nag Champa Premium Incense (12 packs)",
      handle: "nag-champa-premium-incense-12",
      description: "Premium quality Nag Champa incense sticks, hand-rolled using traditional methods. Each pack contains 15 sticks. Perfect for meditation and creating a sacred atmosphere.",
      thumbnail: "https://images.unsplash.com/photo-1600104931408-30e223929b6b?w=600&h=600&fit=crop",
      images: [
        { url: "https://images.unsplash.com/photo-1600104931408-30e223929b6b?w=800&h=800&fit=crop" },
      ],
      categoryIndex: 5,
      metadata: { rating: "4.4", review_count: "445" },
      price: 59900,
      weight: 400,
    },
    {
      title: "Black Tourmaline Protection Stone",
      handle: "black-tourmaline-protection-stone",
      description: "Raw black tourmaline specimen, one of the most powerful protection stones. Absorbs negative energy and EMF radiation. Place near entrance or workspace for maximum protection.",
      thumbnail: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&h=600&fit=crop",
      images: [
        { url: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&h=800&fit=crop" },
      ],
      categoryIndex: 0,
      metadata: { rating: "4.6", review_count: "178", is_new: "true" },
      price: 129900,
      weight: 250,
    },
  ]

  // Create each product using the workflow
  for (const p of products) {
    const existing = await productService.listProducts({ handle: p.handle })
    if (existing.length > 0) {
      console.log(`  "${p.title}" already exists, skipping`)
      continue
    }

    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: p.title,
            handle: p.handle,
            description: p.description,
            thumbnail: p.thumbnail,
            images: p.images,
            status: "published" as const,
            weight: p.weight,
            metadata: p.metadata,
            category_ids: [categories[p.categoryIndex].id],
            sales_channels: [{ id: defaultChannel.id }],
            options: [
              { title: "Default", values: ["Default"] },
            ],
            variants: [
              {
                title: "Default",
                sku: p.handle,
                manage_inventory: false,
                options: { Default: "Default" },
                prices: [
                  { amount: p.price, currency_code: "inr" },
                ],
              },
            ],
          },
        ],
      },
    })

    console.log(`  Created: ${p.title} — INR ${(p.price / 100).toLocaleString()}`)
  }

  console.log("\nSeed complete! 10 products, 6 categories, all linked to sales channel with pricing.")
}
