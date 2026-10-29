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
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#38a5f6',
          500: '#2563eb', // Clean corporate logistics blue
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',
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
