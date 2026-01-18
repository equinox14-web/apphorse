/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["selector", "[data-mode=\"dark\"]"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: 'var(--color-primary)',
                'primary-light': 'var(--color-primary-light)',
                bg: 'var(--color-bg)',
                'text-main': 'var(--color-text-main)',
                'text-muted': 'var(--color-text-muted)',
                'border-color': 'var(--border-color)',
                'card-bg': 'var(--card-bg)',
            }
        },
    },
    plugins: [],
}
