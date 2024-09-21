import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  // Application level configurations
  app: {
    head: {
      title: 'Portfolio | Morgane Roy',
      htmlAttrs: {
        lang: 'fr'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: 'Portfolio of Morgane Roy' },
        { name: 'format-detection', content: 'telephone=no' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // Include global CSS styles
  css: [
    '@/assets/styles/global.css',
    'aos/dist/aos.css' // Animation on Scroll library CSS
  ],

  // Client-side plugins
  plugins: [
    { src: '~/plugins/scrollmagic.js', mode: 'client' }, // ScrollMagic Plugin for client-side
    { src: '~/plugins/aos.js', mode: 'client' }, // AOS (Animate on Scroll) Plugin for client-side
    { src: '~/plugins/axios.js', mode: 'client' }, // Axios Plugin for client-side
    { src: '~/plugins/gsap.js', mode: 'client' } // GSAP Plugin for client-side
  ],

  // Automatically import components
  components: true,

  // Build configuration
  build: {
    transpile: [
      'gsap' // Ensure GSAP is transpiled for compatibility
    ],
    extractCSS: true // Extract CSS for better caching and performance
  },

  // Modules: Replace '@nuxtjs/axios' with standard Axios if needed
  modules: [],

  // Runtime configuration for public and private environment variables
  runtimeConfig: {
    public: {
      axios: {
        baseURL: process.env.BASE_URL || 'http://localhost:3000' // Public runtime config for Axios
      }
    },
    private: {
      apiSecret: process.env.API_SECRET // Private runtime config for sensitive data
    }
  },

  // Server middleware configuration for API routes
  serverMiddleware: [
    { path: '/api/portfolio-items', handler: '~/server/middleware.js' } // Server-side route handler
  ],

  // Nuxt compatibility and experimental features
  experimental: {
    // Enabling support for the latest experimental features in Nuxt 3
    asyncEntry: true
  },

  ssr:false,
  target:'static',
  app: {
    baseURL:'/mo-roy.github.io/',
  },

  // Set the compatibility date for Nuxt features
  compatibilityDate: '2024-09-21'
});
