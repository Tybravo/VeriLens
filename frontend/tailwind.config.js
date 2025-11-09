/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { /* Deep Sky Blue */
          DEFAULT: '#00BFFF',
          foreground: '#ffffff',
          light: '#87CEEB', /* Light Sky Blue */
          dark: '#009ACD', /* Dodger Blue */
        },
        secondary: { /* Vivid Purple */
          DEFAULT: '#9932CC',
          foreground: '#ffffff',
          light: '#BA55D3', /* Medium Orchid */
          dark: '#8A2BE2', /* Blue Violet */
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
        // Removed turquoise as it's replaced by primary/secondary colors
      },
      boxShadow: {
        'glow': '0 0 10px 2px rgba(0, 191, 255, 0.7)', /* Deep Sky Blue glow */
        'header': '0 4px 6px -1px rgba(0, 139, 139, 0.3)',
        'button-glow': '0 0 15px rgba(0, 191, 255, 0.5)', /* Deep Sky Blue button glow */
      },
    },
  },
  plugins: [],
}
