export const theme = {
  modes: {
    light: {
      primary: "#2563EB",
      primaryHover: "#1D4ED8",
      background: "#F9FAFB",
      surface: "#FFFFFF",
      sidebar: "#111827",
      border: "#E5E7EB",
      success: "#10B981",
      warning: "#F59E0B",
      danger: "#EF4444",
      foreground: "#0F172A",
      muted: "#64748B",
      sidebarForeground: "#E2E8F0",
    },
    dark: {
      primary: "#3B82F6",
      primaryHover: "#60A5FA",
      background: "#0B1220",
      surface: "#111827",
      sidebar: "#020617",
      border: "#1F2937",
      success: "#34D399",
      warning: "#FBBF24",
      danger: "#F87171",
      foreground: "#E2E8F0",
      muted: "#94A3B8",
      sidebarForeground: "#CBD5E1",
    },
  },
  radius: {
    card: "16px",
    md: "12px",
    sm: "10px",
  },
  motion: {
    fast: "all 0.2s ease",
  },
} as const;

export type LogFlowTheme = typeof theme;
