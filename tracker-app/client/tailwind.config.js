/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'ibm-blue': '#0f62fe',
        'ibm-blue-dark': '#0043ce',
        'ibm-blue-light': '#4589ff',
        'ibm-gray': '#f4f4f4',
        'ibm-gray-10': '#f4f4f4',
        'ibm-gray-20': '#e0e0e0',
        'ibm-gray-50': '#8d8d8d',
        'ibm-gray-90': '#262626',
        'ibm-text': '#161616',
        'ibm-white': '#ffffff',
        'ibm-red': '#da1e28',
        'ibm-green': '#198038',
        'ibm-yellow': '#f1c21b',
        'ibm-orange': '#ff832b',
        'ibm-purple': '#8a3ffc',
        'ibm-teal': '#007d79',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
