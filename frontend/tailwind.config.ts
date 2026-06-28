import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f4ff",
          100: "#dde6ff",
          500: "#4f6ef7",
          600: "#3b55e8",
          700: "#2d44cc",
          900: "#1a2870",
        },
      },
    },
  },
  plugins: [],
};

export default config;
