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
                    black: '#1A1A1A',
                    cream: '#FDFBF7',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            boxShadow: {
                'soft': '0 20px 40px -10px rgba(26,26,26,0.1)',
            }
        },
    },
    plugins: [],
}
