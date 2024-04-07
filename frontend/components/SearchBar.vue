<script setup lang="ts">
const input = ref('');

defineProps({
  isLoading: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['search']);

// TODO: move into utils folder.
const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const onSearch = async () => {
  emit('search', input.value);
  await sleep(2000);
  input.value = '';
};
</script>

<template>
  <div class="relative mt-2 rounded-md">
    <input
      autofocus
      v-model="input"
      @keydown.enter="onSearch"
      placeholder="How can I help?"
      class="block w-full rounded-md border-0 py-3 pl-10 pr-20 text-gray-900 text-lg ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-600"
    />
    <div class="absolute inset-y-0 right-0 flex items-center pr-3">
      <Spinner v-if="isLoading" />
    </div>
  </div>
</template>
