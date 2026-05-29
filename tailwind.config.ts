import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: "#171717",
        sidebarHover: "#2a2a2a",
        chatbg: "#212121",
        userbubble: "#2f2f2f",
      },
    },
  },
  plugins: [],
};

export default config;
