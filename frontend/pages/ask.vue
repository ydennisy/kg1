<script setup lang="ts">
import md from 'markdown-it';

const renderer = md();
const input = ref('');
const results = ref('');
const context = ref([]);

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

const chat = async () => {
  results.value = '';
  context.value = [];
  let isContextReceived = false;
  let contextBuffer = '';
  const response = await fetch(
    `${apiBase}/api/ask?q=${encodeURIComponent(input.value)}`
  );
  if (response.status === 404) {
    results.value =
      'Sorry, there are no relevant documents in the knowledge graph and I am not at liberty to answer based on my own opinions. Please [index](/index) some documents!';
    return;
  } else if (!response.ok) {
    results.value = 'Sorry, an unexpected error occured, please try again.';
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

  input.value = '';
};
</script>

<template>
  <div>
    <div class="relative mt-2 rounded-md">
      <input
        autofocus
        v-model="input"
        @keydown.enter="chat"
        placeholder="How can I help?"
        class="block w-full rounded-md border-0 py-3 pl-10 pr-20 text-gray-900 text-lg ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-600"
      />
      <div class="absolute inset-y-0 right-0 flex items-center"></div>
    </div>
    <div v-show="context.length > 0">
      <ContextViewer :chunks="context" />
    </div>
    <div class="mt-4">
      <p v-html="renderer.render(results)"></p>
    </div>
  </div>
</template>
