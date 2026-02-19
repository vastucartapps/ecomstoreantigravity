import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ACTIVE_SESSIONS_MODULE } from "../modules/active-sessions"
import crypto from "crypto"

export default async function sessionTrackerHandler({
  event,
  container,
}: SubscriberArgs<{ auth_identity_id: string }>) {
  const activeSessionsService = container.resolve(ACTIVE_SESSIONS_MODULE)
  const logger = container.resolve("logger")

  const authIdentityId = event.data?.auth_identity_id
  if (!authIdentityId) return

  try {
    // Create a session record for this authentication event
    const tokenHash = crypto
      .createHash("sha256")
      .update(`${authIdentityId}-${Date.now()}`)
      .digest("hex")
      .substring(0, 32)

    // Mark all existing sessions as not current
    const [existingSessions] =
      await activeSessionsService.listAndCountActiveSessions({
        auth_identity_id: authIdentityId,
        is_current: true,
      })

    for (const session of existingSessions) {
      await activeSessionsService.updateActiveSessions({
        id: session.id,
        is_current: false,
      })
    }

    // Create new session
    await activeSessionsService.createActiveSessions({
      auth_identity_id: authIdentityId,
      device: "Web Browser",
      ip_address: "Detected on request",
      location: "Unknown",
      last_active: new Date(),
      is_current: true,
      token_hash: tokenHash,
    })

    logger.info(`Session created for auth identity: ${authIdentityId}`)
  } catch (err: any) {
    logger.warn(`Failed to track session: ${err.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "auth.token_generated",
}
