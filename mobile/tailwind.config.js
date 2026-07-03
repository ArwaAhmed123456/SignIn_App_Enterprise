module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: '#2b4594', // Corporate Blue
                secondary: '#1e293b', // Dark Navy
                // accent: '#60a5fa', // Soft Blue
            }
        },
    },
    plugins: ["nativewind/babel"],
};
