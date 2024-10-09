<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { formatDistance } from 'date-fns';

interface Node {
  id: string;
  title: string;
  url: string;
  created_at: string;
  updated_at: string;
}

const nodes = ref<Node[]>([]);
const isLoading = ref(true);
const isEmpty = ref(false);

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

const fetchNodes = async () => {
  const token = useSupabaseSession().value?.access_token;
  // TODO: handle re-auth
  if (!token) return;

  const { data } = await useFetch<Node[]>(`${apiBase}/api/index-feed`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (data.value) {
    nodes.value = data.value;
    isEmpty.value = data.value.length === 0;
  } else {
    nodes.value = [];
    isEmpty.value = true;
  }
  isLoading.value = false;
};

onMounted(fetchNodes);

const formatDate = (dateString: string) => {
  return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
};
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">Indexed Nodes</h1>

    <div v-if="isLoading" class="text-center">
      <p class="text-gray-600">Loading...</p>
    </div>

    <div v-else-if="isEmpty" class="text-center">
      <p class="text-gray-600">No nodes have been indexed yet.</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead class="bg-gray-100">
          <tr>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Title
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              URL
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Created
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Updated
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="node in nodes" :key="node.id" class="hover:bg-gray-50">
            <td class="px-4 py-4 whitespace-nowrap text-sm">
              {{ node.title }}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm">
              <a
                :href="node.url"
                target="_blank"
                class="text-blue-600 hover:underline"
                >{{ node.url }}</a
              >
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm">
              {{ formatDate(node.created_at) }}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm">
              {{ formatDate(node.updated_at) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
