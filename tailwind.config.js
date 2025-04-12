/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        'primary-dark': 'var(--primary-dark)',
        'primary': 'var(--primary)',
        'primary-light': 'var(--primary-light)',
        'accent': 'var(--accent)',
        'accent-light': 'var(--accent-light)',
        'card': {
          bg: 'var(--card-bg)',
          border: 'var(--card-border)',
        },
        'input': {
          bg: 'var(--input-bg)',
          border: 'var(--input-border)',
        },
        'table': {
          'head': 'var(--table-head-bg)',
          'row-hover': 'var(--table-row-hover)',
        },
      },
      backgroundColor: {
        'page': 'var(--background)',
      },
      textColor: {
        'page': 'var(--foreground)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
    },
  },
  plugins: [],
}; 