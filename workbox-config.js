module.exports = {
  globDirectory: 'dist/',
  // Spunem să salveze absolut tot (html, js, css, imagini, sunete)
  globPatterns: [
    '**/*.{html,js,css,woff2,png,jpg,svg,mp3,wav,json}'
  ],
  swDest: 'dist/sw.js',
  ignoreURLParametersMatching: [
    /^utm_/,
    /^fbclid$/
  ]
};