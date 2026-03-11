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
}
      },
    },
  },
  plugins: [],
};

export default config;