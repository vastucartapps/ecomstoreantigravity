"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { medusa } from "@/lib/medusa"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: "customer" | "admin"
  avatarUrl: string | null
  phone: string | null
  emailVerified: boolean
  memberSince: string
  currency: "INR" | "USD"
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  adminLogin: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    password: string
    first_name: string
    last_name: string
  }) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, newPassword: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const mapCustomerToUser = (customer: any): AuthUser => ({
    id: customer.id,
    name:
      [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
      customer.email,
    email: customer.email,
    role: customer.metadata?.role === "admin" ? "admin" : "customer",
    avatarUrl: customer.metadata?.avatar_url || null,
    phone: customer.phone || null,
    emailVerified: !!customer.has_account,
    memberSince: customer.created_at || new Date().toISOString(),
    currency: "INR",
  })

  const refreshUser = useCallback(async () => {
    try {
      const { customer } = await medusa.store.customer.retrieve()
      if (customer) {
        setUser(mapCustomerToUser(customer))
      }
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false))
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    await medusa.auth.login("customer", "emailpass", { email, password })
    const { customer } = await medusa.store.customer.retrieve()
    if (customer) {
      const mappedUser = mapCustomerToUser(customer)
      setUser(mappedUser)
      // Admin users need user-actor JWT so adminFetch / medusa.admin.* calls work
      if (mappedUser.role === "admin") {
        try {
          await medusa.auth.login("user", "emailpass", { email, password })
        } catch {
          // user-actor login failed — admin API calls may still fail
        }
      }
    }
  }

  const adminLogin = async (email: string, password: string) => {
    await medusa.auth.login("user", "emailpass", { email, password })
    try {
      const res = await medusa.client.fetch<{ user: any }>("/admin/users/me", {
        method: "GET",
      })
      if (res.user) {
        setUser({
          id: res.user.id,
          name:
            [res.user.first_name, res.user.last_name]
              .filter(Boolean)
              .join(" ") || res.user.email,
          email: res.user.email,
          role: "admin",
          avatarUrl: res.user.metadata?.avatar_url || null,
          phone: null,
          emailVerified: true,
          memberSince: new Date().toISOString(),
          currency: "INR",
        })
      }
    } catch {
      throw new Error("Admin authentication failed")
    }
  }

  const register = async (data: {
    email: string
    password: string
    first_name: string
    last_name: string
  }) => {
    const token = await medusa.auth.register("customer", "emailpass", {
      email: data.email,
      password: data.password,
    })
    await medusa.store.customer.create(
      {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
      },
      {},
      { Authorization: `Bearer ${token}` }
    )
    // Login after registration
    await medusa.auth.login("customer", "emailpass", {
      email: data.email,
      password: data.password,
    })
    await refreshUser()
  }

  const forgotPassword = async (email: string) => {
    // Medusa v2 generates a reset token and emits an event
    // The notification subscriber will handle sending the email
    try {
      await medusa.auth.resetPassword("customer", "emailpass", {
        identifier: email,
      })
    } catch {
      // Silently succeed to not reveal if email exists
    }
  }

  const resetPassword = async (token: string, newPassword: string) => {
    await medusa.client.fetch("/auth/customer/emailpass/update", {
      method: "POST",
      body: { password: newPassword },
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  const logout = async () => {
    try {
      await medusa.auth.logout()
    } catch {
      // ignore — may already be logged out
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: user?.role === "admin",
        login,
        adminLogin,
        register,
        forgotPassword,
        resetPassword,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
