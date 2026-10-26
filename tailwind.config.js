/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF5400', // AhaMove iconic orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        sidebar: {
          bg: '#1E293B',
          hover: '#334155',
          active: '#0F172A',
          border: '#334155',
          text: '#94A3B8',
          textActive: '#FFFFFF',
        }
      },
    },
  },
  plugins: [],
}
