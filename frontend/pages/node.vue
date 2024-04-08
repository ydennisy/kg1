<script setup lang="ts">
interface RelatedNodes {
  id: string;
  url: string;
  title: string;
}

interface Node {
  id: string;
  url: string;
  title: string;
  summary: string;
  related: RelatedNodes[];
}

const node = ref<Node | null>(null);
const loading = ref(true);

const config = useRuntimeConfig();
const route = useRoute();
const router = useRouter();

const apiBase = config.public.apiBase;

const getNode = async () => {
  const result = await fetch(`${apiBase}/api/node?id=${route.query.id}`, {
    method: 'GET',
  });
  if (!result.ok) {
    // TODO: show user a proper error!
    console.error('Ooops');
    loading.value = false;
    return;
  }
  const resultNode: Node = await result.json();
  node.value = resultNode;
  loading.value = false;
};

const askWithNode = () => {
  if (node.value) {
    router.push({ path: '/ask', query: { id: node.value.id } });
  }
};

onMounted(() => {
  getNode();
});
</script>

<template>
  <div v-if="loading" class="flex justify-center items-center pt-12">
    <Spinner />
  </div>
  <div v-else-if="node" class="mx-auto p-4 space-y-4">
    <p class="text-lg font-semibold text-gray-800">
      {{ node.title }}
      <button
        @click="askWithNode"
        class="ml-2 bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-2 rounded text-xs"
      >
        Ask
      </button>
    </p>
    <p class="text-blue-600 hover:text-blue-800">
      <a :href="node.url" target="_blank" class="underline">{{ node.url }}</a>
    </p>
    <h2 class="text-xl font-bold text-gray-900">Summary</h2>
    <p class="text-gray-700">{{ node.summary }}</p>

    <div v-if="node.related && node.related.length" class="mt-4">
      <h3 class="text-lg font-semibold text-gray-900">Related</h3>
      <div class="overflow-auto">
        <table class="min-w-full leading-normal">
          <tbody>
            <tr
              v-for="relatedNode in node.related"
              :key="relatedNode.id"
              class="border-b border-gray-200"
            >
              <td class="px-2 py-1 text-sm">{{ relatedNode.title }}</td>
              <td class="px-2 py-1 text-sm">
                <a
                  :href="relatedNode.url"
                  target="_blank"
                  class="text-blue-600 hover:text-blue-800 underline"
                  >{{ relatedNode.url }}</a
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
