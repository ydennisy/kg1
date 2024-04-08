<script setup lang="ts">
import md from 'markdown-it';

const renderer = md();
const results = ref('');
const context = ref([]);
const isLoading = ref(false);

const config = useRuntimeConfig();
const route = useRoute();

const apiBase = config.public.apiBase;

const chat = async (query: string) => {
  isLoading.value = true;
  results.value = '';
  context.value = [];

  const askNode = route.query.id;

  let isContextReceived = false;
  let contextBuffer = '';
  let apiUrl = `${apiBase}/api/ask?q=${encodeURIComponent(query)}`;
  apiUrl = !!askNode ? `${apiUrl}&id=${askNode}` : `${apiUrl}`;
  const response = await fetch(apiUrl);

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
</script>

<template>
  <div>
    <SearchBar :is-loading="isLoading" @search="chat" />
    <div v-show="context.length > 0">
      <ContextViewer :chunks="context" />
    </div>
    <div class="mt-4">
      <p v-html="renderer.render(results)"></p>
    </div>
  </div>
</template>
