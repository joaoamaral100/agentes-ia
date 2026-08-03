import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // ── Colors ──────────────────────────────────────────────────────────────
    colors: {
      transparent: "transparent",
      current:     "currentColor",
      white:       "#FFFFFF",

      slate: {
        100: "#F1F5F9",
        200: "#E2E8F0",
        300: "#CBD5E1",
        400: "#94A3B8",
        600: "#64748B",
        700: "#475569",
        800: "#334155",
        900: "#1E293B",
        950: "#0F172A",
      },

      cyan:    { 500: "#0EA5E9" },
      emerald: { 500: "#10B981" },
      red:     { 500: "#EF4444" },
      amber:   { 500: "#F59E0B" },
      blue:    { 500: "#3B82F6" },
    },

    // ── Typography ───────────────────────────────────────────────────────────
    fontSize: {
      xs:   ["12px", { lineHeight: "1.5", fontWeight: "500" }],
      sm:   ["14px", { lineHeight: "1.6", fontWeight: "400" }],
      base: ["16px", { lineHeight: "1.6", fontWeight: "400" }],
      lg:   ["18px", { lineHeight: "1.5", fontWeight: "500" }],
      xl:   ["20px", { lineHeight: "1.5", fontWeight: "600" }],
      "2xl":["24px", { lineHeight: "1.4", fontWeight: "600" }],
      "3xl":["28px", { lineHeight: "1.4", fontWeight: "600" }],
      "4xl":["32px", { lineHeight: "1.3", fontWeight: "600" }],
      "5xl":["36px", { lineHeight: "1.3", fontWeight: "600" }],
      "6xl":["48px", { lineHeight: "1.2", fontWeight: "700" }],
    },

    // ── Spacing ──────────────────────────────────────────────────────────────
    spacing: {
      px:  "1px",
      0:   "0px",
      0.5: "2px",
      1:   "4px",
      2:   "8px",
      3:   "12px",
      4:   "16px",
      6:   "24px",
      8:   "32px",
      12:  "48px",
      16:  "64px",
      20:  "80px",
      24:  "96px",
      28:  "112px",
      32:  "128px",
      36:  "144px",
      40:  "160px",
      44:  "176px",
      48:  "192px",
      52:  "208px",
      56:  "224px",
      60:  "240px",
      64:  "256px",
      72:  "288px",
      80:  "320px",
      96:  "384px",
    },

    // ── Border radius ────────────────────────────────────────────────────────
    borderRadius: {
      none: "0px",
      sm:   "4px",
      DEFAULT: "6px",
      md:   "8px",
      lg:   "12px",
      full: "9999px",
    },

    // ── Box shadow ───────────────────────────────────────────────────────────
    boxShadow: {
      none: "none",
      sm:   "0 1px 2px 0 rgba(0,0,0,0.05)",
      DEFAULT: "0 1px 3px 0 rgba(0,0,0,0.1)",
      md:   "0 4px 6px -1px rgba(0,0,0,0.1)",
      lg:   "0 10px 15px -3px rgba(0,0,0,0.1)",
      xl:   "0 20px 25px -5px rgba(0,0,0,0.1)",
    },

    // ── Transition duration ──────────────────────────────────────────────────
    transitionDuration: {
      DEFAULT: "200ms",
      75:  "75ms",
      100: "100ms",
      150: "150ms",
      200: "200ms",
      300: "300ms",
      500: "500ms",
      700: "700ms",
    },

    extend: {
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },

      // Keep existing JARVIS design tokens so legacy components don't break
      colors: {
        sidebar:        "#000814",
        sidebarBorder:  "#001428",
        sidebarHover:   "#000d1a",
        chatbg:         "#000814",
        surface:        "#000d1a",
        surfaceHover:   "#001428",
        surfaceBorder:  "rgba(0,212,255,0.15)",
        userbubble:     "#001e3c",
        "jarvis-cyan":  "#00d4ff",
        "jarvis-blue":  "#0066ff",
        "jarvis-text":  "#e0f4ff",
        "jarvis-dim":   "#4a9ebb",
      },

      backgroundImage: {
        "user-bubble":     "linear-gradient(135deg, #0066ff 0%, #00d4ff 100%)",
        "jarvis-gradient": "linear-gradient(135deg, #00d4ff, #0066ff)",
      },

      animation: {
        "spin-slow":  "spin 4s linear infinite",
        "fade-in-up": "fade-in-up 0.22s ease",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
        "bounce-dot": "bounce-dot 1.4s ease-in-out infinite",
      },

      keyframes: {
        "fade-in-up": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%":      { opacity: "1"   },
        },
        "bounce-dot": {
          "0%, 100%": { opacity: "0.2", transform: "translateY(0)"    },
          "50%":      { opacity: "1",   transform: "translateY(-3px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
