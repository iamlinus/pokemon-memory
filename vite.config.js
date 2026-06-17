import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  build: {
    target: 'es2019',
    outDir: 'dist',
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pokeball.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Pokémon Memory',
        short_name: 'PokéMemory',
        description: 'Ett memoryspel för 1–2 spelare byggt på Pokémon. Spela offline!',
        lang: 'sv',
        theme_color: '#cc0000',
        background_color: '#fffbe6',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff,woff2,svg,png,ico}'],
        // Cacha Pokémon-bilder och API-svar vid första laddning → fungerar offline sen.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname === 'raw.githubusercontent.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokemon-sprites',
              expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'pokeapi.co',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'pokeapi-data',
              expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
