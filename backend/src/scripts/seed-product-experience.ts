import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { PRODUCT_REVIEW_MODULE } from "../modules/product-review"
import { PRODUCT_QA_MODULE } from "../modules/product-qa"

export default async function seedProductExperience({ container }: ExecArgs) {
  const productService = container.resolve(Modules.PRODUCT)
  const reviewService = container.resolve(PRODUCT_REVIEW_MODULE)
  const qaService = container.resolve(PRODUCT_QA_MODULE)

  console.log("Starting product experience seed...")

  // Get all products
  const products = await productService.listProducts({}, { relations: ["categories"] })
  if (products.length === 0) {
    console.log("No products found. Run seed-products first.")
    return
  }

  console.log(`Found ${products.length} products. Adding reviews, Q&A, and metadata...`)

  // Reviews data per product (will cycle through)
  const reviewTemplates = [
    {
      reviewer_name: "Priya Sharma",
      reviewer_location: "Mumbai, Maharashtra",
      rating: 5,
      title: "Absolutely beautiful quality!",
      text: "The craftsmanship is outstanding. The product arrived well-packaged and looks even better in person. The energy is palpable. Would highly recommend for anyone serious about their spiritual practice.",
      is_verified_purchase: true,
    },
    {
      reviewer_name: "Rajesh Kumar",
      reviewer_location: "Delhi, NCR",
      rating: 4,
      title: "Good quality, met expectations",
      text: "Nice product overall. The material quality is good and it looks authentic. Delivery was on time. Could improve packaging a bit but the product itself is great.",
      is_verified_purchase: true,
    },
    {
      reviewer_name: "Anjali Patel",
      reviewer_location: "Ahmedabad, Gujarat",
      rating: 5,
      title: "Perfect for my pooja room",
      text: "Exactly what I was looking for! The size is perfect and the detailing is exquisite. My family loves it. The quality surpasses the price point.",
      is_verified_purchase: true,
    },
    {
      reviewer_name: "Suresh Reddy",
      reviewer_location: "Hyderabad, Telangana",
      rating: 4,
      title: "Genuine product, fast shipping",
      text: "Was skeptical about buying spiritual items online but VastuCart delivered an authentic product. The certificate of authenticity was a nice touch. Will order again.",
      is_verified_purchase: false,
    },
    {
      reviewer_name: "Meera Nair",
      reviewer_location: "Kochi, Kerala",
      rating: 5,
      title: "Transformative energy",
      text: "Since placing this in my meditation corner, I've noticed a significant difference in my practice. The quality is premium and the spiritual energy is undeniable. Thank you VastuCart!",
      is_verified_purchase: true,
    },
    {
      reviewer_name: "Vikram Singh",
      reviewer_location: "Jaipur, Rajasthan",
      rating: 3,
      title: "Decent but expected more",
      text: "The product is okay for the price. Quality is acceptable but I was expecting slightly better finish. It serves its purpose though.",
      is_verified_purchase: true,
    },
  ]

  // FAQ templates
  const faqTemplates = [
    { question: "Is this product authentic and certified?", answer: "Yes, all our products are 100% authentic. Each item comes with a certificate of authenticity and is sourced directly from trusted artisans and mines." },
    { question: "How should I care for this product?", answer: "Keep away from direct sunlight and moisture. Clean gently with a soft dry cloth. For crystals, you can cleanse them under moonlight or with sage smoke periodically." },
    { question: "Can I return this if it doesn't meet my expectations?", answer: "We offer a 7-day easy return policy. If you're not satisfied, contact our support team and we'll arrange a return or exchange." },
    { question: "Is gift wrapping available?", answer: "Yes! We offer premium gift wrapping with a personalized message card. Select the gift wrap option during checkout." },
    { question: "Do you ship internationally?", answer: "Currently we ship within India. International shipping is coming soon. Sign up for our newsletter to be notified." },
  ]

  // Q&A templates
  const qaTemplates = [
    {
      question: "What is the exact weight of this product?",
      asked_by: "Amit K.",
      answer: "The weight varies slightly as these are natural products. The approximate weight is mentioned in the specifications. For exact weight, please contact our support team.",
      answered_by: "VastuCart Team",
      is_admin_answer: true,
    },
    {
      question: "Can this be placed in the bedroom as per Vastu?",
      asked_by: "Sunita M.",
      answer: "The ideal placement depends on the specific product. We recommend the northeast corner for most spiritual items. Check our Vastu guide on the product page or consult with our Vastu experts.",
      answered_by: "VastuCart Team",
      is_admin_answer: true,
    },
    {
      question: "Is COD available for this product?",
      asked_by: "Rohit P.",
      answer: null,
      answered_by: null,
      is_admin_answer: false,
    },
  ]

  // Specification templates by category
  const specsByCategory: Record<string, any[]> = {
    "crystals-gemstones": [
      { groupName: "General", specs: [{ key: "Material", value: "Natural Crystal" }, { key: "Origin", value: "Brazil / India" }, { key: "Certification", value: "Lab Certified" }] },
      { groupName: "Physical Properties", specs: [{ key: "Hardness", value: "7 Mohs" }, { key: "Color", value: "Natural (varies)" }, { key: "Treatment", value: "None - 100% Natural" }] },
      { groupName: "Care & Usage", specs: [{ key: "Cleansing", value: "Moonlight or sage smoke" }, { key: "Charging", value: "Sunlight (morning hours)" }, { key: "Storage", value: "Soft cloth pouch" }] },
    ],
    "brass-copper": [
      { groupName: "General", specs: [{ key: "Material", value: "Pure Brass / Copper" }, { key: "Finish", value: "Hand-polished" }, { key: "Craftsmanship", value: "Handmade by artisans" }] },
      { groupName: "Dimensions", specs: [{ key: "Height", value: "15-20 cm (varies)" }, { key: "Weight", value: "See product details" }, { key: "Base", value: "Stable flat base" }] },
    ],
    "yantras": [
      { groupName: "General", specs: [{ key: "Material", value: "Pure Copper / Brass" }, { key: "Engraving", value: "Precision machine-cut" }, { key: "Energization", value: "Pran Pratishtha done" }] },
      { groupName: "Usage", specs: [{ key: "Placement", value: "East-facing wall or pooja room" }, { key: "Worship", value: "Daily with flowers and incense" }] },
    ],
    default: [
      { groupName: "General", specs: [{ key: "Material", value: "Premium quality" }, { key: "Origin", value: "India" }, { key: "Packaging", value: "Secure gift-ready packaging" }] },
    ],
  }

  for (const product of products) {
    console.log(`\n  Processing: ${product.title}`)

    // 1. Update product metadata with FAQs, specs, rich content
    const categoryHandle = product.categories?.[0]?.handle || "default"
    const specs = specsByCategory[categoryHandle] || specsByCategory.default

    const faqs = faqTemplates.map((f, i) => ({
      id: `faq-${product.id}-${i}`,
      ...f,
    }))

    const richContentBlocks = [
      {
        id: `rc-hero-${product.id}`,
        type: "hero",
        title: "The VastuCart Promise",
        imageUrl: product.thumbnail || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=600&fit=crop",
        headline: `Why Choose Our ${product.title}`,
        description: `Every ${product.title} at VastuCart is carefully sourced and quality-checked to ensure you receive only the finest spiritual products. Our commitment to authenticity means each item comes with proper certification and has been handled with reverence throughout the supply chain.`,
      },
    ]

    try {
      await productService.updateProducts(product.id, {
        metadata: {
          ...product.metadata,
          specifications: JSON.stringify(specs),
          faqs: JSON.stringify(faqs),
          rich_content: JSON.stringify(richContentBlocks),
          short_description: (product.description || "").slice(0, 200),
          delivery_estimate: "3-5 business days",
          return_policy: "7-day easy returns",
          express_shipping: "true",
        },
      })
      console.log("    Updated metadata (specs, FAQs, rich content)")
    } catch (err) {
      console.error(`    Failed to update metadata:`, err)
    }

    // 2. Seed reviews (3-5 per product)
    const numReviews = 3 + Math.floor(Math.random() * 3)
    for (let i = 0; i < numReviews; i++) {
      const template = reviewTemplates[i % reviewTemplates.length]
      try {
        await reviewService.createProductReviews({
          product_id: product.id,
          reviewer_name: template.reviewer_name,
          reviewer_location: template.reviewer_location,
          rating: template.rating,
          title: template.title,
          text: template.text,
          photos: "[]",
          variant: "Default",
          is_verified_purchase: template.is_verified_purchase,
        })
      } catch (err) {
        console.error(`    Failed to create review:`, err)
      }
    }
    console.log(`    Added ${numReviews} reviews`)

    // 3. Seed questions (2-3 per product)
    const numQs = 2 + Math.floor(Math.random() * 2)
    for (let i = 0; i < numQs; i++) {
      const template = qaTemplates[i % qaTemplates.length]
      try {
        await qaService.createProductQuestions({
          product_id: product.id,
          question: template.question,
          asked_by: template.asked_by,
          answer: template.answer,
          answered_by: template.answered_by,
          answered_at: template.answer ? new Date().toISOString() : null,
          is_admin_answer: template.is_admin_answer,
        })
      } catch (err) {
        console.error(`    Failed to create question:`, err)
      }
    }
    console.log(`    Added ${numQs} Q&A entries`)
  }

  console.log("\nProduct experience seed complete!")
}
