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
        
        // Map to store videos (both .mp4 and YouTube links)
        const videoMap = new Map();
        
        // Handle video files (.mp4)
        videoFiles.forEach(file => {
          const mp4Match = file.match(/^video-(\d{1,2})\.mp4$/);
          if (mp4Match) {
            const pageNumber = mp4Match[1];
            videoMap.set(pageNumber, `/videos/${file}`);
          }
          
          // Handle text files with YouTube links
          const txtMatch = file.match(/^video-(\d{1,2})\.txt$/);
          if (txtMatch) {
            const pageNumber = txtMatch[1];
            const filePath = path.join(videosPath, file);
            const youtubeLink = fs.readFileSync(filePath, 'utf-8').trim();
            videoMap.set(pageNumber, youtubeLink);
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
              associatedVideo: videoMap.get(pageNumber) || null,  // Use either mp4 or YouTube link
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
