"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, Settings, ExternalLink, LogOut } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { primary, secondary, gradients, fonts } from "./theme"

export default function AdminHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    router.push("/")
  }

  // Derive initials from user name
  const initials = user
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?"

  return (
    <header
      style={{
        background: gradients.header,
        height: "3.5rem", // h-14
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: "1.25rem",
        paddingRight: "1.25rem",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: Logo + Admin badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <Image
            src="/VastuCartLogo.png"
            alt="VastuCart"
            width={32}
            height={32}
            style={{ objectFit: "contain", borderRadius: "4px" }}
          />
          <span
            style={{
              fontFamily: fonts.heading,
              fontWeight: 700,
              fontSize: "1.125rem",
              color: "#ffffff",
              letterSpacing: "-0.01em",
            }}
          >
            VastuCart
          </span>
        </Link>
        {/* Admin badge */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            paddingLeft: "0.5rem",
            paddingRight: "0.5rem",
            paddingTop: "0.125rem",
            paddingBottom: "0.125rem",
            borderRadius: "9999px",
            fontSize: "0.6875rem",
            fontWeight: 600,
            fontFamily: fonts.body,
            letterSpacing: "0.05em",
            textTransform: "uppercase" as const,
            color: "#ffffff",
            background: "rgba(200, 81, 3, 0.85)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          Admin
        </span>
      </div>

      {/* Right: User Menu */}
      <div ref={dropdownRef} style={{ position: "relative" }}>
        {/* Trigger button */}
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.25rem 0.5rem",
            borderRadius: "0.5rem",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "rgba(255,255,255,0.08)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "none")
          }
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
        >
          {/* Avatar circle */}
          <div
            style={{
              width: "2rem",
              height: "2rem",
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.20)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonts.body,
              fontWeight: 700,
              fontSize: "0.8125rem",
              color: "#ffffff",
              flexShrink: 0,
              border: "1.5px solid rgba(255,255,255,0.35)",
            }}
          >
            {initials}
          </div>
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "rgba(255,255,255,0.9)",
              maxWidth: "8rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap" as const,
            }}
          >
            {user?.name ?? ""}
          </span>
          <ChevronDown
            size={15}
            color="rgba(255,255,255,0.7)"
            style={{
              transition: "transform 0.2s",
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              right: 0,
              minWidth: "14rem",
              background: "#ffffff",
              borderRadius: "0.75rem",
              boxShadow:
                "0 10px 25px -5px rgba(0,0,0,0.12), 0 4px 10px -4px rgba(0,0,0,0.08)",
              overflow: "hidden",
              zIndex: 100,
            }}
          >
            {/* Gradient top border */}
            <div
              style={{
                height: "3px",
                background: gradients.accentBorder,
                flexShrink: 0,
              }}
            />

            {/* User identity */}
            <div
              style={{
                padding: "0.875rem 1rem 0.75rem",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <p
                style={{
                  fontFamily: fonts.body,
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  color: primary[500],
                  margin: 0,
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap" as const,
                }}
              >
                {user?.name ?? "Admin"}
              </p>
              <p
                style={{
                  fontFamily: fonts.body,
                  fontWeight: 400,
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  margin: "0.125rem 0 0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap" as const,
                }}
              >
                {user?.email ?? ""}
              </p>
            </div>

            {/* Menu items */}
            <div style={{ padding: "0.375rem 0" }}>
              <Link
                href="/admin/profile"
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.5625rem 1rem",
                  fontFamily: fonts.body,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#374151",
                  textDecoration: "none",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background =
                    "#f9fafb")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background =
                    "transparent")
                }
              >
                <Settings size={15} color={primary[400]} />
                Profile
              </Link>

              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.5625rem 1rem",
                  fontFamily: fonts.body,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#374151",
                  textDecoration: "none",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background =
                    "#f9fafb")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background =
                    "transparent")
                }
              >
                <ExternalLink size={15} color={primary[400]} />
                View Storefront
              </Link>

              {/* Divider */}
              <div
                style={{
                  height: "1px",
                  background: "#f3f4f6",
                  margin: "0.375rem 0",
                }}
              />

              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  width: "100%",
                  padding: "0.5625rem 1rem",
                  fontFamily: fonts.body,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#ef4444",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left" as const,
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "#fef2f2")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "transparent")
                }
              >
                <LogOut size={15} color="#ef4444" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
