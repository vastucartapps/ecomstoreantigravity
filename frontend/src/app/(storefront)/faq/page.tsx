import { redirect } from "next/navigation"

// The dedicated FAQ surface was an unbuilt placeholder ("Coming in Section 08")
// that ranked nothing and answered no one. Until a real Q&A page exists, send
// any incoming /faq traffic to /contact, which already lists support hours,
// channels, and the canonical answers to shipping/returns/payments questions.
// Using next/redirect issues a 307 — keep this until a real FAQ ships, then
// delete the file entirely.
export default function FaqRedirect() {
  redirect("/contact")
}
