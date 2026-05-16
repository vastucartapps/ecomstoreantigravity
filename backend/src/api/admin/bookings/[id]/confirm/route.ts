import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { BOOKINGS_MODULE } from "../../../../../modules/bookings"
import { fetchBrandFromStore } from "../../../../../lib/brand-from-store"
import { captureException, captureWarning } from "../../../../../lib/error-reporter"

// Whitelist of meeting-link domains the admin is allowed to attach to a
// confirmed booking. Catches the common admin mistake of pasting a tracking
// URL or a personal Calendly invite that would later confuse the customer,
// and shuts the door on a hostile admin attaching a phishing link to a
// confirmation email. Add new providers here (e.g. "teams.live.com") rather
// than disabling validation.
const ALLOWED_MEETING_DOMAINS = [
  "meet.google.com",
  "zoom.us",
  "us02web.zoom.us",
  "us04web.zoom.us",
  "us05web.zoom.us",
  "us06web.zoom.us",
  "teams.microsoft.com",
  "teams.live.com",
  "skype.com",
  "join.skype.com",
  "webex.com",
  "vastucart.in",
  "store.vastucart.in",
]

function isAllowedMeetingUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    if (u.protocol !== "https:") return false
    const host = u.hostname.toLowerCase()
    return ALLOWED_MEETING_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))
  } catch {
    return false
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const bookingId = req.params.id
  const { meeting_link } = req.body as { meeting_link?: string }

  if (meeting_link && !isAllowedMeetingUrl(meeting_link)) {
    res.status(400).json({
      message: `meeting_link must be HTTPS and on an allowed provider (${ALLOWED_MEETING_DOMAINS.slice(0, 4).join(", ")}, …)`,
    })
    return
  }

  try {
    const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
    const booking = await bookingsService.updateBookingStatus(
      bookingId,
      "confirmed",
      meeting_link
    )

    // Send a confirmation email so the customer learns the booking moved
    // from "requested" to "confirmed" without having to log back in. Failure
    // here must not roll back the status change — log + continue.
    try {
      const notifService = req.scope.resolve(Modules.NOTIFICATION) as any
      const brand = await fetchBrandFromStore(req.scope)
      if (booking?.customer_email) {
        await notifService.createNotifications({
          to: booking.customer_email,
          channel: "email",
          template: "booking-confirmed",
          data: {
            store_name: brand.storeName,
            store_url: brand.storeUrl,
            customer_name: booking.customer_name || "there",
            service: booking.service_name,
            booking_date: booking.booking_date,
            booking_time: booking.booking_time,
            meeting_link: meeting_link || "",
            subject: `Your ${brand.storeName} consultation is confirmed`,
            title: "Your consultation is confirmed",
          },
        })
      } else {
        captureWarning("booking confirmed but customer_email missing — skipping email", {
          source: "api/admin/bookings/[id]/confirm",
          booking_id: bookingId,
        })
      }
    } catch (notifyErr) {
      captureException(notifyErr, {
        source: "api/admin/bookings/[id]/confirm:notify",
        booking_id: bookingId,
      })
    }

    res.json({ booking })
  } catch (err) {
    captureException(err, {
      source: "api/admin/bookings/[id]/confirm:POST",
      booking_id: bookingId,
    })
    res.status(500).json({ message: (err as Error)?.message || "Failed to confirm booking" })
  }
}
