/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0F',
        surface: '#13131A',
        border: '#1E1E2E',
        accent: '#7C3AED',
        'accent-light': '#A78BFA',
        primary: '#F8F8FF',
        secondary: '#94A3B8',
        success: '#10B981',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Bricolage Grotesque', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
