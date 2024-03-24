<script setup lang="ts">
// TODO: bump @types/'markdown-it' when released
// or we can downgrade.
// Use as a plugin: https://github.com/nuxt-community/markdownit-module/issues/47
//@ts-ignore
import md from 'markdown-it';

const renderer = md();
const input = ref('');
const results = ref('');

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;
const chat = async () => {
  results.value = '';
  const response = await fetch(
    `${apiBase}/api/ask?q=${encodeURIComponent(input.value)}`
  );
  //@ts-ignore
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const textChunk = decoder.decode(value, { stream: true });
    //@ts-ignore
    results.value += textChunk;
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
    <div class="mt-4">
      <p v-html="renderer.render(results)"></p>
    </div>
  </div>
</template>
