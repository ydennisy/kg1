<script setup lang="ts">
defineProps(['data']);
</script>

<template>
  <div class="article-node">
    <a :href="data.url" target="_blank">{{ data.label }}</a>
  </div>
</template>

<style scoped>
.article-node {
  width: 200px;
  padding: 10px;
  background: #9f9;
  border: 1px solid #333;
  border-radius: 5px;
}
</style>
