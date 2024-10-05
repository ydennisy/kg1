<script setup lang="ts">
interface SearchResult {
  id: string;
  title: string;
  url: string;
  score: number;
}

const results = ref<SearchResult[]>([]);
const isLoading = ref(false);
const isResultsEmpty = ref(false);
const lastSearchQuery = ref('');
const searchMode = ref('');
const selectedContextIds = ref<Set<string>>(new Set());
const searchTime = ref(0);

const selectedContextTitles = computed(() => {
  return results.value
    .filter((item) => selectedContextIds.value.has(item.id))
    .map((item) => item.title);
});

const config = useRuntimeConfig();
const router = useRouter();
const route = useRoute();

const contextCount = computed(() => selectedContextIds.value.size);

const apiBase = config.public.apiBase;

const search = async (query: string) => {
  const startTime = performance.now();
  isLoading.value = true;
  isResultsEmpty.value = false;
  lastSearchQuery.value = query;

  // NOTE: this adds the query to the current URL.
  router.push({ path: route.path, query: { q: query } });

  const token = useSupabaseSession().value?.access_token;
  // TODO: handle re-auth
  if (!token) return;
  const { data } = await useFetch<SearchResult[]>(`${apiBase}/api/search`, {
    method: 'GET',
    query: { q: query, mode: searchMode.value },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!data.value) {
    results.value = [];
  } else {
    results.value = data.value;
  }

  if (results.value.length === 0) {
    isResultsEmpty.value = true;
  }
  isLoading.value = false;
  searchTime.value = performance.now() - startTime;
};

const setSearchMode = (mode: string) => {
  searchMode.value = mode.toLocaleLowerCase();
};

const handleAddToContextCheckboxClick = (id: string) => {
  if (selectedContextIds.value.has(id)) {
    selectedContextIds.value.delete(id);
  } else {
    selectedContextIds.value.add(id);
  }
};

const navigateToNode = (id: string) => {
  router.push({ path: `/node`, query: { id } });
};

const navigateToAsk = () => {
  const ids = [...selectedContextIds.value].join(',');
  router.push({ path: `/ask`, query: { ids } });
};

onMounted(async () => {
  if (route.query.q) {
    await search(String(route.query.q));
  }
});
</script>

<template>
  <!-- Search Bar -->
  <SearchBar :is-loading="isLoading" @search="search">
    <template #toggle>
      <Listbox
        @selected="setSearchMode"
        default-option="Hybrid"
        :options="['Hybrid', 'Dense', 'LLM']"
      />
    </template>
  </SearchBar>

  <!-- Search Metrics -->
  <div
    v-if="!isLoading && lastSearchQuery"
    class="text-sm text-gray-500 mt-2 mb-4"
  >
    {{ results.length }} results found in {{ searchTime.toFixed(2) }} ms
  </div>

  <!-- Notification Banner -->
  <div
    v-if="isResultsEmpty"
    class="bg-blue-100 border border-blue-300 text-blue-600 mt-2 px-4 py-2 rounded-md relative"
    role="alert"
  >
    <strong class="font-bold text-xs">No results, </strong>
    <span class="block sm:inline text-xs"
      >found for "{{ lastSearchQuery }}" please try another query or
      <NuxtLink class="font-bold text-blue-600 underline" to="/index"
        >index</NuxtLink
      >
      some relevant documents.</span
    >
    <span class="absolute top-0 bottom-0 right-0 px-4 py-3">
      <svg
        @click="isResultsEmpty = false"
        class="fill-current h-4 w-4 text-blue-600 cursor-pointer"
        role="button"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
      >
        <title>Close</title>
        <path
          d="M14.348 14.849a1.2 1.2 0 01-1.697 0L10 11.846 7.349 14.849a1.2 1.2 0 11-1.697-1.697L8.303 10 5.652 6.849a1.2 1.2 0 111.697-1.697L10 8.302l2.651-3.15a1.2 1.2 0 011.697 1.697L11.697 10l2.651 2.849a1.2 1.2 0 010 1.697z"
        />
      </svg>
    </span>
  </div>

  <!-- Results table -->
  <table
    class="rounded-md mt-2 border-collapse table-auto w-full"
    v-if="results.length"
  >
    <thead class="bg-gray-200">
      <tr>
        <th class="rounded-tl-md py-2 px-4 text-left">Title</th>
        <th class="py-2 px-4 w32 relative group">
          <div class="flex justify-center">
            <button
              v-if="contextCount > 0"
              class="font-bold text-blue-600 underline"
              @click.prevent="navigateToAsk"
            >
              Context ({{ contextCount }})
            </button>
            <span v-else>Context</span>
          </div>
          <div
            v-if="contextCount > 0"
            class="absolute z-10 w-72 p-2 mt-1 font-normal text-xs bg-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          >
            <ul class="mt-1 list-disc list-inside">
              <li
                v-for="title in selectedContextTitles"
                :key="title"
                class="truncate"
              >
                {{ title }}
              </li>
            </ul>
          </div>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(item, index) in results"
        :key="index"
        class="border-b border-slate-200 hover:bg-gray-100 cursor-pointer"
        @click="navigateToNode(item.id)"
      >
        <td class="py-2 px-4">
          <div style="display: flex; align-items: center">
            <span style="margin-right: 10px">➔</span>
            <div>
              <div class="text-sm text-slate-600">{{ item.title }}</div>
              <div>
                <a :href="item.url" target="_blank" class="text-xs" @click.stop>
                  {{ item.url }}
                </a>
              </div>
            </div>
          </div>
        </td>
        <td class="py-2 px-4 text-center w-32">
          <input
            type="checkbox"
            :checked="selectedContextIds.has(item.id)"
            @change="handleAddToContextCheckboxClick(item.id)"
            @click.stop
          />
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style>
.group:hover .absolute {
  left: 50%;
  transform: translateX(-50%);
}
</style>
