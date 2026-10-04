import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          0: "var(--ink-0)",
          1: "var(--ink-1)",
          2: "var(--ink-2)",
        },
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
        },
        fg: {
          DEFAULT: "var(--fg)",
          muted: "var(--fg-muted)",
          subtle: "var(--fg-subtle)",
        },
        signal: {
          DEFAULT: "var(--signal)",
          press: "var(--signal-press)",
        },
        background: "#070A0F",
        card: {
          DEFAULT: "#0F141F",
          foreground: "#F8FAFC",
          hover: "#141C2B",
          border: "#1E293B",
        },
        brand: {
          cyan: "#1cf7fd",
          teal: "#1cf7fd",
          emerald: "#1cf7fd",
          neon: "#1cf7fd",
          dark: "#05080E",
          surface: "#0A0F1D",
        },
        status: {
          pending: "#EAB308",
          approved: "#1cf7fd",
          rejected: "#EF4444",
          paused: "#64748B",
        }
      },
      boxShadow: {
        // Elevation, not halos: offset + soft blur (craft floor: depth)
        glow: "0 1px 2px rgba(0, 0, 0, 0.4), 0 8px 24px -8px rgba(0, 0, 0, 0.6)",
        "glow-emerald": "0 1px 2px rgba(0, 0, 0, 0.4), 0 8px 24px -8px rgba(0, 0, 0, 0.6)",
        raised: "0 1px 2px rgba(0, 0, 0, 0.4), 0 8px 24px -8px rgba(0, 0, 0, 0.6)",
        overlay: "0 2px 4px rgba(0, 0, 0, 0.4), 0 24px 48px -12px rgba(0, 0, 0, 0.7)",
      },
    },
  },
  plugins: [],
};
export default config;
