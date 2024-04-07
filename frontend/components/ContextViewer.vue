<script setup lang="ts">
import { ref } from 'vue';

interface Chunk {
  text: string;
  url: string;
}

defineProps<{ chunks: Chunk[] }>();

const isVisible = ref(false);

const toggleVisibility = () => {
  isVisible.value = !isVisible.value;
};
</script>

<template>
  <div class="p-2 rounded-sm">
    <div @click="toggleVisibility" class="flex items-center cursor-pointer">
      <svg
        :class="{ 'rotate-90': isVisible }"
        class="h-4 w-4 transition-transform"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5l7 7-7 7"
        ></path>
      </svg>
      <span class="ml-2 text-xs font-medium"
        >Found {{ chunks.length }} document chunks as context</span
      >
    </div>
    <div v-if="isVisible" class="mt-2">
      <div
        v-for="(chunk, index) in chunks"
        :key="index"
        class="p-2 border-b last:border-b-0 text-xs"
      >
        {{ chunk.text }} <br />
        <a :href="chunk.url" target="_blank">{{ chunk.url }}</a>
      </div>
    </div>
  </div>
</template>
