import colors from 'tailwindcss/colors';

// Brand scale sampled from the Talwin AquaRay logo's water drop (#1F8FC8).
const brand = {
  50: '#eef8fc',
  100: '#d6eef8',
  200: '#addcf0',
  300: '#79c3e5',
  400: '#3fa6d6',
  500: '#1f8fc8',
  600: '#1678ae',
  700: '#12618d',
  800: '#134f72',
  900: '#14425e',
  950: '#0b2a3e',
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand,
        // One accent across the app: the per-section blues, teals, oranges and
        // purples Bolt generated all resolve to the brand scale.
        blue: brand,
        teal: brand,
        cyan: brand,
        orange: brand,
        purple: brand,
        indigo: brand,
        // Cool neutrals that sit with the brand hue.
        gray: colors.slate,
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
      },
    },
  },
  plugins: [],
};
