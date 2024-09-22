import { defineNuxtConfig } from 'nuxt/config';
import fs from 'fs'; // Import the file system module
import path from 'path'; // Import the path module

export default defineNuxtConfig({
  app: {
    baseURL: '',
    buildAssetsDir: 'assets',
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
      link: []
    }
  },

  publicPath: process.env.NODE_ENV === "production" ? "/mo-roy.github.io/" : "/",

  generate: {
    routes: ['']
  },

  css: [
    '@/assets/styles/global.css',
  ],
  plugins: [
  ],
  components: true,
  build: {
    transpile: ['gsap'],
    extractCSS: true
  },
  modules: [],
  runtimeConfig: {
    private: {
      apiSecret: process.env.API_SECRET
    }
  },
  ssr: false,
  target: 'static',
  router: {
    base: ''
  },
  hooks: {
    'build:before': async () => {
      try {
        const imagesPath = path.join(process.cwd(), 'public', 'images');
        const videosPath = path.join(process.cwd(), 'public', 'videos');
        
        const imageFiles = fs.readdirSync(imagesPath);
        const videoFiles = fs.readdirSync(videosPath);
        
        const videoMap = new Map();
        videoFiles.forEach(file => {
          const match = file.match(/^video-(\d{1,2})\.mp4$/);
          if (match) {
            const pageNumber = match[1];
            videoMap.set(pageNumber, `/videos/${file}`);
          }
        });
        
        const portfolioItems = [];
        imageFiles.forEach(file => {
          const match = file.match(/^p(\d{1,2})\.jpg$/);
          if (match) {
            const pageNumber = match[1];
            portfolioItems.push({
              type: 'image',
              src: `/images/${file}`,
              alt: `Image: ${file}`,
              associatedVideo: videoMap.get(pageNumber) || null,
            });
          }
        });

        const outputPath = path.join(process.cwd(), 'public', 'portfolio-items.json');
        fs.writeFileSync(outputPath, JSON.stringify(portfolioItems, null, 2));
        console.log("Portfolio items JSON generated!");
      } catch (error) {
        console.error("Error generating portfolio items:", error);
      }
    }
  },
  compatibilityDate: '2024-09-21'
});
