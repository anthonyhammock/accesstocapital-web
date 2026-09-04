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
        // Cartier primary colors
        navy: '#1a1f36',
        gold: '#d4af37',
        offwhite: '#f8f7f2',
        lightgray: '#e8e6e0',
        
        // Semantic colors (for status messages)
        success: '#2d7a3e',
        error: '#c41e3a',
        neutral: '#888888',
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
