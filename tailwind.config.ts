import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar:       "#0d0d0d",
        sidebarBorder: "#1a1a1a",
        sidebarHover:  "#181818",
        chatbg:        "#0a0a0a",
        surface:       "#141414",
        surfaceHover:  "#1c1c1c",
        surfaceBorder: "#242424",
        userbubble:    "#1e1e1e",
        accent: {
          DEFAULT: "#7c3aed",
          light:   "#8b5cf6",
          dim:     "rgba(124,58,237,0.12)",
          glow:    "rgba(124,58,237,0.22)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "user-bubble":     "linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)",
        "accent-gradient": "linear-gradient(135deg, #7c3aed, #6d28d9)",
      },
      boxShadow: {
        "accent-sm": "0 0 12px rgba(124,58,237,0.18)",
        "accent-md": "0 0 24px rgba(124,58,237,0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
