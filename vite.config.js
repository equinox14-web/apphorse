import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Important: permet le prompt de mise à jour
      includeAssets: ['favicon.ico', 'pwa-icon.png', 'robots.txt'],

      manifest: {
        name: 'Equinox - Gestion Écurie & Élevage',
        short_name: 'Equinox',
        version: '2.0.0', // Force PWA update
        description: 'L\'application complète pour la gestion de vos écuries, chevaux, et élevages. Suivi sanitaire, reproduction, et plus encore.',
        theme_color: '#7c3aed',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/pwa-icon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['productivity', 'finance', 'business']
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // Augmenter la limite pour les gros fichiers (Firebase, AI, etc.)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB

        // Stratégie de cache
        runtimeCaching: [
          {
            // Cache des API Firebase
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-storage-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 jours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache des images
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 jours
              }
            }
          },
          {
            // Cache des fonts Google
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 an
              }
            }
          },
          {
            // Network First pour les données dynamiques
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 jour
              },
              networkTimeoutSeconds: 10
            }
          }
        ],

        // Nettoyage automatique du cache obsolète
        cleanupOutdatedCaches: true,

        // Ignorer les erreurs lors du build
        skipWaiting: false, // Important: ne pas auto-activer le nouveau SW
        clientsClaim: false // Important: ne pas prendre le contrôle immédiatement
      },

      devOptions: {
        enabled: false, // Désactiver en dev pour éviter les conflits
        type: 'module'
      }
    })
  ],
})
