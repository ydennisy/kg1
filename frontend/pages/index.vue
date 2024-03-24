<script setup lang="ts">
definePageMeta({ path: '/index' });

const input = ref('');
const urlsCount = ref(0);
const urls = ref();
const indexingStatusMessage = ref('');

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

const indexWebPages = async () => {
  indexingStatusMessage.value = 'Indexing...';
  const result = await useFetch(`${apiBase}/api/index`, {
    method: 'POST',
    body: { urls: urls.value },
    headers: {
      'Content-Type': 'application/json',
    },
  });
  // @ts-ignore
  const saveStatusMessage = result.data?.value.is_success ? 'Success' : 'Error';
  indexingStatusMessage.value = saveStatusMessage;

  setTimeout(() => {
    input.value = '';
    urlsCount.value = 0;
    urls.value = [];
    indexingStatusMessage.value = '';
  }, 3000);
};

watch(input, (newValue) => {
  const inputUrls = newValue.split(/[\n,]+/).filter(Boolean);
  urlsCount.value = inputUrls.length;
  urls.value = inputUrls;
});
</script>

<template>
  <div class="relative mt-2">
    <textarea
      placeholder="Enter the URL(s) you want to index, separated by commas or newlines."
      v-model="input"
      rows="10"
      class="border border-gray-300 rounded pl-4 pb-8 pt-4 pr-20 focus:outline-none focus:border-blue-500 text-gray-700 bg-white shadow-sm w-full"
    ></textarea>
    <!-- Display indexing message -->
    <span
      v-if="indexingStatusMessage"
      :class="{
        'text-green-300': indexingStatusMessage === 'Success',
        'text-red-300': indexingStatusMessage === 'Error',
      }"
      class="absolute bottom-2 left-4 bg-white bg-opacity-80 p-1 rounded text-sm text-gray-400"
    >
      {{ indexingStatusMessage }}
    </span>

    <!-- Display URLs count -->
    <span
      v-else
      class="absolute bottom-2 left-4 bg-white bg-opacity-80 p-1 rounded text-sm text-gray-400"
    >
      URLs to index: {{ urlsCount }}
    </span>
    <button
      type="submit"
      @click="indexWebPages"
      class="absolute bottom-0 right-0 mb-4 mr-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Index
    </button>
  </div>
</template>

<style scoped>
.url-count {
}
</style>
