import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar:       "#000814",
        sidebarBorder: "#001428",
        sidebarHover:  "#000d1a",
        chatbg:        "#000814",
        surface:       "#000d1a",
        surfaceHover:  "#001428",
        surfaceBorder: "rgba(0,212,255,0.15)",
        userbubble:    "#001e3c",
        "jarvis-cyan": "#00d4ff",
        "jarvis-blue": "#0066ff",
        "jarvis-text": "#e0f4ff",
        "jarvis-dim":  "#4a9ebb",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "user-bubble": "linear-gradient(135deg, #0066ff 0%, #00d4ff 100%)",
        "jarvis-gradient": "linear-gradient(135deg, #00d4ff, #0066ff)",
      },
      boxShadow: {
        "cyan-sm":  "0 0 14px rgba(0,212,255,0.25)",
        "cyan-md":  "0 0 28px rgba(0,212,255,0.4)",
        "cyan-lg":  "0 0 50px rgba(0,212,255,0.6)",
        "blue-sm":  "0 0 14px rgba(0,102,255,0.25)",
      },
      animation: {
        "spin-slow":   "spin 4s linear infinite",
        "fade-in-up":  "fade-in-up 0.22s ease",
        "glow-pulse":  "glow-pulse 2.5s ease-in-out infinite",
        "bounce-dot":  "bounce-dot 1.4s ease-in-out infinite",
      },
      keyframes: {
        "fade-in-up": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%":      { opacity: "1" },
        },
        "bounce-dot": {
          "0%, 100%": { opacity: "0.2", transform: "translateY(0)" },
          "50%":      { opacity: "1",   transform: "translateY(-3px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
