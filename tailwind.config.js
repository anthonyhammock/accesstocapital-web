/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // BlissPoint Access — Graphite & Platinum palette.
        // Token names (navy/gold/offwhite/lightgray) are kept as-is even
        // though the values no longer describe navy or gold, so every
        // existing text-navy/bg-gold/etc. class across the app picks up
        // the new brand colors without a sitewide class rename.
        navy: '#1A1817',      // Warm Black (was navy blue)
        gold: '#7A6B4C',      // Brass Whisper (was gold) — accent, used sparingly.
                               // Darkened from #8A7B5C: that shade measured ~4.14:1
                               // against white, under the 4.5:1 AA floor for text.
                               // This value holds ~5.2:1.
        offwhite: '#F7F4EF',  // Ivory White
        lightgray: '#E5E0D5', // platinum-tinted hairline borders
        platinum: '#C9C0B3',  // Platinum Champagne — dark-background accent/hairlines
        graphite: '#3A342E',  // Espresso Graphite — dark-background mid-tone

        // Semantic colors (for status messages)
        success: '#2d7a3e',
        error: '#c41e3a',
        neutral: '#7D766C',
      },
      fontFamily: {
        garamond: ['Garamond', 'Georgia', 'serif'],
        inter: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      spacing: {
        // Luxury brands use generous spacing
        '8xl': '80px',
        '9xl': '100px',
        '10xl': '120px',
      },
    },
  },
  plugins: [],
}
