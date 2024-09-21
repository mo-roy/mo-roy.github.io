<template>
  <div class="portfolio-section" v-if="item.type === 'image'">
    <img :src="item.src" class="portfolio-image img-fluid" :alt="item.alt" />
  </div>
  <div class="portfolio-section" v-else-if="item.type === 'video'">
    <video class="portfolio-motion" controls>
      <source :src="item.src" type="video/mp4" />
      Navigateur non supporté.
    </video>
  </div>
</template>

<script>
export default {
  props: {
    item: {
      type: Object,
      required: true
    }
  }
};
</script>

<style scoped>
.portfolio-section {
  width: 100%;
  padding: 0;
  height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #000;
  margin-bottom: 20px;
}
.portfolio-image {
  max-width: 90%;
  max-height: 90%;
}
.portfolio-motion {
  position: absolute;
  top: 55%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70%;
  height: auto;
  max-width: 70%;
  max-height: 70%;
}
/* Media query for mobile devices */
@media (max-width: 767.98px) {
  .portfolio-section {
    margin-bottom: 10px;
    height: auto;
    border-bottom: 0;
    flex-direction: column;
    padding: 10px;
  }
  .portfolio-image {
    max-width: 100%;
    max-height: auto;
  }
}
</style>
