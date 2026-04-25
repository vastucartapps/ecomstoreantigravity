"use client"

import { useState, useEffect, useMemo } from "react"
import { MarkdownPage } from "@/lib/simple-markdown"
import { primary, earth, fonts, bg, shadows } from "@/lib/theme"
import { useBranding } from "@/providers/announcement-provider"
import { useOperationalPolicies } from "@/providers/announcement-provider"
import { interpolatePolicy, type PolicyVariables } from "@/lib/policy-template"
import { BRAND_DEFAULTS } from "@/lib/brand-defaults"

interface LegalEntityFields {
  legalName: string
  gstin: string
  registeredAddress: string
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

interface DynamicContentPageProps {
  slug: string
  fallbackTitle: string
  fallbackContent: string
}

export function DynamicContentPage({
  slug,
  fallbackTitle,
  fallbackContent,
}: DynamicContentPageProps) {
  const [content, setContent] = useState<string | null>(null)
  const [title, setTitle] = useState(fallbackTitle)
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(undefined)
  const [loaded, setLoaded] = useState(false)

  // Single source of truth for variables that may appear inside policy
  // markdown (admin-edited or fallback). Pulled from the same hooks the
  // footer trust ribbon and homepage badge use, so a single edit in admin
  // updates the legal pages immediately.
  const branding = useBranding()
  const ops = useOperationalPolicies()
  const [legal, setLegal] = useState<LegalEntityFields>({
    legalName: "",
    gstin: "",
    registeredAddress: "",
  })

  // Fetch the legal-entity fields (GSTIN, registered address, legal name)
  // from the public payment-config endpoint. These are public business
  // identifiers that appear in invoice headers and legal page boilerplate.
  useEffect(() => {
    fetch(`${BACKEND_URL}/store/payment-config`, {
      headers: { "x-publishable-api-key": PUB_KEY },
    })
      .then((r) => r.json())
      .then((data) => {
        setLegal({
          legalName: data.legal_name || "",
          gstin: data.gstin || "",
          registeredAddress: data.registered_address || "",
        })
      })
      .catch(() => {
        // Defaults remain empty — the {{var}} placeholders will stay as
        // literal text in the rendered markdown to make the missing
        // configuration obvious.
      })
  }, [])

  const policyVars: PolicyVariables = useMemo(
    () => ({
      storeName: branding.storeName,
      contactEmail: branding.contactEmail,
      contactPhone: branding.contactPhone,
      streetAddress: (branding as any).streetAddress || BRAND_DEFAULTS.streetAddress,
      addressLocality: (branding as any).addressLocality || BRAND_DEFAULTS.addressLocality,
      addressRegion: (branding as any).addressRegion || BRAND_DEFAULTS.addressRegion,
      postalCode: (branding as any).postalCode || BRAND_DEFAULTS.postalCode,
      addressCountry: (branding as any).addressCountry || BRAND_DEFAULTS.addressCountry,
      fullAddress:
        branding.address ||
        `${BRAND_DEFAULTS.streetAddress}, ${BRAND_DEFAULTS.addressLocality}, ${BRAND_DEFAULTS.addressRegion} ${BRAND_DEFAULTS.postalCode}`,
      returnWindowDays: ops.returnWindowDays,
      inspectionDays: ops.inspectionDays,
      refundDays: ops.refundDays,
      freeShippingThresholdInr: ops.freeShippingThresholdInr,
      freeShippingThresholdUsd: ops.freeShippingThresholdUsd,
      codMinOrderInr: ops.codMinOrderInr,
      codMaxOrderInr: ops.codMaxOrderInr,
      codFee: ops.codFee,
      legalName: legal.legalName,
      gstin: legal.gstin,
      registeredAddress: legal.registeredAddress,
    }),
    [branding, ops, legal]
  )

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/store/storefront-config`, {
          headers: { "x-publishable-api-key": PUB_KEY },
        })
        if (res.ok) {
          const data = await res.json()
          const pages = data.config?.contentPages
          if (pages?.length) {
            const page = pages.find((p: any) => p.slug === slug)
            if (page?.isPublished && page.content) {
              setTitle(page.title || fallbackTitle)
              setContent(page.content)
              setLastUpdated(page.lastUpdated)
              setLoaded(true)
              return
            }
          }
        }
      } catch {
        // Fall through to static content
      }
      setLoaded(true)
    }

    fetchContent()
  }, [slug, fallbackTitle])

  if (!loaded) {
    return (
      <div
        style={{
          minHeight: "70vh",
          backgroundColor: bg.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: earth[400], fontSize: "14px", fontFamily: fonts.body }}>
          Loading…
        </p>
      </div>
    )
  }

  // Interpolate template variables — applies to admin-edited content AND
  // the fallback markdown alike, so {{contactEmail}} in either source is
  // resolved to the live admin value at render time.
  const sourceMarkdown = content ?? fallbackContent
  const rendered = interpolatePolicy(sourceMarkdown, policyVars)
  const renderedTitle = interpolatePolicy(content ? title : fallbackTitle, policyVars)

  return <MarkdownPage title={renderedTitle} content={rendered} lastUpdated={lastUpdated} />
}
