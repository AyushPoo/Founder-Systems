/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    orange: '#FF5F15',
                    'orange-dark': '#a93800',
                    black: '#1A1A1A',
                    cream: '#FDFBF7',
                },
                surface: {
                    DEFAULT: '#fbf9f5',
                    low: '#f5f3ef',
                    container: '#efeeea',
                    high: '#eae8e4',
                    highest: '#e4e2de',
                    lowest: '#ffffff',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            boxShadow: {
                'soft': '0 20px 40px -10px rgba(26,26,26,0.1)',
                'ambient': '0 20px 40px rgba(27, 28, 26, 0.06)',
                'ambient-lg': '0 30px 60px rgba(27, 28, 26, 0.1)',
                'card-hover': '0 25px 50px rgba(27, 28, 26, 0.12)',
            },
            letterSpacing: {
                'tight-brand': '-0.04em',
            },
            animation: {
                'fade-up': 'fadeUp 0.7s ease-out forwards',
                'fade-in': 'fadeIn 0.6s ease-out forwards',
                'slide-in-right': 'slideInRight 0.7s ease-out forwards',
                'float': 'float 6s ease-in-out infinite',
                'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
            },
            keyframes: {
                fadeUp: {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(40px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-12px)' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '0.4' },
                    '50%': { opacity: '0.8' },
                },
            },
            backgroundImage: {
                'gradient-cta': 'linear-gradient(135deg, #ff5f15 0%, #a93800 100%)',
                'gradient-cta-hover': 'linear-gradient(135deg, #ff7a3d 0%, #c44500 100%)',
            },
        },
    },
    plugins: [],
}
