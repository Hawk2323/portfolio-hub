import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 18px 60px rgba(25, 35, 52, 0.12)"
      },
      colors: {
        ink: "#182033",
        mist: "#f5f7fb",
        pine: "#1f6b5d",
        coral: "#d95f4f"
      }
    }
  },
  plugins: []
};

export default config;
