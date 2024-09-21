<template>
  <div 
    :class="['portfolio-slideshow', { 'dark-mode': isDarkMode, 'light-mode': !isDarkMode }]" 
    @touchstart="onTouchStart" 
    @touchend="onTouchEnd"
    @mousemove="handleMouseMove"
  >
    <!-- Particle Background -->
    <canvas ref="particleCanvas" class="particle-canvas"></canvas>

    <!-- Theme Toggle Button (Always Visible) -->
    <button @click="toggleMode" class="theme-toggle-btn" aria-label="Toggle Theme">
      <span class="theme-icon">{{ isDarkMode ? '🌙' : '☀️' }}</span>
    </button>

    <!-- Indicators (Always Visible) -->
    <div class="indicators">
      <span 
        v-for="(item, index) in portfolioItems" 
        :key="index" 
        :class="['indicator', { active: index === currentIndex }]"
        @click="changeItem(index)"
        :aria-label="'Go to slide ' + (index + 1)"
        role="button"
        tabindex="0"
        @keydown.enter.prevent="changeItem(index)"
        @keydown.space.prevent="changeItem(index)"
      ></span>
    </div>

    <!-- Loading Indicator (Displayed Until All Media Are Preloaded) -->
    <template v-if="loading">
      <div class="loading-overlay" aria-label="Loading">
        <div class="spinner" role="status" aria-live="polite">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    </template>
    
    <!-- Slideshow Content -->
    <template v-else>
      <!-- Portfolio Items (All Rendered with class-based visibility) -->
      <div 
        v-for="(item, index) in portfolioItems" 
        :key="item.id" 
        class="portfolio-item"
        :class="{ active: index === currentIndex }"
        ref="portfolioItemsRefs"
      >
        <!-- Media Container -->
        <div class="media-container">
          <!-- Display Image -->
          <img 
            v-if="item.type === 'image'" 
            :src="item.src" 
            :alt="item.alt" 
            class="portfolio-image img-fluid"
          />

          <!-- Display Associated Video Centered Over Image -->
          <video 
            v-if="item.associatedVideo" 
            class="portfolio-video" 
            controls
            preload="metadata"
          >
            <source :src="item.associatedVideo" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import anime from 'animejs/lib/anime.es.js';
import throttle from 'lodash/throttle';
import Particle from '~/src/utils/particle.js'; // Import Particle class

export default {
  name: 'PortfolioSlideshow',
  data() {
    return {
      portfolioItems: [], // Portfolio items array
      currentIndex: 0, // Current item index
      isAnimating: false, // Flag to prevent multiple animations
      touchStartY: 0, // Touch start position
      direction: 'next', // Navigation direction
      isDarkMode: true, // Theme state: Dark Mode is default
      loading: true, // Loading state
      wheelThrottleDelay: 100, // Throttle delay set to 100ms
      wheelDeltaThreshold: 5, // Minimum delta to trigger navigation
      particles: [], // Array to hold particle instances
      animationFrameId: null, // To store the requestAnimationFrame ID
      ctx: null, // Canvas context
      throttledHandleWheel: null, // Throttled wheel handler
      preloadedImages: {}, // Object to store preloaded images
      preloadedVideos: {}, // Object to store preloaded videos
    };
  },
  computed: {
    currentItem() {
      return this.portfolioItems[this.currentIndex];
    },
    portfolioItemsRefs() {
      // Collect all portfolio item refs for animations
      return this.$refs.portfolioItemsRefs || [];
    }
  },
  async mounted() {
    // Initialize theme based on localStorage
    const savedTheme = localStorage.getItem('isDarkMode');
    if (savedTheme !== null) {
      this.isDarkMode = savedTheme === 'true';
    } else {
      this.isDarkMode = true; // Default to Dark Mode
    }

    // Fetch portfolio items from API
    try {
      const response = await fetch('/api/portfolio-items');
      if (response.ok) {
        this.portfolioItems = await response.json();
      } else {
        console.error("Failed to fetch portfolio items.");
      }
    } catch (error) {
      console.error("Error fetching portfolio items:", error);
    }

    // Preload all media
    try {
      await this.preloadMedia();
    } catch (error) {
      console.error("Error preloading media:", error);
    }

    // Set loading to false after media are preloaded
    this.loading = false;

    // Animate the initial item
    this.$nextTick(() => {
      this.animateInitialItem();
    });

    // Initialize Particle Background
    this.initParticles();

    // Create the throttled wheel handler
    this.throttledHandleWheel = throttle(this.handleWheel, this.wheelThrottleDelay);

    // Add event listeners
    this.$el.addEventListener('wheel', this.throttledHandleWheel, { passive: true });
    this.$el.addEventListener('touchstart', this.onTouchStart, false);
    this.$el.addEventListener('touchend', this.onTouchEnd, false);
    window.addEventListener('keydown', this.handleKeyDown);
  },
  beforeUnmount() { // Use beforeDestroy if you're using Vue 2
    // Remove event listeners
    this.$el.removeEventListener('wheel', this.throttledHandleWheel);
    this.$el.removeEventListener('touchstart', this.onTouchStart, false);
    this.$el.removeEventListener('touchend', this.onTouchEnd, false);
    window.removeEventListener('keydown', this.handleKeyDown);

    // Stop particle animation
    cancelAnimationFrame(this.animationFrameId);

    // Remove resize event listener
    window.removeEventListener('resize', this.resizeCanvas);
  },
  methods: {
    /**
     * Handle mouse wheel events with throttling
     */
    handleWheel(event) {
      if (this.isAnimating) return; // Prevent multiple triggers

      const delta = event.deltaY;

      // Check if the scroll delta exceeds the threshold
      if (delta > this.wheelDeltaThreshold) {
        this.direction = 'next';
        this.nextItem();
      } else if (delta < -this.wheelDeltaThreshold) {
        this.direction = 'prev';
        this.prevItem();
      }
    },

    /**
     * Handle touch start event for swipe detection
     */
    onTouchStart(event) {
      this.touchStartY = event.changedTouches[0].screenY;
    },

    /**
     * Handle touch end event for swipe detection
     */
    onTouchEnd(event) {
      const touchEndY = event.changedTouches[0].screenY;
      const deltaY = this.touchStartY - touchEndY;

      const touchThreshold = 70; // Increased touch threshold for swipe

      if (deltaY > touchThreshold) {
        this.direction = 'next';
        this.nextItem();
      } else if (deltaY < -touchThreshold) {
        this.direction = 'prev';
        this.prevItem();
      }
    },

    /**
     * Handle keyboard navigation
     */
    handleKeyDown(event) {
      if (this.isAnimating) return;

      if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        this.direction = 'next';
        this.nextItem();
      } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        this.direction = 'prev';
        this.prevItem();
      }
    },

    /**
     * Navigate to the next portfolio item
     */
    nextItem() {
      if (this.currentIndex < this.portfolioItems.length - 1) {
        this.changeItem(this.currentIndex + 1);
      } else {
        // Loop back to the first item
        this.changeItem(0);
      }
    },

    /**
     * Navigate to the previous portfolio item
     */
    prevItem() {
      if (this.currentIndex > 0) {
        this.changeItem(this.currentIndex - 1);
      } else {
        // Loop to the last item
        this.changeItem(this.portfolioItems.length - 1);
      }
    },

    /**
     * Change the current portfolio item with 3D transition
     */
    async changeItem(newIndex) {
      if (this.isAnimating || newIndex === this.currentIndex) return; // Prevent multiple simultaneous animations and redundant transitions

      this.isAnimating = true;
      const oldIndex = this.currentIndex;
      const oldItem = this.portfolioItemsRefs[oldIndex];

      if (oldItem) {
        // Animate the old item out with 3D effect
        await anime({
          targets: oldItem,
          opacity: [1, 0],
          translateY: [0, this.direction === 'next' ? -100 : 100],
          translateZ: [0, -500], // Move the item away on the Z-axis
          rotateY: this.direction === 'next' ? [0, -20] : [0, 20], // Optional rotation
          scale: [1, 0.8], // Slightly scale down for depth
          duration: 800,
          easing: 'easeInExpo'
        }).finished;
      }

      // Update the current index after the old item is out
      this.currentIndex = newIndex;

      // Wait for Vue to update the DOM with the new item
      await this.$nextTick();

      const newItem = this.portfolioItemsRefs[newIndex];
      if (newItem) {
        // Set initial state for incoming item
        anime.set(newItem, {
          opacity: 0,
          translateY: this.direction === 'next' ? 100 : -100,
          translateZ: 500, // Start far away on the Z-axis
          rotateY: this.direction === 'next' ? 20 : -20, // Optional rotation
          scale: 0.8 // Start slightly scaled down
        });

        // Animate the new item in with 3D effect
        anime({
          targets: newItem,
          opacity: [0, 1],
          translateY: [this.direction === 'next' ? 100 : -100, 0],
          translateZ: [500, 0], // Move the item towards the screen
          rotateY: this.direction === 'next' ? [20, 0] : [-20, 0], // Optional rotation
          scale: [0.8, 1], // Scale up to normal size
          duration: 800,
          easing: 'easeOutExpo',
          complete: () => {
            this.isAnimating = false; // Reset the animation flag
          }
        });
      } else {
        this.isAnimating = false; // Reset if newItem isn't found
      }
    },

    /**
     * Animate the initial portfolio item
     */
    animateInitialItem() {
      const initialItem = this.portfolioItemsRefs[this.currentIndex];
      if (initialItem) {
        anime({
          targets: initialItem,
          opacity: [0, 1],
          translateY: [50, 0],
          translateZ: [500, 0], // Start from far away
          rotateY: [20, 0], // Optional rotation
          scale: [0.8, 1],
          duration: 800,
          easing: 'easeOutExpo'
        });
      }
    },

    /**
     * Toggle between Dark Mode and Light Mode
     */
    toggleMode() {
      this.isDarkMode = !this.isDarkMode;
      localStorage.setItem('isDarkMode', this.isDarkMode);
      
      // Update particle colors based on theme
      this.updateParticleColors();
    },

    /**
     * Update particle colors when theme changes
     */
    updateParticleColors() {
      const colors = this.isDarkMode 
        ? ['#ffffff', '#aaaaaa', '#cccccc'] 
        : ['#000000', '#555555', '#333333'];

      this.particles.forEach(particle => {
        particle.color = colors[Math.floor(Math.random() * colors.length)];
      });
    },

    /**
     * Preload all images and videos in the portfolioItems array.
     * Returns a promise that resolves when all media are loaded.
     */
    preloadMedia() {
      const promises = this.portfolioItems.map(item => {
        if (item.type === 'image') {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = item.src;
            img.onload = () => {
              this.preloadedImages[item.id] = img;
              resolve();
            };
            img.onerror = () => {
              console.warn(`Failed to load image: ${item.src}`);
              resolve(); // Resolve even if an image fails to load
            };
          });
        } else if (item.type === 'video' && item.associatedVideo) {
          return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = item.associatedVideo;
            video.onloadeddata = () => {
              this.preloadedVideos[item.id] = video;
              resolve();
            };
            video.onerror = () => {
              console.warn(`Failed to load video: ${item.associatedVideo}`);
              resolve(); // Resolve even if a video fails to load
            };
          });
        } else {
          return Promise.resolve();
        }
      });

      return Promise.all(promises);
    },

    /**
     * Initialize Particle Background
     */
    initParticles() {
      const canvas = this.$refs.particleCanvas;
      this.ctx = canvas.getContext('2d');
      this.resizeCanvas();

      // Create particles
      this.createParticles();

      // Start animation loop
      this.animateParticles();

      // Handle window resize
      window.addEventListener('resize', this.resizeCanvas);
    },

    /**
     * Resize canvas to fit the container
     */
    resizeCanvas() {
      const canvas = this.$refs.particleCanvas;
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;

      // Update canvas width and height for all particles
      this.particles.forEach(particle => {
        particle.canvasWidth = canvas.width;
        particle.canvasHeight = canvas.height;
      });
    },

    /**
     * Create particles for the background
     */
    createParticles() {
      const numParticles = 150; // Adjusted for performance
      const colors = this.isDarkMode 
        ? ['#ffffff', '#aaaaaa', '#cccccc'] 
        : ['#000000', '#555555', '#333333'];

      for (let i = 0; i < numParticles; i++) {
        const radius = Math.random() * 3 + 1;
        const x = Math.random() * this.$refs.particleCanvas.width;
        const y = Math.random() * this.$refs.particleCanvas.height;
        const vx = (Math.random() - 0.5) * 0.5;
        const vy = (Math.random() - 0.5) * 0.5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const particle = new Particle(
          x, 
          y, 
          vx, 
          vy, 
          radius, 
          color, 
          this.$refs.particleCanvas.width, 
          this.$refs.particleCanvas.height
        );
        this.particles.push(particle);
      }
    },

    /**
     * Animate particles on the canvas
     */
    animateParticles() {
      this.ctx.clearRect(0, 0, this.$refs.particleCanvas.width, this.$refs.particleCanvas.height);
      
      this.particles.forEach(particle => {
        particle.update();
        particle.draw(this.ctx);
      });

      // Request next frame
      this.animationFrameId = requestAnimationFrame(this.animateParticles);
    },

    /**
     * Handle mouse move for interactivity (optional)
     */
    handleMouseMove(event) {
      const rect = this.$refs.particleCanvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      this.particles.forEach(particle => {
        const dx = particle.x - mouseX;
        const dy = particle.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 100) {
          const angle = Math.atan2(dy, dx);
          const force = (100 - distance) / 100;
          particle.vx += Math.cos(angle) * force;
          particle.vy += Math.sin(angle) * force;
        }
      });
    },
  }
};
</script>

