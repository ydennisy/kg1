<script setup lang="ts">
import md from 'markdown-it';

const renderer = md();
const results = ref('');
const context = ref([]);
const isLoading = ref(false);
const isAskWithNode = ref(false);

const config = useRuntimeConfig();
const route = useRoute();
const router = useRouter();

const apiBase = config.public.apiBase;
const nodeId = route.query.id;
const nodeTitle = route.query.title;
isAskWithNode.value = !!nodeId;

const chat = async (query: string) => {
  isLoading.value = true;
  results.value = '';
  context.value = [];

  let isContextReceived = false;
  let contextBuffer = '';

  const token = useSupabaseSession().value?.access_token;
  // TODO: handle re-auth
  if (!token) return;
  let apiUrl = `${apiBase}/api/ask?q=${encodeURIComponent(query)}`;
  apiUrl = isAskWithNode.value ? `${apiUrl}&id=${nodeId}` : `${apiUrl}`;
  const response = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 404) {
    results.value =
      'Sorry, there are no relevant documents in the knowledge graph and I am not at liberty to answer based on my own opinions. Please [index](/index) some documents!';
    isLoading.value = false;
    return;
  } else if (!response.ok) {
    results.value = 'Sorry, an unexpected error occured, please try again.';
    isLoading.value = false;
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    results.value = 'Sorry, an unexpected error occured, please try again.';
    return;
  }
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const textChunk = decoder.decode(value, { stream: true });

    if (isContextReceived === false) {
      contextBuffer += textChunk;
      if (contextBuffer.includes('<END_OF_CONTEXT>')) {
        const [contextChunks, ..._] = contextBuffer.split('<END_OF_CONTEXT>');
        const { context: parsedContext } = JSON.parse(contextChunks);
        context.value = parsedContext;
        isContextReceived = true;
      }
    } else {
      results.value += textChunk;
    }
  }

  isLoading.value = false;
};

const clearAskWithNode = async () => {
  await router.replace({});
  isAskWithNode.value = false;
  context.value = [];
};
</script>

<template>
  <div>
    <!-- Search Bar -->
    <SearchBar :is-loading="isLoading" @search="chat" />

    <!-- Notification Banner -->
    <div
      v-if="isAskWithNode"
      class="bg-gray-100 border border-gray-300 text-slate-600 mt-2 px-4 py-2 rounded-md relative"
      role="alert"
    >
      <span class="block sm:inline text-xs"
        >You are using the document
        <strong class="font-bold text-xs">"{{ nodeTitle }}"</strong> as context
        for your question, to use all documents
        <strong
          class="underline cursor-pointer font-bold text-xs"
          @click="clearAskWithNode"
          >click here</strong
        >.</span
      >
    </div>

    <!-- Context / Chunks Viewer -->
    <div v-show="context.length > 0">
      <ContextViewer :chunks="context" />
    </div>

    <!-- Streamed Markdown Area -->
    <div class="mt-4">
      <p v-html="renderer.render(results)"></p>
    </div>
  </div>
</template>
