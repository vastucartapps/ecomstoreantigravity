"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Check } from "lucide-react"

/* ── Theme tokens (inline to avoid import dependency issues) ── */
const t = {
  primary500: "#013f47",
  primary400: "#2a7a72",
  primary100: "#c5e8e2",
  primary50: "#e8f5f3",
  secondary500: "#c85103",
  earth700: "#433b35",
  earth600: "#5a4f47",
  earth400: "#75615a",
  earth300: "#a39585",
  border: "#e8e0d8",
  card: "#ffffff",
  bg: "#fffbf5",
  font: "'Open Sans', sans-serif",
  shadow: "0 8px 30px rgba(67,59,53,0.14), 0 2px 8px rgba(67,59,53,0.06)",
}

/* ── Types ── */
export interface ThemeSelectOption {
  value: string
  label: string
}

interface ThemeSelectProps {
  value: string
  onChange: (value: string) => void
  options: ThemeSelectOption[]
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
  /** sm = compact admin filters, md = default forms */
  size?: "sm" | "md"
}

/* ── Component ── */
export function ThemeSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  style,
  disabled = false,
  size = "md",
}: ThemeSelectProps) {
  const [open, setOpen] = useState(false)
  const [focusIdx, setFocusIdx] = useState(-1)
  const [portalReady, setPortalReady] = useState(false)
  // Start with position:fixed + visibility:hidden so the portal never causes
  // a layout-shift scroll on the first render frame.
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({
    position: "fixed",
    visibility: "hidden",
  })

  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  // Track whether focusIdx changed due to keyboard navigation (not initial open)
  const isKeyNav = useRef(false)

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label || placeholder,
    [options, value, placeholder]
  )

  /* ── Portal readiness (SSR safe) ── */
  useEffect(() => setPortalReady(true), [])

  /* ── Calculate dropdown position from trigger rect ── */
  const calcPosition = useCallback((rect: DOMRect): React.CSSProperties => {
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const maxH = 260
    const openAbove = spaceBelow < maxH && spaceAbove > spaceBelow
    return {
      position: "fixed",
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(maxH, openAbove ? spaceAbove - 8 : spaceBelow - 8),
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    }
  }, [])

  const reposition = useCallback(() => {
    if (!triggerRef.current) return
    setDropStyle(calcPosition(triggerRef.current.getBoundingClientRect()))
  }, [calcPosition])

  /* ── Open/close side effects ── */
  useEffect(() => {
    if (!open) return
    reposition()
    const onScroll = () => reposition()
    const onResize = () => reposition()
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onResize)
    }
  }, [open, reposition])

  /* ── Click outside ── */
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const el = e.target as Node
      if (
        triggerRef.current?.contains(el) ||
        dropRef.current?.contains(el)
      )
        return
      setOpen(false)
      setFocusIdx(-1)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  /* ── Scroll focused item into view (keyboard navigation only) ── */
  useEffect(() => {
    if (focusIdx < 0 || !dropRef.current || !isKeyNav.current) return
    const items = dropRef.current.querySelectorAll("[data-opt]")
    items[focusIdx]?.scrollIntoView({ block: "nearest" })
  }, [focusIdx])

  /* ── Keyboard ── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault()
        openDropdown()
      }
      return
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        isKeyNav.current = true
        setFocusIdx((p) => Math.min(p + 1, options.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        isKeyNav.current = true
        setFocusIdx((p) => Math.max(p - 1, 0))
        break
      case "Enter":
      case " ":
        e.preventDefault()
        if (focusIdx >= 0 && focusIdx < options.length) {
          onChange(options[focusIdx].value)
          setOpen(false)
          setFocusIdx(-1)
          isKeyNav.current = false
        }
        break
      case "Escape":
      case "Tab":
        setOpen(false)
        setFocusIdx(-1)
        isKeyNav.current = false
        break
    }
  }

  const openDropdown = useCallback(() => {
    if (!triggerRef.current) return
    // Calculate position SYNCHRONOUSLY before opening so the portal renders
    // with the correct position on the first frame — prevents layout-shift jump.
    const style = calcPosition(triggerRef.current.getBoundingClientRect())
    isKeyNav.current = false
    setDropStyle(style)
    setOpen(true)
    const idx = options.findIndex((o) => o.value === value)
    setFocusIdx(idx >= 0 ? idx : 0)
  }, [calcPosition, options, value])

  /* ── Size tokens ── */
  const isSmall = size === "sm"
  const py = isSmall ? "6px" : "9px"
  const px = isSmall ? "10px" : "12px"
  const fontSize = isSmall ? "0.75rem" : "0.875rem"
  const iconSz = isSmall ? 13 : 15
  const optPy = isSmall ? "6px" : "8px"

  /* ── Dropdown panel (rendered in portal) ── */
  const dropdown = open && portalReady
    ? createPortal(
        <div
          ref={dropRef}
          role="listbox"
          style={{
            ...dropStyle,
            zIndex: 99999,
            background: t.card,
            border: `1px solid ${t.border}`,
            borderRadius: "10px",
            boxShadow: t.shadow,
            overflowY: "auto",
            overflowX: "hidden",
            fontFamily: t.font,
            fontSize,
          }}
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value
            const isFocused = idx === focusIdx
            const highlighted = isSelected || isFocused
            return (
              <button
                key={opt.value}
                data-opt
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                  setFocusIdx(-1)
                }}
                onMouseEnter={() => setFocusIdx(idx)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: `${optPy} ${px}`,
                  textAlign: "left",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.1s, color 0.1s",
                  background: highlighted ? t.primary50 : "transparent",
                  color: isSelected ? t.primary500 : t.earth600,
                  fontWeight: isSelected ? 600 : 400,
                  fontFamily: t.font,
                  fontSize,
                  lineHeight: 1.4,
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {opt.label}
                </span>
                {isSelected && (
                  <Check
                    size={isSmall ? 12 : 14}
                    style={{ color: t.primary500, flexShrink: 0, marginLeft: 8 }}
                  />
                )}
              </button>
            )
          })}
          {options.length === 0 && (
            <div style={{ padding: `${optPy} ${px}`, color: t.earth300, fontFamily: t.font }}>
              No options
            </div>
          )}
        </div>,
        document.body
      )
    : null

  return (
    <div className={className} style={style}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (disabled) return
          if (open) { setOpen(false); setFocusIdx(-1); isKeyNav.current = false } else openDropdown()
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "6px",
          width: "100%",
          padding: `${py} ${px}`,
          borderRadius: isSmall ? "8px" : "10px",
          border: `1.5px solid ${open ? t.primary400 : t.border}`,
          color: value ? t.earth700 : t.earth300,
          background: disabled ? t.bg : t.card,
          fontFamily: t.font,
          fontSize,
          lineHeight: 1.4,
          textAlign: "left",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.55 : 1,
          boxShadow: open ? `0 0 0 3px rgba(1,63,71,0.06)` : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
          outline: "none",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {selectedLabel}
        </span>
        <ChevronDown
          size={iconSz}
          style={{
            color: t.earth300,
            flexShrink: 0,
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      {dropdown}
    </div>
  )
}
