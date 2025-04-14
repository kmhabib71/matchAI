/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "100%",
            color: "var(--foreground)",
            a: {
              color: "var(--purple-600)",
              "&:hover": {
                color: "var(--purple-700)",
              },
            },
            h1: {
              color: "var(--foreground)",
            },
            h2: {
              color: "var(--foreground)",
            },
            h3: {
              color: "var(--foreground)",
            },
            h4: {
              color: "var(--foreground)",
            },
            blockquote: {
              borderLeftColor: "var(--purple-300)",
            },
            hr: {
              borderColor: "var(--gray-200)",
            },
            pre: {
              backgroundColor: "var(--gray-800)",
              color: "var(--gray-200)",
            },
            code: {
              color: "var(--purple-600)",
              backgroundColor: "var(--gray-100)",
              borderRadius: "0.25rem",
              padding: "0.125rem 0.25rem",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
