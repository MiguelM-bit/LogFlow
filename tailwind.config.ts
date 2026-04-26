import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
        },
        app: {
          background: "#F9FAFB",
          surface: "#FFFFFF",
          sidebar: "#111827",
          border: "#E5E7EB",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      spacing: {
        "128": "32rem",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};

export default config;
