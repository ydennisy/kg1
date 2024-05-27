<script setup lang="ts">
import { formatDistance } from 'date-fns';

interface IndexFeedResult {
  id: string;
  created_at: string;
  source: string;
  status: string;
  url: string;
}

definePageMeta({ path: '/index' });

const input = ref('');
const urlsCount = ref(0);
const urls = ref();
const indexingStatusMessage = ref('');
const indexFeedResults = ref<IndexFeedResult[]>([]);

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

const indexWebPages = async () => {
  indexingStatusMessage.value = 'Indexing...';
  const token = useSupabaseSession().value?.access_token;
  // TODO: handle re-auth
  if (!token) return;
  const result = await useFetch(`${apiBase}/api/index`, {
    method: 'POST',
    body: { urls: urls.value },
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (result.status.value == 'error') {
    indexingStatusMessage.value = 'Error';
  } else {
    indexingStatusMessage.value = 'Success';
  }

  setTimeout(() => {
    input.value = '';
    urlsCount.value = 0;
    urls.value = [];
    indexingStatusMessage.value = '';
  }, 3000);
};

const formatTimeToHumanFriendly = (time: string) => {
  return formatDistance(new Date(time), new Date(), { addSuffix: true });
};

const fetchIndexedPages = async () => {
  const token = useSupabaseSession().value?.access_token;
  // TODO: handle re-auth
  if (!token) return;
  const { data } = await useFetch<[IndexFeedResult]>(
    `${apiBase}/api/index-feed`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (data.value) {
    indexFeedResults.value = data.value;
  } else {
    indexFeedResults.value = [];
  }
};

const fetchIndexedPagesIfTabInFocus = async () => {
  if (document.hasFocus()) {
    await fetchIndexedPages();
  }
};

let indexFeedPollingInterval: NodeJS.Timeout;

onMounted(async () => {
  await fetchIndexedPages();
  indexFeedPollingInterval = setInterval(fetchIndexedPagesIfTabInFocus, 10000);
});

onUnmounted(() => {
  clearInterval(indexFeedPollingInterval);
});

watch(input, (newValue) => {
  const inputUrls = newValue.split(/[\n,]+/).filter(Boolean);
  urlsCount.value = inputUrls.length;
  urls.value = inputUrls;
});
</script>

<template>
  <!-- Indexing Input Textarea -->
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

  <!-- URL Index Feed Table -->
  <table
    class="rounded-md mt-2 border-collapse table-auto w-full"
    v-if="indexFeedResults.length"
  >
    <thead class="bg-gray-200">
      <tr>
        <th class="rounded-tl-md py-2 px-4 text-left">URL</th>
        <th class="py-2 px-4 text-left">Submitted</th>
        <th class="py-2 px-4 text-left">Source</th>
        <th class="rounded-tr-md py-2 px-4 text-left">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(item, index) in indexFeedResults"
        :key="index"
        class="border-b border-slate-200 hover:bg-gray-100 cursor-pointer"
      >
        <td class="py-2 px-4 text-xs text-slate-600">
          <a :href="item.url" target="_blank" class="text-xs" @click.stop>
            {{ item.url }}
          </a>
        </td>
        <td class="py-2 px-4 text-xs text-slate-600">
          {{ formatTimeToHumanFriendly(item.created_at) }}
        </td>
        <td class="py-2 px-4 text-xs text-slate-600">{{ item.source }}</td>
        <td class="py-2 px-4 text-xs text-slate-600">{{ item.status }}</td>
      </tr>
    </tbody>
  </table>
</template>
