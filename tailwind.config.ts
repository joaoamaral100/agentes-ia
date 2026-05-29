import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar:       "#080808",
        sidebarBorder: "#161616",
        sidebarHover:  "#131313",
        chatbg:        "#0a0a0a",
        surface:       "#111111",
        surfaceHover:  "#181818",
        surfaceBorder: "#1e1e1e",
        userbubble:    "#1e1e1e",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "user-bubble":     "linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)",
        "accent-gradient": "linear-gradient(135deg, #7c3aed, #06b6d4)",
        "glass-gradient":  "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
      },
      boxShadow: {
        "accent-sm":  "0 0 14px rgba(124,58,237,0.2)",
        "accent-md":  "0 0 28px rgba(124,58,237,0.3)",
        "cyan-sm":    "0 0 14px rgba(6,182,212,0.2)",
        "orange-sm":  "0 0 14px rgba(249,115,22,0.2)",
        "glass":      "inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.4)",
      },
      animation: {
        "spin-slow":    "spin 4s linear infinite",
        "gradient-x":  "gradient-x 5s ease infinite",
        "fade-in-up":  "fade-in-up 0.25s ease",
        "glow-pulse":  "glow-pulse 3s ease-in-out infinite",
        "bounce-dot":  "bounce-dot 1.4s ease-in-out infinite",
      },
      keyframes: {
        "gradient-x": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%":       { "background-position": "100% 50%" },
        },
        "fade-in-up": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%":      { opacity: "1" },
        },
        "bounce-dot": {
          "0%, 100%": { opacity: "0.15", transform: "translateY(0)" },
          "50%":      { opacity: "0.8",  transform: "translateY(-3px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
