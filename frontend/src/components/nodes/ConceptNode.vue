<script setup lang="ts">
defineProps(['data']);
</script>

<template>
  <div class="concept-node">
    <strong>{{ data.label }}</strong>
    <p>{{ data.description }}</p>
  </div>
</template>

<style scoped>
.concept-node {
  width: 200px;
  padding: 10px;
  background: #f9f;
  border: 1px solid #333;
  border-radius: 5px;
}
</style>
