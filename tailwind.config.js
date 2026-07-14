/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0E14",
        panel: "#131826",
        border: "#212B3D",
        text: "#E6EDF3",
        muted: "#7D8CA3",
        accent: "#3DDC97",
        sev: {
          critical: "#E5484D",
          high: "#F2994A",
          medium: "#F2C94C",
          low: "#56CCF2",
          info: "#7D8CA3",
        },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
      },
      animation: {
        scanline: "scanline 1.6s ease-in-out forwards",
      },
    },
  },
  plugins: [],
};
