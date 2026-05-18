/** @type {import('postcss-load-config').Config} */
const config = {
  root: __dirname,
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

module.exports = config;
