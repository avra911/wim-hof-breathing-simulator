module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{html,js,css,woff2,png,jpg,svg,mp3,wav,json}'
  ],
  swDest: 'dist/sw.js',
  ignoreURLParametersMatching: [
    /^utm_/,
    /^fbclid$/
  ],
  maximumFileSizeToCacheInBytes: 5242880,
  skipWaiting: true,
  clientsClaim: true
};