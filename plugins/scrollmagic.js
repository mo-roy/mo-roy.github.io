// plugins/scrollmagic.client.js
import ScrollMagic from 'scrollmagic';

export default defineNuxtPlugin(() => {
  return {
    provide: {
      scrollMagic: ScrollMagic
    }
  }
});
