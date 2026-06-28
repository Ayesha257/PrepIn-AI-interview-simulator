/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // PrepIn color palette — from Uxintace color card
        navy:    "#1B1931",   // darkest — primary bg for cards
        purple:  "#44174E",   // deep purple — sidebar, accents
        wine:    "#662249",   // wine red — hover states
        rose:    "#A34054",   // muted rose — buttons, highlights
        amber:   "#ED9E59",   // warm amber — CTAs, active states
        blush:   "#E98CB9",   // soft blush — success states, tags
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Syne", "sans-serif"],
      },
      backgroundImage: {
        "prepin-gradient": "linear-gradient(135deg, #ED9E59 0%, #662249 50%, #1B1931 100%)",
        "card-gradient": "linear-gradient(180deg, #44174E 0%, #1B1931 100%)",
      },
      boxShadow: {
        "glow-amber": "0 0 24px rgba(237, 158, 89, 0.25)",
        "glow-rose": "0 0 20px rgba(163, 64, 84, 0.3)",
      }
    },
  },
  plugins: [],
}