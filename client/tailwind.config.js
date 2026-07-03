/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#3d5a99', // Tripod Navy Blue (from logo)
                secondary: '#1e293b', // Dark Navy
                accent: '#5a7bc4', // Lighter Blue accent
            }
        },
    },
    plugins: [],
}
