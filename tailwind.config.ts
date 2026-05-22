import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      colors: {
        emerald: {
          900: "#2a1f1b", // deep chocolate
          800: "#4a342c", // warm brown
          700: "#6d4c41",
          600: "#8b5e4f",
          500: "#b08968",
        },

        lax: {
          black: "#12100e",
          brown: "#2a1f1b",
          mocha: "#4a342c",
          sand: "#b08968",
          cream: "#ede9e2",
        },
      },
    },
  },

  plugins: [],
};

export default config;