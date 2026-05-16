"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { medusa } from "@/lib/medusa"
import { useAuth } from "@/providers/auth-provider"

type Status = "verifying" | "ok" | "no-token" | "needs-login" | "error"

function ChangeEmailVerifyContent() {
  const { refreshUser } = useAuth()
  const [status, setStatus] = useState<Status>("verifying")
  const [newEmail, setNewEmail] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const hash = window.location.hash.replace(/^#/, "")
    const token = hash ? new URLSearchParams(hash).get("token") : null
    if (token)
      window.history.replaceState({}, "", "/account/change-email/verify")

    if (!token) {
      setStatus("no-token")
      return
    }

    const run = async () => {
      try {
        const authToken =
          typeof window !== "undefined" ? localStorage.getItem("medusa_auth_token") : null
        if (!authToken) {
          window.history.replaceState(
            {},
            "",
            `/account/change-email/verify#token=${encodeURIComponent(token)}`
          )
          setStatus("needs-login")
          return
        }
        const res = await medusa.client.fetch<{ success: boolean; email?: string }>(
          "/store/customers/me/change-email",
          { method: "PUT", body: { token } }
        )
        if (!res?.success) throw new Error("Verification failed")
        setNewEmail(res.email || null)
        await refreshUser()
        setStatus("ok")
      } catch (err: any) {
        setErrorMessage(err?.message || "Verification failed")
        setStatus("error")
      }
    }
    run()
  }, [refreshUser])

  return (
    <div className="max-w-md mx-auto py-12">
      <div
        className="p-8 rounded-2xl text-center"
        style={{
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          border: "1px solid #f0ebe4",
        }}
      >
        {status === "verifying" && (
          <>
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: "#013f47" }} />
            <p style={{ color: "#013f47" }}>Confirming your new email…</p>
          </>
        )}
        {status === "ok" && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "#16a34a" }} />
            <h1
              className="text-xl font-semibold mb-2"
              style={{ fontFamily: "'Lora', serif", color: "#013f47" }}
            >
              Email changed
            </h1>
            <p className="text-sm mb-5" style={{ color: "#75615a" }}>
              Your account email is now <strong>{newEmail || "updated"}</strong>. Sign in with this address from now on.
            </p>
            <Link
              href="/account"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #013f47, #054348)" }}
            >
              Back to dashboard
            </Link>
          </>
        )}
        {status === "no-token" && (
          <Failure title="Invalid link" body="This link is missing its confirmation token. Please request a new email change from your account settings." />
        )}
        {status === "needs-login" && (
          <>
            <h1
              className="text-xl font-semibold mb-2"
              style={{ fontFamily: "'Lora', serif", color: "#013f47" }}
            >
              Sign in to confirm
            </h1>
            <p className="text-sm mb-5" style={{ color: "#75615a" }}>
              Sign in using your <em>current</em> email — once you do, we'll finalize the change automatically.
            </p>
            <Link
              href="/login?returnTo=/account/change-email/verify"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #013f47, #054348)" }}
            >
              Sign in
            </Link>
          </>
        )}
        {status === "error" && (
          <Failure
            title="We couldn't change your email"
            body={
              errorMessage ||
              "This link may have expired or already been used. Start the change again from your security settings."
            }
          />
        )}
      </div>
    </div>
  )
}

function Failure({ title, body }: { title: string; body: string }) {
  return (
    <>
      <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "#dc2626" }} />
      <h1
        className="text-xl font-semibold mb-2"
        style={{ fontFamily: "'Lora', serif", color: "#013f47" }}
      >
        {title}
      </h1>
      <p className="text-sm mb-5" style={{ color: "#75615a" }}>
        {body}
      </p>
      <Link
        href="/account/security"
        className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #013f47, #054348)" }}
      >
        Open security settings
      </Link>
    </>
  )
}

export default function ChangeEmailVerifyPage() {
  return (
    <Suspense>
      <ChangeEmailVerifyContent />
    </Suspense>
  )
}
