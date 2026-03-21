/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ── Shop+ / AmCart Theme Tokens ──
        gold: {
          DEFAULT: '#dccc99',
          dark: '#c4b57a',
          light: '#f0e8d0',
        },
        dark: {
          DEFAULT: '#060606',
          2: '#212224',
        },
        // Keep existing brand colors for backwards compat
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a5f',
        },
      },
      fontFamily: {
        sans: ['"Open Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};