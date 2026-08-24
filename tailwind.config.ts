import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          500: "#2f6fed",
          600: "#1f57d6",
          700: "#1a47ad",
        },
        // v1.4 设计系统底座（语义令牌）
        page: "#f6f8fb",
        surface: "#ffffff",
        "surface-2": "#f1f5f9",
        line: "#e6ebf1",
        "line-strong": "#cdd6e0",
        ink: {
          1: "#0f172a",
          2: "#475569",
          3: "#94a3b8",
        },
        err: "#dc2626",
        warn: "#d97706",
        info: "#2563eb",
        ok: "#16a34a",
      },
      boxShadow: {
        card: "0 6px 18px rgba(15,23,42,.07)",
        "card-sm": "0 1px 2px rgba(15,23,42,.05)",
      },
    },
  },
  plugins: [],
};

export default config;
