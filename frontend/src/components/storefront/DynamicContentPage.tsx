"use client"

import { useState, useEffect } from "react"
import { MarkdownPage } from "@/lib/simple-markdown"
import { primary, earth, fonts, bg, shadows } from "@/lib/theme"

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

  if (content) {
    return <MarkdownPage title={title} content={content} lastUpdated={lastUpdated} />
  }

  // Fallback: render static content with MarkdownPage
  return <MarkdownPage title={fallbackTitle} content={fallbackContent} />
}
