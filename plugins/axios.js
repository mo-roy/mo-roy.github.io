// plugins/axios.js
import axios from 'axios';

export default defineNuxtPlugin(() => {
  const axiosInstance = axios.create({
    baseURL: useRuntimeConfig().public.axios.baseURL,
  });

  // Optionally add interceptors or other custom configuration here
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
  );

  return {
    provide: {
      axios: axiosInstance,
    },
  };
});
