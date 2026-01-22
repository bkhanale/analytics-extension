export default {
    plugins: {
        '@tailwindcss/postcss': {},
        autoprefixer: {}, // autoprefixer is actually included in tailwindcss v4 usually, but keeping it is fine or removing it. V4 handles prefixing relevant to browserslist.
    },
}
