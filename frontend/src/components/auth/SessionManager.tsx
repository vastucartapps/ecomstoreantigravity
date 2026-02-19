"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Monitor,
  Smartphone,
  Globe,
  Trash2,
  LogOut,
  Loader2,
  Shield,
} from "lucide-react"
import { medusa } from "@/lib/medusa"
import type { ActiveSession } from "@/types/auth"

export function SessionManager() {
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [revokingAll, setRevokingAll] = useState(false)

  const fetchSessions = useCallback(async () => {
    try {
      const res = await medusa.client.fetch<{ sessions: ActiveSession[] }>(
        "/store/customers/me/sessions",
        { method: "GET" }
      )
      setSessions(res.sessions || [])
    } catch {
      setSessions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const revokeSession = async (sessionId: string) => {
    setRevoking(sessionId)
    try {
      await medusa.client.fetch(`/store/customers/me/sessions/${sessionId}`, {
        method: "DELETE",
      })
      await fetchSessions()
    } catch {
      // Session may already be revoked
    } finally {
      setRevoking(null)
    }
  }

  const revokeAllSessions = async () => {
    setRevokingAll(true)
    try {
      await medusa.client.fetch("/store/customers/me/sessions", {
        method: "DELETE",
      })
      await fetchSessions()
    } catch {
      // Ignore
    } finally {
      setRevokingAll(false)
    }
  }

  const getDeviceIcon = (device: string) => {
    const d = device.toLowerCase()
    if (d.includes("iphone") || d.includes("android") || d.includes("mobile"))
      return <Smartphone className="w-5 h-5" />
    return <Monitor className="w-5 h-5" />
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    } catch {
      return dateStr
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2
          className="w-6 h-6 animate-spin"
          style={{ color: "#013f47" }}
        />
      </div>
    )
  }

  const otherSessions = sessions.filter((s) => !s.is_current)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5" style={{ color: "#013f47" }} />
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: "'Lora', serif", color: "#013f47" }}
          >
            Active Sessions
          </h2>
        </div>
        {otherSessions.length > 0 && (
          <button
            onClick={revokeAllSessions}
            disabled={revokingAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: "#FEE2E2",
              color: "#EF4444",
              fontFamily: "'Open Sans', sans-serif",
            }}
          >
            {revokingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Logout all other sessions
          </button>
        )}
      </div>

      {/* Sessions list */}
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between p-4 rounded-xl transition-all"
            style={{
              background: session.is_current ? "#e8f5f3" : "#ffffff",
              border: `1px solid ${session.is_current ? "#c5e8e2" : "#f0ebe4"}`,
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: session.is_current ? "#013f47" : "#f5f0eb",
                  color: session.is_current ? "#ffffff" : "#75615a",
                }}
              >
                {getDeviceIcon(session.device)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: "#433b35",
                      fontFamily: "'Open Sans', sans-serif",
                    }}
                  >
                    {session.device}
                  </p>
                  {session.is_current && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: "#013f47",
                        color: "#ffffff",
                      }}
                    >
                      Current
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "#a39585" }}
                  >
                    <Globe className="w-3 h-3" />
                    {session.location}
                  </span>
                  <span className="text-xs" style={{ color: "#a39585" }}>
                    {session.ip_address}
                  </span>
                  <span className="text-xs" style={{ color: "#a39585" }}>
                    Last active: {formatDate(session.last_active)}
                  </span>
                </div>
              </div>
            </div>

            {!session.is_current && (
              <button
                onClick={() => revokeSession(session.id)}
                disabled={revoking === session.id}
                className="p-2 rounded-lg transition-all"
                style={{ color: "#EF4444" }}
                title="Revoke session"
              >
                {revoking === session.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        ))}

        {sessions.length === 0 && (
          <div
            className="text-center py-8 rounded-xl"
            style={{ background: "#f5f0eb" }}
          >
            <Shield className="w-8 h-8 mx-auto mb-3" style={{ color: "#a39585" }} />
            <p
              className="text-sm"
              style={{
                color: "#75615a",
                fontFamily: "'Open Sans', sans-serif",
              }}
            >
              No active sessions found
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
