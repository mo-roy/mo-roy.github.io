// plugins/aos.js
import AOS from 'aos';
import 'aos/dist/aos.css';

export default defineNuxtPlugin(() => {
  if (process.client) {
    AOS.init({
      // Options can go here
    });
  }
});
