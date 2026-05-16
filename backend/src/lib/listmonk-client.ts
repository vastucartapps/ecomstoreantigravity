/**
 * Listmonk API client for VastuCart
 * Handles transactional emails and newsletter subscriber management.
 * Template IDs are resolved by name and cached in memory.
 */

function lkUrl() {
  return (process.env.LISTMONK_URL || "http://listmonk:9000").replace(/\/$/, "")
}
function lkUser() { return process.env.LISTMONK_USERNAME || "listmonk" }
function lkPass() { return process.env.LISTMONK_PASSWORD || "listmonk" }

function authHeader(): string {
  return "Basic " + Buffer.from(`${lkUser()}:${lkPass()}`).toString("base64")
}

export function isListmonkConfigured(): boolean {
  return !!process.env.LISTMONK_URL
}

async function lkFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${lkUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
      ...(init.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Listmonk ${init.method || "GET"} ${path} → ${res.status}: ${text}`)
  }
  return res.json() as T
}

// ── Template ID cache (name → id) ───────────────────────────────────────────
const templateIdCache: Record<string, number> = {}

async function resolveTemplateId(name: string): Promise<number> {
  if (templateIdCache[name]) return templateIdCache[name]
  const data = await lkFetch<{ data: any }>("/api/templates")
  const list: any[] = Array.isArray(data?.data) ? data.data : (data?.data?.results || [])
  const found = list.find((t: any) => t.name === name)
  if (!found) throw new Error(`Listmonk template not found: "${name}". Run the setup script first.`)
  templateIdCache[name] = found.id
  return found.id
}

// ── Newsletter list ID cache ─────────────────────────────────────────────────
let newsletterListId: number | null = null

/** Listmonk list name — must match the list created in the Listmonk admin
 *  console. Override with LISTMONK_NEWSLETTER_LIST_NAME if the brand has
 *  been renamed in admin (e.g. "Acme Newsletter"). */
const LISTMONK_LIST_NAME =
  process.env.LISTMONK_NEWSLETTER_LIST_NAME ||
  `${process.env.STORE_NAME || "VastuCart"} Newsletter`

async function resolveNewsletterListId(): Promise<number | null> {
  if (newsletterListId !== null) return newsletterListId
  try {
    const data = await lkFetch<{ data: any }>("/api/lists?page=1&per_page=100")
    const list: any[] = data?.data?.results || data?.data || []
    const found = list.find((l: any) => l.name === LISTMONK_LIST_NAME)
    if (found) { newsletterListId = found.id; return found.id }
  } catch { /* best effort */ }
  return null
}

// ── Subscriber upsert ────────────────────────────────────────────────────────
async function ensureSubscriber(
  email: string,
  name: string,
  opts: { listIds?: number[]; confirmed?: boolean } = {}
): Promise<void> {
  try {
    await lkFetch("/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        email,
        name: name || email,
        status: opts.confirmed ? "enabled" : "unsubscribed",
        lists: opts.listIds || [],
        preconfirm_subscriptions: opts.confirmed || false,
      }),
    })
  } catch (err: any) {
    if (err.message.includes("409") || err.message.toLowerCase().includes("already exists")) {
      // Subscriber already exists. If we need to add to newsletter list, do so.
      if (opts.listIds?.length && opts.confirmed) {
        await addToLists(email, opts.listIds).catch(() => { /* best effort */ })
      }
      return
    }
    throw err
  }
}

async function addToLists(email: string, listIds: number[]): Promise<void> {
  const data = await lkFetch<{ data: any }>(
    `/api/subscribers?query=subscribers.email%3D%27${encodeURIComponent(email)}%27&page=1&per_page=1`
  )
  const subscribers: any[] = data?.data?.results || []
  if (!subscribers.length) return
  const sub = subscribers[0]
  await lkFetch(`/api/subscribers/${sub.id}/lists`, {
    method: "PUT",
    body: JSON.stringify({ ids: listIds, action: "add", status: "confirmed" }),
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send a transactional email via Listmonk.
 * The subscriber is upserted (unsubscribed status) automatically before sending.
 */
export async function sendTransactional(opts: {
  email: string
  name?: string
  templateName: string
  subject: string
  data: Record<string, string>
}): Promise<void> {
  if (!isListmonkConfigured()) {
    throw new Error("Listmonk not configured (LISTMONK_URL missing)")
  }
  const templateId = await resolveTemplateId(opts.templateName)
  await ensureSubscriber(opts.email, opts.name || opts.email)
  await lkFetch("/api/tx", {
    method: "POST",
    body: JSON.stringify({
      subscriber_email: opts.email,
      template_id: templateId,
      subject: opts.subject,
      data: opts.data,
    }),
  })
}

/**
 * Add an email address to the VastuCart Newsletter list.
 * Called from the newsletter signup endpoint.
 */
export async function addNewsletterSubscriber(email: string, name?: string): Promise<void> {
  if (!isListmonkConfigured()) return
  const listId = await resolveNewsletterListId()
  await ensureSubscriber(email, name || email, {
    listIds: listId ? [listId] : [],
    confirmed: true,
  })
}

/**
 * Validate that all requested template names exist in Listmonk WITHOUT
 * sending anything. Returns { ok, missing } so callers can decide whether
 * to disable a job or surface a setup error.
 */
export async function validateTemplates(names: string[]): Promise<{ ok: boolean; missing: string[] }> {
  if (!isListmonkConfigured()) return { ok: false, missing: names }
  try {
    const data = await lkFetch<{ data: any }>("/api/templates")
    const list: any[] = Array.isArray(data?.data) ? data.data : data?.data?.results || []
    const present = new Set(list.map((t: any) => t.name))
    const missing = names.filter((n) => !present.has(n))
    // Warm the cache so first send is a single API call.
    for (const t of list) {
      if (names.includes(t.name)) templateIdCache[t.name] = t.id
    }
    return { ok: missing.length === 0, missing }
  } catch {
    return { ok: false, missing: names }
  }
}
