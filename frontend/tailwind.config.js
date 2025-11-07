/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#20B2AA',
          foreground: '#ffffff',
          light: '#48D1CC',
          dark: '#008B8B',
        },
        secondary: {
          DEFAULT: '#FFD700',
          foreground: '#000000',
          light: '#FFFF99',
          dark: '#DAA520',
        },
        accent: {
          DEFAULT: '#40E0D0',
          foreground: '#000000',
          light: '#7FFFD4',
          dark: '#00CED1',
        },
        darkblue: {
          DEFAULT: '#0A1A2F',
          light: '#1E2A3F',
          dark: '#051525',
        },
        turquoise: {
          DEFAULT: '#0097B2',
          50: '#E6F7FA',
          100: '#CCEFF5',
          200: '#99DFEB',
          300: '#66CFE1',
          400: '#33BFD7',
          500: '#0097B2',
          600: '#007A92',
          700: '#005D72',
          800: '#004052',
          900: '#002332',
        },
      },
      boxShadow: {
        'glow': '0 0 10px 2px rgba(32, 178, 170, 0.7)',
        'header': '0 4px 6px -1px rgba(0, 139, 139, 0.3)',
        'button-glow': '0 0 15px rgba(32, 178, 170, 0.5)',
      },
    },
  },
  plugins: [],
}
