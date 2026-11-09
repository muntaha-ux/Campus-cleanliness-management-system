import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/web/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/presentation/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--surface-bg)",
        foreground: "var(--text-primary)",
        // BAUST Green Palette (Army & Forest Green)
        baust: {
          primary: {
            950: "#041B0F",
            900: "#072A18", // Deep Cantonment Forest Green
            800: "#09381F",
            700: "#0B4627", // Official BAUST Crest Green
            600: "#126137", // Interactive Hover Green
            500: "#1A7C48",
            400: "#2FA264",
            300: "#60C88E",
            200: "#A3E5C0",
            100: "#D3F5E1",
            50: "#ECFDF3",  // Soft Mint Tint
          },
          // BAUST Crest Gold / Amber Accents
          gold: {
            700: "#8C6E12",
            600: "#B59024", // Warm Metallic Gold
            500: "#D4AF37", // Official BAUST Crest Gold
            400: "#E3C55D",
            300: "#EEDB88",
            200: "#F6ECB8",
            100: "#FAF5D8",
            50: "#FEFCE8",  // Warm Ivory Gold
          },
        },
        surface: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "Plus Jakarta Sans", "sans-serif"],
        serif: ["var(--font-serif)", "Merriweather", "Georgia", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        disciplined: "0 1px 3px 0 rgba(7, 42, 24, 0.06), 0 1px 2px -1px rgba(7, 42, 24, 0.04)",
        military: "0 4px 6px -1px rgba(7, 42, 24, 0.1), 0 2px 4px -2px rgba(7, 42, 24, 0.08)",
        gold: "0 0 15px -2px rgba(212, 175, 55, 0.35)",
      },
      borderColor: {
        gold: "#D4AF37",
      },
    },
  },
  plugins: [],
};
export default config;
