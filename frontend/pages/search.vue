<script setup lang="ts">
interface Result {
  id: string;
  title: string;
  url: string;
  score: number;
}

const results = ref<Result[]>([]);
const isLoading = ref(false);
const isResultsEmpty = ref(false);
const lastSearchQuery = ref('');

const config = useRuntimeConfig();
const router = useRouter();
const route = useRoute();

const apiBase = config.public.apiBase;

const search = async (query: string) => {
  isLoading.value = true;
  isResultsEmpty.value = false;
  lastSearchQuery.value = query;

  const token = useSupabaseSession().value?.access_token;
  // TODO: handle re-auth
  if (!token) return;
  const { data } = await useFetch<Result[]>(`${apiBase}/api/search`, {
    method: 'GET',
    query: { q: query },
    headers: { Authorization: `Bearer ${token}` },
  });
  // TODO: handle re-auth
  if (!data.value) {
    results.value = [];
  } else {
    results.value = data.value;
  }
  router.push({ path: route.path, query: { q: query } });
  if (results.value.length === 0) {
    isResultsEmpty.value = true;
  }
  isLoading.value = false;
};

const navigateToNode = (id: string) => {
  router.push({ path: `/node`, query: { id } });
};

onMounted(async () => {
  if (route.query.q) {
    await search(String(route.query.q));
  }
});
</script>

<template>
  <!-- Search Bar -->
  <SearchBar :is-loading="isLoading" @search="search" />

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
        <th class="rounded-tr-md py-2 px-4 text-left">Score</th>
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
        <td class="py-2 px-4 text-sm text-slate-600">{{ item.score }}</td>
      </tr>
    </tbody>
  </table>
</template>
