/**
 * Strip undefined-valued keys from a partial-update payload before passing
 * it into a Medusa generated `update<Model>` method.
 *
 * Why: Medusa's generated module-service `update*` methods treat
 * `{ x: undefined }` as an explicit "set to undefined" and reject the
 * payload (or worse, corrupt the row by writing null over an existing
 * value). The pattern of `update*({ id, ...req.body })` silently breaks
 * when the request body has any optional fields the caller didn't send.
 *
 * Use in any admin POST/PATCH route that updates a Medusa model:
 *
 *   const body = req.body as { status?: string; notes?: string }
 *   const updated = await service.updateBookings({
 *     id, ...stripUndefined(body),
 *   })
 *
 * Also handles type coercion for the `as any` cast at the call site —
 * the returned object is typed as `Record<string, unknown>` so the
 * service's flexible signature accepts it.
 */

export function stripUndefined<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
      out[key] = obj[key]
    }
  }
  return out
}
