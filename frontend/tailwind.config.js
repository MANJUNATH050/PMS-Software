/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pms: {
          green: '#6FC04A',
          gray: '#3A3A3A',
          darkGreen: '#4A7637',
          lightGreen: '#EBF7E7',
          border: '#E2E8F0',
          bg: '#F8FAFC',
          card: '#FFFFFF',
          textMuted: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
