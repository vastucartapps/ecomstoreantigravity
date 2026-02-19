"use client"

import { SessionManager } from "@/components/auth/SessionManager"

export default function AccountSecurityPage() {
  return (
    <div>
      <h1
        className="text-xl font-semibold mb-1"
        style={{ fontFamily: "'Lora', serif", color: "#013f47" }}
      >
        Security
      </h1>
      <p
        className="text-sm mb-8"
        style={{
          color: "#75615a",
          fontFamily: "'Open Sans', sans-serif",
        }}
      >
        Manage your active sessions and account security
      </p>

      <div
        className="rounded-2xl p-6"
        style={{
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          border: "1px solid #f0ebe4",
        }}
      >
        <SessionManager />
      </div>
    </div>
  )
}
