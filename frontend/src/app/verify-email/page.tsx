"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { medusa } from "@/lib/medusa"

type Status = "verifying" | "ok" | "no-token" | "needs-login" | "error"

function VerifyEmailContent() {
  const [status, setStatus] = useState<Status>("verifying")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const hash = window.location.hash.replace(/^#/, "")
    const token = hash ? new URLSearchParams(hash).get("token") : null

    // Scrub the token from the URL bar so it doesn't leak via screen-share /
    // browser history. Fragments aren't sent to the server, so the only risk
    // is local visibility.
    if (token) window.history.replaceState({}, "", "/verify-email")

    if (!token) {
      setStatus("no-token")
      return
    }

    const run = async () => {
      try {
        const authToken =
          typeof window !== "undefined" ? localStorage.getItem("medusa_auth_token") : null
        if (!authToken) {
          // Stash the token on the hash so the user can return after login
          // without losing it.
          window.history.replaceState(
            {},
            "",
            `/verify-email#token=${encodeURIComponent(token)}`
          )
          setStatus("needs-login")
          return
        }
        await medusa.client.fetch("/store/customers/me/verify-email", {
          method: "PUT",
          body: { token },
        })
        setStatus("ok")
      } catch (err: any) {
        setErrorMessage(err?.message || "Verification failed")
        setStatus("error")
      }
    }
    run()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#fffbf5" }}>
      <div
        className="max-w-md w-full p-8 rounded-2xl text-center"
        style={{
          background: "#ffffff",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
          border: "1px solid #f0ebe4",
        }}
      >
        {status === "verifying" && (
          <>
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: "#013f47" }} />
            <p style={{ color: "#013f47" }}>Verifying your email…</p>
          </>
        )}
        {status === "ok" && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "#16a34a" }} />
            <h1
              className="text-xl font-semibold mb-2"
              style={{ fontFamily: "'Lora', serif", color: "#013f47" }}
            >
              Email verified
            </h1>
            <p className="text-sm mb-5" style={{ color: "#75615a" }}>
              Your email is confirmed. You can now use the full account.
            </p>
            <Link
              href="/account"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #013f47, #054348)" }}
            >
              Go to dashboard
            </Link>
          </>
        )}
        {status === "no-token" && <FailureBlock title="Invalid link" body="This verification link is missing its token. Please request a new one from your account settings." />}
        {status === "needs-login" && (
          <>
            <h1
              className="text-xl font-semibold mb-2"
              style={{ fontFamily: "'Lora', serif", color: "#013f47" }}
            >
              Sign in to confirm
            </h1>
            <p className="text-sm mb-5" style={{ color: "#75615a" }}>
              Sign in to the account you registered with, and we'll finish verifying your email automatically.
            </p>
            <Link
              href="/login?returnTo=/verify-email"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #013f47, #054348)" }}
            >
              Sign in
            </Link>
          </>
        )}
        {status === "error" && (
          <FailureBlock
            title="We couldn't verify your email"
            body={
              errorMessage ||
              "This link may have expired or already been used. Request a new one from your account settings."
            }
          />
        )}
      </div>
    </div>
  )
}

function FailureBlock({ title, body }: { title: string; body: string }) {
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

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
