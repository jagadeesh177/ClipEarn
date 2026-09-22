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
      colors: {
        background: "#070A0F",
        card: {
          DEFAULT: "#0F141F",
          foreground: "#F8FAFC",
          hover: "#141C2B",
          border: "#1E293B",
        },
        brand: {
          cyan: "#00F2FE",
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
        glow: "0 0 25px -5px rgba(28, 247, 253, 0.35)",
        "glow-emerald": "0 0 25px -5px rgba(28, 247, 253, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
