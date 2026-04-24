import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1a3de8",
        "primary-dark": "#1230c0",
        "primary-light": "#3355ff",
        "primary-50": "#eef0fd",
        "primary-100": "#d6dbfb",
        accent: "#e8211a",
        "node-agent": "#e86b1a",
        "node-ds": "#1ab854",
        "node-club": "#e8211a",
        "node-player": "#1a3de8",
        "node-intermediary": "#7c1ae8",
      },
      fontFamily: {
        condensed: ["var(--font-barlow-condensed)", "sans-serif"],
        body: ["var(--font-barlow)", "sans-serif"],
      },
      fontSize: {
        "stat": ["3.5rem", { lineHeight: "1", fontWeight: "800" }],
        "stat-sm": ["2.5rem", { lineHeight: "1", fontWeight: "800" }],
      },
    },
  },
  plugins: [],
};
export default config;
