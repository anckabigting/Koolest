/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./public/**/*.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brandPrimary: '#0d413f',
        brandPrimaryHover: '#145c58',
        brandAccent: '#38bdf8', // Adjust your exact accent hex here
        brandAccentHover: '#0284c7',
        brandDark: '#082b2a',
        brandLight: '#e0f2fe',
      },
      fontFamily: {
        heading: ['Righteous', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'marquee': 'marquee 25s linear infinite',
      }
    },
  },
  plugins: [],
}