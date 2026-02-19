"use client"

import { DynamicContentPage } from "@/components/storefront/DynamicContentPage"

const FALLBACK = `# About VastuCart

VastuCart was founded with a simple mission: to make authentic spiritual and Vastu products accessible to every home across India.

## Our Story

We started when our founder noticed how difficult it was to find genuine, high-quality spiritual products online. Most platforms offered replicas or imported goods lacking the authentic craftsmanship that makes these items truly special.

## Our Mission

We source directly from artisans and certified manufacturers across India — from the brass workshops of Moradabad to the incense makers of Bengaluru. Every product we sell carries the quality and authenticity you deserve.

## Why VastuCart?

- **Authenticity Guaranteed** — Every product is verified for quality
- **Artisan Support** — We work directly with artisans across India
- **Vastu Expertise** — Our team includes certified Vastu consultants
- **Secure Shopping** — 100% secure payments and data protection`

export default function AboutPage() {
  return (
    <DynamicContentPage
      slug="about"
      fallbackTitle="About Us"
      fallbackContent={FALLBACK}
    />
  )
}
