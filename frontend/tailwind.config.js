/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0083D4', // Primary color
          foreground: '#ffffff',
          light: '#87CEEB', // Keeping existing light sky blue for primary
          dark: '#009ACD', // Keeping existing dodger blue for primary
        },
        secondary: { /* Light Electric Purple */
          DEFAULT: '#BA55D3', // Medium Orchid as default light electric purple
          foreground: '#ffffff',
          light: '#BA55D3', // Explicitly setting light to the same for now
          dark: '#8A2BE2', // Keeping existing blue violet for secondary
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
      },
      boxShadow: {
        'glow': '0 0 10px 2px rgba(15, 121, 187, 0.7)', /* New primary color glow */
        'header': '0 4px 6px -1px rgba(15, 121, 187, 0.3)', /* New primary color for header shadow */
        'button-glow': '0 0 15px rgba(186, 85, 211, 0.5)', /* New secondary color for button glow */
      },
    },
  },
  plugins: [],
}
