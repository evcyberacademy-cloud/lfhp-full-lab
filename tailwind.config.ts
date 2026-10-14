import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: "#080c14",
          darker: "#04070d",
          card: "#0d1424",
          panel: "#0f172a",
          border: "#1e293b",
          cyan: "#00f0ff",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
          purple: "#a855f7",
          blue: "#3b82f6",
        },
        terminal: {
          bg: "#0c1017",
          header: "#141c2b",
          text: "#e2e8f0",
          prompt: "#00f0ff",
          user: "#10b981",
          host: "#3b82f6",
          dir: "#38bdf8",
          error: "#f87171",
          success: "#4ade80",
          warn: "#fbbf24",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-fira-code)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        "cyber-glow": "0 0 20px -5px rgba(0, 240, 255, 0.3)",
        "cyber-glow-emerald": "0 0 20px -5px rgba(16, 185, 129, 0.3)",
        "window": "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        "window-active": "0 25px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(0, 240, 255, 0.25), 0 0 30px -10px rgba(0, 240, 255, 0.2)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scanline": "scanline 8s linear infinite",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        }
      }
    },
  },
  plugins: [],
};
export default config;
