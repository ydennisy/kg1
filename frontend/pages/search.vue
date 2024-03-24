<script setup lang="ts">
const input = ref('');
const results = ref([]);

const trimText = (text: string, maxChars: number = 1000) => {
  if (text.length > maxChars) {
    return `${text.substring(0, maxChars)}...`;
  }
  return text;
};

const search = async () => {
  const result = await useFetch('/api/search', {
    method: 'GET',
    query: { q: input.value },
  });
  //@ts-ignore
  results.value = result.data.value;
  input.value = '';
};
</script>

<template>
  <div>
    <div class="relative mt-2 rounded-md">
      <input
        autofocus
        v-model="input"
        @keydown.enter="search"
        placeholder="Search"
        class="block w-full rounded-md border-0 py-3 pl-10 pr-20 text-gray-900 text-lg ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-600"
      />
      <div class="absolute inset-y-0 right-0 flex items-center"></div>
    </div>
  </div>

  <table
    class="rounded-md mt-2 border-collapse table-auto w-full"
    v-if="results.length"
  >
    <thead class="bg-gray-200">
      <tr>
        <th class="rounded-tl-md py-2 px-4 text-left">Title</th>
        <th class="py-2 px-4 text-left">Summary</th>
        <th class="rounded-tr-md py-2 px-4 text-left">Score</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(item, index) in results"
        :key="index"
        class="border-b border-slate-200"
      >
        <td class="py-2 px-4">
          <div class="text-sm text-slate-600">{{ item.title }}</div>
          <div>
            <a :href="item.url" target="_blank" class="text-xs">{{
              item.url
            }}</a>
          </div>
        </td>
        <td class="py-2 px-4 text-xs text-slate-600">
          {{ item.summary }}
        </td>
        <td class="py-2 px-4 text-sm text-slate-600">{{ item.score }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
body {
}
</style>
