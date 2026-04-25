"use client"

import { useState } from "react"
import {
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  Lock,
  User,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import type { AuthView, GuestConversion, PasswordRequirement } from "@/types/auth"
import type { MarketingSlide } from "@/types/auth"
import { MarketingPanel } from "./MarketingPanel"
import { PasswordStrengthMeter } from "./PasswordStrengthMeter"
import { useBranding } from "@/providers/announcement-provider"

interface AuthScreenProps {
  view: AuthView
  marketingSlides: MarketingSlide[]
  passwordRequirements: PasswordRequirement[]
  guestConversion?: GuestConversion
  onLogin?: (email: string, password: string, rememberMe: boolean) => Promise<void>
  onRegister?: (name: string, email: string, password: string) => Promise<void>
  onForgotPassword?: (email: string) => Promise<void>
  onResetPassword?: (newPassword: string) => Promise<void>
  onGuestConvert?: (password: string) => Promise<void>
  onGoogleLogin?: () => void
  onNavigate?: (view: AuthView) => void
  serverError?: string | null
}

function InputField({
  icon,
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  disabled,
  togglePassword,
  showPw,
  onTogglePassword,
}: {
  icon: React.ReactNode
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
  disabled?: boolean
  togglePassword?: boolean
  showPw?: boolean
  onTogglePassword?: () => void
}) {
  return (
    <div>
      <label
        className="block text-xs font-semibold mb-1.5 tracking-wide uppercase"
        style={{ color: "#75615a", fontFamily: "'Open Sans', sans-serif" }}
      >
        {label}
      </label>
      <div className="relative">
        <div
          className="absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: "#a39585" }}
        >
          {icon}
        </div>
        <input
          type={togglePassword ? (showPw ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-11 pr-11 py-3 rounded-xl text-sm outline-none transition-all duration-200"
          style={{
            background: "#fffbf5",
            border: `1.5px solid ${error ? "#EF4444" : "#e8e0d8"}`,
            color: "#433b35",
            fontFamily: "'Open Sans', sans-serif",
            opacity: disabled ? 0.6 : 1,
          }}
          onFocus={(e) => {
            if (!error) e.currentTarget.style.borderColor = "#2a7a72"
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(1,63,71,0.07)"
          }}
          onBlur={(e) => {
            if (!error) e.currentTarget.style.borderColor = "#e8e0d8"
            e.currentTarget.style.boxShadow = "none"
          }}
        />
        {togglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5"
            style={{ color: "#a39585" }}
          >
            {showPw ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p
          className="mt-1 text-xs"
          style={{ color: "#EF4444", fontFamily: "'Open Sans', sans-serif" }}
        >
          {error}
        </p>
      )}
    </div>
  )
}

const colors = {
  primary500: "#013f47",
  primary400: "#2a7a72",
  primary100: "#c5e8e2",
  primary50: "#e8f5f3",
  secondary500: "#c85103",
  secondary300: "#fd8630",
  bgPrimary: "#fffbf5",
  bgCard: "#ffffff",
  earth300: "#a39585",
  earth400: "#75615a",
  earth600: "#5a4f47",
  earth700: "#433b35",
  error: "#EF4444",
  success: "#10B981",
}

const gradients = {
  accentBorder: "linear-gradient(90deg, #013f47, #2a7a72, #c85103)",
  primaryButton: "linear-gradient(135deg, #013f47, #054348)",
}

export function AuthScreen({
  view,
  marketingSlides,
  passwordRequirements,
  guestConversion,
  onLogin,
  onRegister,
  onForgotPassword,
  onResetPassword,
  onGuestConvert,
  onGoogleLogin,
  onNavigate,
  serverError,
}: AuthScreenProps) {
  // Brand name + tagline come from admin so a single edit propagates here
  // (login / register / forgot / reset / guest-conversion screens).
  const branding = useBranding()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState(
    view === "guest-conversion" ? guestConversion?.email || "" : ""
  )
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMessage(null)
    const newErrors: Record<string, string> = {}

    try {
      if (view === "login") {
        if (!email) newErrors.email = "Email is required"
        if (!password) newErrors.password = "Password is required"
        if (Object.keys(newErrors).length === 0) {
          await onLogin?.(email, password, rememberMe)
        }
      } else if (view === "register") {
        if (!name) newErrors.name = "Name is required"
        if (!email) newErrors.email = "Email is required"
        if (!password) newErrors.password = "Password is required"
        if (!agreeTerms)
          newErrors.terms = "You must agree to the Terms & Conditions"
        if (Object.keys(newErrors).length === 0) {
          await onRegister?.(name, email, password)
        }
      } else if (view === "forgot-password") {
        if (!email) newErrors.email = "Email is required"
        if (Object.keys(newErrors).length === 0) {
          await onForgotPassword?.(email)
          setSuccessMessage(
            "If an account exists with that email, you'll receive a reset link."
          )
        }
      } else if (view === "reset-password") {
        if (!password) newErrors.password = "Password is required"
        if (password !== confirmPassword)
          newErrors.confirmPassword = "Passwords do not match"
        if (Object.keys(newErrors).length === 0) {
          await onResetPassword?.(password)
        }
      } else if (view === "guest-conversion") {
        if (!password) newErrors.password = "Password is required"
        if (Object.keys(newErrors).length === 0) {
          await onGuestConvert?.(password)
        }
      }
    } catch (err: any) {
      newErrors.server = err?.message || "Something went wrong. Please try again."
    }

    setErrors(newErrors)
    setLoading(false)
  }

  const viewConfig: Record<
    AuthView,
    { title: string; subtitle: string; cta: string }
  > = {
    login: {
      title: "Welcome Back",
      subtitle: `Sign in to your ${branding.storeName} account`,
      cta: "Sign In",
    },
    register: {
      title: "Create Account",
      subtitle: `Join ${branding.storeName} and discover sacred living`,
      cta: "Create Account",
    },
    "forgot-password": {
      title: "Reset Password",
      subtitle: "Enter your email and we\u2019ll send you a reset link",
      cta: "Send Reset Link",
    },
    "reset-password": {
      title: "New Password",
      subtitle: "Choose a strong password for your account",
      cta: "Set New Password",
    },
    "guest-conversion": {
      title: "Save Your Account",
      subtitle:
        guestConversion?.message || "Create a password to keep your account",
      cta: "Create Account",
    },
  }

  const cfg = viewConfig[view]
  const displayError = serverError || errors.server

  return (
    <div className="min-h-screen flex" style={{ background: colors.bgPrimary }}>
      {/* Left — Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* Brand header — logo, name, and tagline all read from admin so a
              single edit (Storefront → Branding) updates this screen. */}
          <div className="mb-10 text-center">
            <img
              src={branding.logoUrl || "/VastuCartLogo.png"}
              alt={branding.storeName}
              className="h-16 w-auto mx-auto"
            />
            <h2
              className="mt-4 text-2xl font-bold tracking-tight"
              style={{
                fontFamily: "'Lora', serif",
                color: colors.primary500,
              }}
            >
              {branding.storeName}
              <span
                style={{
                  color: colors.secondary500,
                  fontSize: "0.6em",
                  verticalAlign: "super",
                }}
              >
                &reg;
              </span>{" "}
              <span style={{ color: colors.earth600 }}>Happy Homes</span>
            </h2>
            <p
              className="mt-1.5 text-sm tracking-wide"
              style={{
                color: colors.earth300,
                fontFamily: "'Open Sans', sans-serif",
              }}
            >
              {branding.tagline}
            </p>
          </div>

          {/* Form card */}
          <div className="relative">
            {/* Gradient accent border */}
            <div
              className="absolute -top-px left-6 right-6 h-[3px] rounded-t-xl"
              style={{ background: gradients.accentBorder }}
            />

            <div
              className="rounded-2xl p-8 sm:p-10"
              style={{
                background: colors.bgCard,
                boxShadow:
                  "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
                border: "1px solid #f0ebe4",
              }}
            >
              {/* Header */}
              <div className="mb-8">
                <h1
                  className="text-2xl sm:text-3xl font-semibold"
                  style={{
                    fontFamily: "'Lora', serif",
                    color: colors.primary500,
                  }}
                >
                  {cfg.title}
                </h1>
                <p
                  className="mt-2 text-sm"
                  style={{
                    color: colors.earth300,
                    fontFamily: "'Open Sans', sans-serif",
                  }}
                >
                  {cfg.subtitle}
                </p>
              </div>

              {/* Server error */}
              {displayError && (
                <div
                  className="mb-6 p-3 rounded-xl text-sm"
                  style={{
                    background: "#FEE2E2",
                    color: colors.error,
                    border: "1px solid #FECACA",
                    fontFamily: "'Open Sans', sans-serif",
                  }}
                >
                  {displayError}
                </div>
              )}

              {/* Success message */}
              {successMessage && (
                <div
                  className="mb-6 p-3 rounded-xl text-sm"
                  style={{
                    background: "#D1FAE5",
                    color: colors.success,
                    border: "1px solid #A7F3D0",
                    fontFamily: "'Open Sans', sans-serif",
                  }}
                >
                  {successMessage}
                </div>
              )}

              {/* Guest conversion order info */}
              {view === "guest-conversion" && guestConversion && (
                <div
                  className="mb-6 p-4 rounded-xl flex items-start gap-3"
                  style={{
                    background: colors.primary50,
                    border: `1px solid ${colors.primary100}`,
                  }}
                >
                  <CheckCircle2
                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                    style={{ color: colors.success }}
                  />
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{
                        color: colors.earth700,
                        fontFamily: "'Open Sans', sans-serif",
                      }}
                    >
                      Order {guestConversion.orderNumber} &mdash;{" "}
                      {guestConversion.orderTotal}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{
                        color: colors.earth400,
                        fontFamily: "'Open Sans', sans-serif",
                      }}
                    >
                      Set a password to track your order and earn loyalty points
                    </p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {view === "register" && (
                  <InputField
                    icon={<User className="w-4 h-4" />}
                    label="Full Name"
                    value={name}
                    onChange={setName}
                    error={errors.name}
                    placeholder="Priya Sharma"
                  />
                )}

                {view !== "reset-password" && (
                  <InputField
                    icon={<Mail className="w-4 h-4" />}
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    error={errors.email}
                    placeholder="you@example.com"
                    disabled={view === "guest-conversion"}
                  />
                )}

                {(view === "login" ||
                  view === "register" ||
                  view === "reset-password" ||
                  view === "guest-conversion") && (
                  <>
                    <InputField
                      icon={<Lock className="w-4 h-4" />}
                      label={
                        view === "reset-password" ? "New Password" : "Password"
                      }
                      value={password}
                      onChange={setPassword}
                      error={errors.password}
                      placeholder="Enter your password"
                      togglePassword
                      showPw={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                    />

                    {(view === "register" ||
                      view === "reset-password" ||
                      view === "guest-conversion") && (
                      <PasswordStrengthMeter
                        password={password}
                        requirements={passwordRequirements}
                      />
                    )}
                  </>
                )}

                {view === "reset-password" && (
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5 tracking-wide uppercase"
                      style={{
                        color: colors.earth400,
                        fontFamily: "'Open Sans', sans-serif",
                      }}
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div
                        className="absolute left-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: colors.earth300 }}
                      >
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="w-full pl-11 pr-11 py-3 rounded-xl text-sm outline-none transition-all"
                        style={{
                          background: colors.bgPrimary,
                          border: `1.5px solid ${errors.confirmPassword ? colors.error : "#e8e0d8"}`,
                          color: colors.earth700,
                          fontFamily: "'Open Sans', sans-serif",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5"
                        style={{ color: colors.earth300 }}
                      >
                        {showConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs" style={{ color: colors.error }}>
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                )}

                {/* Remember me + Forgot password */}
                {view === "login" && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center transition-all"
                        style={{
                          background: rememberMe
                            ? colors.primary500
                            : "transparent",
                          border: `1.5px solid ${rememberMe ? colors.primary500 : "#d1c9c0"}`,
                        }}
                        onClick={() => setRememberMe(!rememberMe)}
                      >
                        {rememberMe && (
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6L5 9L10 3"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className="text-sm"
                        style={{
                          color: colors.earth400,
                          fontFamily: "'Open Sans', sans-serif",
                        }}
                      >
                        Remember me
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => onNavigate?.("forgot-password")}
                      className="text-sm font-medium transition-colors"
                      style={{
                        color: colors.secondary500,
                        fontFamily: "'Open Sans', sans-serif",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = colors.secondary300)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = colors.secondary500)
                      }
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Terms & Conditions — register only */}
                {view === "register" && (
                  <div>
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <div
                        className="w-4 h-4 mt-0.5 rounded flex-shrink-0 flex items-center justify-center transition-all"
                        style={{
                          background: agreeTerms
                            ? colors.primary500
                            : "transparent",
                          border: `1.5px solid ${errors.terms ? colors.error : agreeTerms ? colors.primary500 : "#d1c9c0"}`,
                        }}
                        onClick={() => {
                          setAgreeTerms(!agreeTerms)
                          setErrors((prev) => {
                            const n = { ...prev }
                            delete n.terms
                            return n
                          })
                        }}
                      >
                        {agreeTerms && (
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6L5 9L10 3"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className="text-sm leading-snug"
                        style={{
                          color: colors.earth400,
                          fontFamily: "'Open Sans', sans-serif",
                        }}
                      >
                        I agree to the{" "}
                        <a
                          href="/terms"
                          className="font-semibold"
                          style={{ color: colors.primary500 }}
                        >
                          Terms &amp; Conditions
                        </a>{" "}
                        and{" "}
                        <a
                          href="/privacy-policy"
                          className="font-semibold"
                          style={{ color: colors.primary500 }}
                        >
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                    {errors.terms && (
                      <p
                        className="mt-1 ml-6 text-xs"
                        style={{
                          color: colors.error,
                          fontFamily: "'Open Sans', sans-serif",
                        }}
                      >
                        {errors.terms}
                      </p>
                    )}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 relative overflow-hidden"
                  style={{
                    background: gradients.primaryButton,
                    fontFamily: "'Open Sans', sans-serif",
                    opacity: loading ? 0.85 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading)
                      e.currentTarget.style.transform = "translateY(-1px)"
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(1,63,71,0.3)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {cfg.cta}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Social login */}
              {(view === "login" || view === "register") && (
                <div className="mt-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="flex-1 h-px"
                      style={{ background: "#e8e0d8" }}
                    />
                    <span
                      className="text-xs uppercase tracking-widest"
                      style={{
                        color: colors.earth300,
                        fontFamily: "'Open Sans', sans-serif",
                      }}
                    >
                      or
                    </span>
                    <div
                      className="flex-1 h-px"
                      style={{ background: "#e8e0d8" }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={onGoogleLogin}
                    className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-3 transition-all"
                    style={{
                      background: "transparent",
                      border: "1.5px solid #e8e0d8",
                      color: colors.earth600,
                      fontFamily: "'Open Sans', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.primary400
                      e.currentTarget.style.background = colors.primary50
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e8e0d8"
                      e.currentTarget.style.background = "transparent"
                    }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </button>
                </div>
              )}

              {/* Footer links */}
              <div className="mt-6 text-center">
                {view === "login" && (
                  <p
                    className="text-sm"
                    style={{
                      color: colors.earth400,
                      fontFamily: "'Open Sans', sans-serif",
                    }}
                  >
                    Don&apos;t have an account?{" "}
                    <button
                      onClick={() => onNavigate?.("register")}
                      className="font-semibold transition-colors"
                      style={{ color: colors.primary500 }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = colors.primary400)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = colors.primary500)
                      }
                    >
                      Create one
                    </button>
                  </p>
                )}
                {view === "register" && (
                  <p
                    className="text-sm"
                    style={{
                      color: colors.earth400,
                      fontFamily: "'Open Sans', sans-serif",
                    }}
                  >
                    Already have an account?{" "}
                    <button
                      onClick={() => onNavigate?.("login")}
                      className="font-semibold transition-colors"
                      style={{ color: colors.primary500 }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = colors.primary400)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = colors.primary500)
                      }
                    >
                      Sign in
                    </button>
                  </p>
                )}
                {view === "forgot-password" && (
                  <button
                    onClick={() => onNavigate?.("login")}
                    className="text-sm font-medium transition-colors"
                    style={{
                      color: colors.primary500,
                      fontFamily: "'Open Sans', sans-serif",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = colors.primary400)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = colors.primary500)
                    }
                  >
                    Back to sign in
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Marketing Panel (desktop only) */}
      <div className="hidden lg:block lg:w-1/2">
        <MarketingPanel slides={marketingSlides} />
      </div>
    </div>
  )
}
