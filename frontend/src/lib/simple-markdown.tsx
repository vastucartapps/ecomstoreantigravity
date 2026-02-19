/**
 * Very simple markdown renderer for content pages.
 * Supports: # h1, ## h2, ### h3, **bold**, *italic*, - list items, paragraphs
 */

import { primary, earth, fonts, bg } from "@/lib/theme"

export function renderMarkdown(content: string) {
  if (!content) return null

  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let key = 0

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul
          key={`list-${key++}`}
          style={{
            margin: "0 0 16px 0",
            paddingLeft: "20px",
            listStyleType: "disc",
          }}
        >
          {listItems.map((item, i) => (
            <li
              key={i}
              style={{
                marginBottom: "6px",
                fontSize: "15px",
                lineHeight: 1.7,
                color: earth[600],
                fontFamily: fonts.body,
              }}
              dangerouslySetInnerHTML={{ __html: inlineFormat(item) }}
            />
          ))}
        </ul>
      )
      listItems = []
    }
  }

  function inlineFormat(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[(.+?)\]\((.+?)\)/g, `<a href="$2" style="color:${primary[500]};text-decoration:underline">$1</a>`)
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith("# ")) {
      flushList()
      elements.push(
        <h1
          key={key++}
          style={{
            fontFamily: fonts.heading,
            fontSize: "2rem",
            fontWeight: 700,
            color: primary[500],
            margin: "0 0 16px 0",
            lineHeight: 1.3,
          }}
        >
          {trimmed.slice(2)}
        </h1>
      )
    } else if (trimmed.startsWith("## ")) {
      flushList()
      elements.push(
        <h2
          key={key++}
          style={{
            fontFamily: fonts.heading,
            fontSize: "1.375rem",
            fontWeight: 600,
            color: primary[600],
            margin: "24px 0 12px 0",
            lineHeight: 1.4,
          }}
        >
          {trimmed.slice(3)}
        </h2>
      )
    } else if (trimmed.startsWith("### ")) {
      flushList()
      elements.push(
        <h3
          key={key++}
          style={{
            fontFamily: fonts.heading,
            fontSize: "1.125rem",
            fontWeight: 600,
            color: earth[700],
            margin: "20px 0 10px 0",
          }}
        >
          {trimmed.slice(4)}
        </h3>
      )
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listItems.push(trimmed.slice(2))
    } else if (trimmed === "") {
      flushList()
    } else {
      flushList()
      elements.push(
        <p
          key={key++}
          style={{
            margin: "0 0 14px 0",
            fontSize: "15px",
            lineHeight: 1.8,
            color: earth[600],
            fontFamily: fonts.body,
          }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed) }}
        />
      )
    }
  }

  flushList()
  return elements
}

interface MarkdownPageProps {
  title: string
  content: string
  lastUpdated?: string
}

export function MarkdownPage({ title, content, lastUpdated }: MarkdownPageProps) {
  return (
    <div
      style={{
        minHeight: "70vh",
        backgroundColor: bg.primary,
        padding: "3rem 1rem",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          backgroundColor: bg.card,
          borderRadius: "1rem",
          padding: "3rem 2.5rem",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
          borderTop: `4px solid ${primary[500]}`,
        }}
      >
        {lastUpdated && (
          <p
            style={{
              fontSize: "12px",
              color: earth[300],
              fontFamily: fonts.body,
              marginBottom: "24px",
            }}
          >
            Last updated:{" "}
            {new Date(lastUpdated).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
        <div>{renderMarkdown(content)}</div>
      </div>
    </div>
  )
}
