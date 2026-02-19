// VastuCart Design System — centralized theme tokens
// Consumed by all shell and UI components

export const primary: Record<string, string> = {
  50: "#e8f5f3",
  100: "#c5e8e2",
  200: "#71c1ae",
  300: "#4a9a8d",
  400: "#2a7a72",
  500: "#013f47",
  600: "#054348",
  700: "#084b49",
  800: "#064645",
  900: "#112b2c",
}

export const secondary: Record<string, string> = {
  50: "#fff5ed",
  100: "#ffc187",
  200: "#f6be9a",
  300: "#fd8630",
  400: "#d04f28",
  500: "#c85103",
  600: "#9a3535",
  700: "#7c2d2d",
  800: "#562c2c",
  900: "#3d1f1f",
}

export const earth: Record<string, string> = {
  300: "#a39585",
  400: "#75615a",
  500: "#71685b",
  600: "#5a4f47",
  700: "#433b35",
}

export const bg = {
  primary: "#fffbf5",
  card: "#ffffff",
  subtle: "#f5dfbb",
  warm: "#ffc187",
}

export const semantic = {
  success: "#10B981",
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEE2E2",
}

export const gradients = {
  accentBorder: "linear-gradient(90deg, #013f47, #2a7a72, #c85103)",
  primaryButton: "linear-gradient(135deg, #013f47, #054348)",
  secondaryButton: "linear-gradient(135deg, #c85103, #d06028)",
  header: "linear-gradient(135deg, #013f47, #054348)",
  footer: "linear-gradient(180deg, #013f47, #012d33)",
}

export const fonts = {
  heading: "'Lora', serif",
  body: "'Open Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
}

export const shadows = {
  card: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
  cardHover: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
  glowPrimary: "0 0 10px rgba(1, 63, 71, 0.25)",
  glowSecondary: "0 0 10px rgba(200, 81, 3, 0.25)",
}
