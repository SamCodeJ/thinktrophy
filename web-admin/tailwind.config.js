/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue:  '#0984E3',
          teal:  '#00CEC9',
          dark:  '#1E272E',
          darker:'#151D23',
          card:  '#232F38',
          light: '#F5F6FA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #0984E3, #00CEC9)',
      },
    },
  },
  plugins: [],
};
