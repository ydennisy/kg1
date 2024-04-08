<script setup lang="ts">
const results = ref([]);
const isLoading = ref(false);

const config = useRuntimeConfig();
const router = useRouter();
const route = useRoute();

const apiBase = config.public.apiBase;

const search = async (query: string) => {
  isLoading.value = true;
  const result = await useFetch(`${apiBase}/api/search`, {
    method: 'GET',
    query: { q: query },
  });
  // @ts-ignore
  results.value = result.data.value;
  router.push({ path: route.path, query: { q: query } });
  isLoading.value = false;
};

const navigateToNode = (id: string) => {
  router.push({ path: `/node`, query: { id: id } });
};

onMounted(async () => {
  if (route.query.q) {
    await search(String(route.query.q));
  }
});
</script>

<template>
  <SearchBar :is-loading="isLoading" @search="search" />

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
