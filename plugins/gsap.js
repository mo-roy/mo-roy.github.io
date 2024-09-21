// plugins/gsap.client.js
import { gsap } from 'gsap';

export default defineNuxtPlugin(() => {
  return {
    provide: {
      gsap: gsap
    }
  }
});
